import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from '@/utils/mapbox-gl-wrapper';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';
// Supabase removed - will use Node.js API

// Mapbox public token (this is safe to store in code as it's a public token)
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXMtbWFwYm94MjAyNSIsImEiOiJjbWd0cHZhc20wNGc1Mm1xMmZwY2NnbjdwIn0.vAUXdUR3_gZwu35mLimvCg';
interface Partner {
  id: string;
  store_name: string;
  retail_address: string;
  first_name: string;
  last_name: string;
  latitude: number;
  longitude: number;
  active_partnerships_count?: number;
  retail_category?: string;
  distance?: number;
  offer_image_url?: string;
  offer_call_to_action?: string;
  is_current_partner?: boolean;
  has_pending_request?: boolean;
  partnership_id?: string;
}
interface UserLocation {
  id: string;
  name: string;
  address: string;
}

interface PartnerMapProps {
  partners: Partner[];
  onSendRequest: (storeName: string) => void;
  onRefresh?: () => void;
  userLocations?: UserLocation[];
  isLoading?: boolean;
}
const PartnerMap: React.FC<PartnerMapProps> = ({
  partners,
  onSendRequest,
  onRefresh,
  userLocations: propUserLocations,
  isLoading = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedRequestPartner, setSelectedRequestPartner] = useState<Partner | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCancelPartner, setSelectedCancelPartner] = useState<Partner | null>(null);
  const [selectedMyLocations, setSelectedMyLocations] = useState<string[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [myLocations, setMyLocations] = useState<UserLocation[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Fetch user locations from API if not provided as props
  useEffect(() => {
    const fetchUserLocations = async () => {
      if (propUserLocations) {
        // Use locations from props
        setMyLocations(propUserLocations);
        return;
      }

      // Fetch from API if not provided
      try {
        const { get } = await import("@/services/apis");
        const response = await get({ 
          end_point: 'locations',
          token: true
        });
        
        if (response.success && response.data) {
          const formattedLocations = response.data
            .filter((loc: any) => loc && (loc._id || loc.id))
            .map((loc: any) => ({
              id: loc._id?.toString() || loc.id?.toString(),
              name: loc.name || 'Unnamed Location',
              address: loc.address || ''
            }));
          setMyLocations(formattedLocations);
        } else {
          setMyLocations([]);
        }
      } catch (error) {
        console.error('Error fetching user locations:', error);
        setMyLocations([]);
      }
    };

    fetchUserLocations();
  }, [propUserLocations]);

  // State to store user locations with coordinates
  const [userLocationsWithCoords, setUserLocationsWithCoords] = useState<Partner[]>([]);
  
  // Fetch user locations with coordinates and add them to partners
  useEffect(() => {
    const fetchUserLocationsForMap = async () => {
      const currentUserLocations = propUserLocations || myLocations;
      if (currentUserLocations.length === 0) {
        setUserLocationsWithCoords([]);
        return;
      }
      
      try {
        const { get } = await import("@/services/apis");
        const response = await get({ 
          end_point: 'locations',
          token: true
        });
        
        if (response.success && response.data) {
          const userLocs = response.data
            .filter((loc: any) => {
              const locId = loc._id?.toString() || loc.id?.toString();
              return currentUserLocations.some(ul => ul.id === locId);
            })
            .map((loc: any) => ({
              id: loc._id?.toString() || loc.id?.toString(),
              store_name: loc.name || 'Your Store',
              retail_address: loc.address || '',
              first_name: '',
              last_name: '',
              latitude: loc.latitude || 0,
              longitude: loc.longitude || 0,
              active_partnerships_count: 0,
              retail_category: '',
              distance: 0,
              offer_image_url: undefined,
              offer_call_to_action: undefined,
              is_current_partner: false,
              partnership_id: undefined
            }))
            .filter((loc: Partner) => loc.latitude !== 0 && loc.longitude !== 0);
          
          setUserLocationsWithCoords(userLocs);
        } else {
          setUserLocationsWithCoords([]);
        }
      } catch (error) {
        console.error('Error fetching user locations for map:', error);
        setUserLocationsWithCoords([]);
      }
    };
    
    fetchUserLocationsForMap();
  }, [propUserLocations, myLocations]);
  
  // Identify user's own stores by matching partner locations with userLocations
  // Use useMemo to recalculate when dependencies change
  const { ownStores, currentPartners, pendingPartners, availablePartners, sortedPartners, userLocationIds } = useMemo(() => {
    // Use propUserLocations if available, otherwise use myLocations state
    const currentUserLocations = propUserLocations || myLocations;
    const locationIds = new Set(currentUserLocations.map(loc => loc.id));
    
    // Combine partners with user locations (user locations take precedence if they exist in partners)
    const allPartners = [...userLocationsWithCoords, ...partners];
    const uniquePartners = Array.from(
      new Map(allPartners.map(p => [p.id, p])).values()
    );
    
    // Separate into categories
    const own = uniquePartners.filter(partner => locationIds.has(partner.id));
    const other = uniquePartners.filter(partner => !locationIds.has(partner.id));
    
    // Separate other partners by status
    const current = other.filter(partner => partner.is_current_partner === true);
    const pending = other.filter(partner => 
      !partner.is_current_partner && 
      (partner.has_pending_request === true)
    );
    const available = other.filter(partner => 
      !partner.is_current_partner && 
      !partner.has_pending_request &&
      (partner.active_partnerships_count || 0) < 10
    );
    
    // Sort each category by distance
    const sortedCurrent = [...current].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    const sortedPending = [...pending].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    const sortedAvailable = [...available].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Combined sorted list: own stores → current partners → pending → available
    const sorted = [...own, ...sortedCurrent, ...sortedPending, ...sortedAvailable];
    
    return {
      ownStores: own,
      currentPartners: sortedCurrent,
      pendingPartners: sortedPending,
      availablePartners: sortedAvailable,
      sortedPartners: sorted,
      userLocationIds: locationIds
    };
  }, [partners, propUserLocations, myLocations, userLocationsWithCoords, pendingRequestIds]);
  const handleSubmitRequest = () => {
    if (selectedMyLocations.length === 0) {
      toast.error('Please select a location for this partnership');
      return;
    }
    if (!consentChecked) {
      toast.error('Please consent to the partnership terms');
      return;
    }
    if (selectedRequestPartner) {
      // Mark this partner as having a pending request immediately
      setPendingRequestIds(prev => new Set([...prev, selectedRequestPartner.id]));
      
      // Send request for the selected location
      // Note: The parent component (PartnerRequests) will handle the actual API call with location_id
      onSendRequest(selectedRequestPartner.store_name);
      setShowRequestDialog(false);
      setSelectedMyLocations([]);
      setConsentChecked(false);
      setSelectedRequestPartner(null);
      
      // Refresh partners list after a short delay to get updated status
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 1000);
      }
    }
  };
  const handleCancelPartnership = async () => {
    if (!selectedCancelPartner?.partnership_id) return;
    setIsCanceling(true);
    try {
      // TODO: Replace with Node.js API call
      // await post({ 
      //   end_point: 'partnerships/cancel', 
      //   body: { partnership_id: selectedCancelPartner.partnership_id }
      // });
      toast.success(`Partnership with ${selectedCancelPartner.store_name} has been canceled`);
      setShowCancelDialog(false);
      setSelectedCancelPartner(null);
      // Refresh the partners list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error canceling partnership:', error);
      toast.error('Failed to cancel partnership. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with stored token
    mapboxgl.accessToken = MAPBOX_TOKEN;
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.006, 40.7128],
        // Default to NYC
        zoom: 12
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add markers for each partner
      sortedPartners.forEach((partner, index) => {
        if (!map.current) return;
        const hasMaxPartners = (partner.active_partnerships_count || 0) >= 10;
        const isCurrentPartner = partner.is_current_partner;
        const isPending = partner.has_pending_request === true;
        const isOwnStore = userLocationIds.has(partner.id);
        const markerNumber = index + 1;

        // Determine marker color: green for own stores, purple for current partners, orange for pending, gray for max partners, blue for available
        let markerColorClass = 'bg-primary hover:bg-primary/90';
        if (isOwnStore) {
          markerColorClass = 'bg-green-500 hover:bg-green-600';
        } else if (isCurrentPartner) {
          markerColorClass = 'bg-purple-600 hover:bg-purple-700';
        } else if (isPending) {
          markerColorClass = 'bg-amber-500 hover:bg-amber-600';
        } else if (hasMaxPartners) {
          markerColorClass = 'bg-gray-400 cursor-not-allowed';
        }

        // Create custom marker element with number
        const markerElement = document.createElement('div');
        markerElement.className = 'partner-marker';
        markerElement.id = `marker-${partner.id}`;
        markerElement.innerHTML = `
          <div class="marker-content ${markerColorClass} ${!hasMaxPartners && !isCurrentPartner ? 'cursor-pointer' : ''} text-white rounded-full w-10 h-10 flex items-center justify-center text-base font-bold shadow-lg border-2 border-white transition-all">
            ${markerNumber}
          </div>
        `;

        // Create hover tooltip
        const hoverTooltip = document.createElement('div');
        hoverTooltip.className = 'hidden absolute bg-background border border-border rounded-lg shadow-lg p-3 min-w-[220px] z-50';
        hoverTooltip.style.pointerEvents = 'none';
        hoverTooltip.innerHTML = `
          <div class="space-y-2">
            ${partner.offer_image_url ? `<img src="${partner.offer_image_url}" class="w-full h-20 object-cover rounded" alt="Offer" />` : ''}
            <h4 class="font-semibold text-foreground text-sm">${partner.store_name}</h4>
            ${partner.retail_category ? `<p class="text-xs text-muted-foreground">${partner.retail_category}</p>` : ''}
            <p class="text-xs text-muted-foreground">${partner.retail_address}</p>
            ${partner.distance !== undefined ? `<p class="text-xs text-muted-foreground">${partner.distance.toFixed(1)} miles away</p>` : ''}
          </div>
        `;
        markerElement.appendChild(hoverTooltip);

        // Add hover handlers for tooltip
        markerElement.addEventListener('mouseenter', () => {
          hoverTooltip.classList.remove('hidden');
          hoverTooltip.style.bottom = '100%';
          hoverTooltip.style.left = '50%';
          hoverTooltip.style.transform = 'translateX(-50%) translateY(-8px)';
          setHoveredPartnerId(partner.id);
        });
        markerElement.addEventListener('mouseleave', () => {
          hoverTooltip.classList.add('hidden');
          setHoveredPartnerId(null);
        });

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 min-w-[280px]';
        popupContent.innerHTML = `
          <div class="space-y-3">
            ${partner.offer_image_url ? `<img src="${partner.offer_image_url}" class="w-full h-32 object-cover rounded" alt="Current Offer" />` : ''}
            <div>
              <h3 class="font-semibold text-foreground">${partner.store_name}</h3>
              ${partner.retail_category ? `<p class="text-sm text-muted-foreground font-medium">${partner.retail_category}</p>` : ''}
              ${partner.offer_call_to_action ? `<p class="text-sm text-primary font-medium mt-1">${partner.offer_call_to_action}</p>` : ''}
              <p class="text-sm text-muted-foreground mt-1">${partner.retail_address}</p>
              ${partner.distance !== undefined ? `<p class="text-sm text-muted-foreground">${partner.distance.toFixed(1)} miles away</p>` : ''}
              <p class="text-sm text-muted-foreground">Owner: ${partner.first_name} ${partner.last_name}</p>
            </div>
            ${hasMaxPartners ? '<div class="bg-gray-100 p-2 rounded text-sm text-gray-600">This store has reached the maximum of 10 partnerships</div>' : isCurrentPartner ? '<button class="cancel-partnership-btn w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">Cancel Partnership</button>' : '<button class="send-request-btn w-full bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded text-sm font-medium">Request Partnership</button>'}
          </div>
        `;

        // Add click handler for buttons
        if (isCurrentPartner) {
          const cancelBtn = popupContent.querySelector('.cancel-partnership-btn');
          cancelBtn?.addEventListener('click', () => {
            setSelectedCancelPartner(partner);
            setShowCancelDialog(true);
          });
        } else if (!hasMaxPartners) {
          const sendBtn = popupContent.querySelector('.send-request-btn');
          sendBtn?.addEventListener('click', () => {
            setSelectedRequestPartner(partner);
            setShowRequestDialog(true);
          });
        }

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true
        }).setDOMContent(popupContent);

        // Create marker
        const marker = new mapboxgl.Marker(markerElement).setLngLat([partner.longitude, partner.latitude]).setPopup(popup).addTo(map.current);

        // Store marker reference
        markersRef.current.set(partner.id, marker);

        // Handle marker click
        markerElement.addEventListener('click', () => {
          setSelectedPartner(partner);
        });
      });

      // Fit map to show all markers
      if (sortedPartners.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        sortedPartners.forEach(partner => {
          bounds.extend([partner.longitude, partner.latitude]);
        });
        map.current.fitBounds(bounds, {
          padding: 50
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to load map. Please check your Mapbox token.');
    }

    // Cleanup
    return () => {
      map.current?.remove();
      markersRef.current.clear();
    };
  }, [sortedPartners, userLocationIds]);

  // Effect to highlight markers when hovering list items
  useEffect(() => {
    if (!hoveredPartnerId) {
      // Remove all highlights
      markersRef.current.forEach(marker => {
        const element = marker.getElement();
        const content = element.querySelector('.marker-content');
        if (content) {
          content.classList.remove('ring-4', 'ring-primary', 'scale-125');
        }
      });
      return;
    }

    // Highlight the hovered marker
    const marker = markersRef.current.get(hoveredPartnerId);
    if (marker) {
      const element = marker.getElement();
      const content = element.querySelector('.marker-content');
      if (content) {
        content.classList.add('ring-4', 'ring-primary', 'scale-125');
      }
    }
  }, [hoveredPartnerId]);
  return <>
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Partner Map
          <Badge variant="secondary" className="ml-2">
            {partners.length} stores
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Map */}
          <div className="relative flex-1">
            <div ref={mapContainer} className="w-full h-[500px] rounded-bl-lg" />
            <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border rounded p-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Your stores</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span>Current partners</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Pending partners</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Available for partnerships</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>No partnerships available</span>
              </div>
            </div>
          </div>
          
          {/* Scrollable Partner List */}
          <div className="w-80 h-[500px] overflow-y-auto border-l border-border pr-4 pb-4">
            <div className="space-y-3 pt-4">
              {/* Your Stores Section */}
              {ownStores.length > 0 && (
                <>
                  <div className="px-2 pb-2">
                    <h3 className="text-sm font-semibold text-foreground">Your Stores</h3>
                  </div>
                  {ownStores.map((partner, index) => {
                    const isHovered = hoveredPartnerId === partner.id;
                    const badgeColor = 'bg-green-500';
                    return <div key={partner.id} className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPartner?.id === partner.id ? 'ring-2 ring-green-500 shadow-lg' : isHovered ? 'ring-2 ring-green-500/50 shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedPartner(partner)} onMouseEnter={() => setHoveredPartnerId(partner.id)} onMouseLeave={() => setHoveredPartnerId(null)}>
                      {/* Number Badge */}
                      <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all ${badgeColor} ${isHovered ? 'scale-125' : ''}`}>
                        {index + 1}
                      </div>
                      
                      {/* Your Store Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500 text-white text-xs">Your Store</Badge>
                      </div>
                      
                      {/* Offer Image */}
                      {partner.offer_image_url && <div className="h-24 w-full bg-secondary/20">
                        <img src={partner.offer_image_url} alt={partner.store_name} className="w-full h-full object-cover" />
                      </div>}
                      
                      {/* Partner Info */}
                      <div className="p-3 space-y-1 pt-10">
                        <h4 className="font-semibold text-sm text-foreground pr-10">{partner.store_name}</h4>
                        {partner.retail_category && <p className="text-xs text-muted-foreground">{partner.retail_category}</p>}
                        <p className="text-xs text-muted-foreground">{partner.retail_address}</p>
                        {partner.offer_call_to_action && <p className="text-xs text-primary font-medium">{partner.offer_call_to_action}</p>}
                      </div>
                    </div>;
                  })}
                  
                  {/* Section Separator */}
                  {(currentPartners.length > 0 || pendingPartners.length > 0 || availablePartners.length > 0) && (
                    <div className="px-2 pt-4 pb-2 border-t mt-4">
                    </div>
                  )}
                </>
              )}
              
              {/* Current Partners Section */}
              {currentPartners.length > 0 && (
                <>
                  <div className="px-2 pb-2">
                    <h3 className="text-sm font-semibold text-foreground">Current Partners</h3>
                  </div>
                  {currentPartners.map((partner, index) => {
                    const isHovered = hoveredPartnerId === partner.id;
                    const badgeColor = 'bg-purple-600';
                    const displayIndex = ownStores.length + index + 1;
                    return <div key={partner.id} className={`relative border-2 border-purple-600 rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPartner?.id === partner.id ? 'ring-2 ring-purple-600 shadow-lg' : isHovered ? 'ring-2 ring-purple-600/50 shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedPartner(partner)} onMouseEnter={() => setHoveredPartnerId(partner.id)} onMouseLeave={() => setHoveredPartnerId(null)}>
                      {/* Number Badge */}
                      <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all ${badgeColor} ${isHovered ? 'scale-125' : ''}`}>
                        {displayIndex}
                      </div>
                      
                      {/* Current Partner Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-purple-600 text-white text-xs">Active Partner</Badge>
                      </div>
                      
                      {/* Offer Image */}
                      {partner.offer_image_url && <div className="h-24 w-full bg-secondary/20">
                        <img src={partner.offer_image_url} alt={partner.store_name} className="w-full h-full object-cover" />
                      </div>}
                      
                      {/* Partner Info */}
                      <div className="p-3 space-y-1 pt-10">
                        <h4 className="font-semibold text-sm text-foreground pr-10">{partner.store_name}</h4>
                        {partner.retail_category && <p className="text-xs text-muted-foreground">{partner.retail_category}</p>}
                        <p className="text-xs text-muted-foreground">{partner.retail_address}</p>
                        {partner.offer_call_to_action && <p className="text-xs text-primary font-medium">{partner.offer_call_to_action}</p>}
                        {partner.distance !== undefined && <p className="text-xs text-muted-foreground">{partner.distance.toFixed(1)} miles away</p>}
                        
                        <Button size="sm" variant="destructive" className="w-full mt-2 text-xs" onClick={e => {
                          e.stopPropagation();
                          setSelectedCancelPartner(partner);
                          setShowCancelDialog(true);
                        }}>
                          Cancel Partnership
                        </Button>
                      </div>
                    </div>;
                  })}
                </>
              )}
              
              {/* Pending Partners Section */}
              {pendingPartners.length > 0 && (
                <>
                  <div className="px-2 pt-4 pb-2 border-t mt-4">
                    <h3 className="text-sm font-semibold text-foreground">Pending Partners</h3>
                  </div>
                  {pendingPartners.map((partner, index) => {
                    const isHovered = hoveredPartnerId === partner.id;
                    const badgeColor = 'bg-amber-500';
                    const displayIndex = ownStores.length + currentPartners.length + index + 1;
                    return <div key={partner.id} className={`relative border-2 border-amber-500 rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPartner?.id === partner.id ? 'ring-2 ring-amber-500 shadow-lg' : isHovered ? 'ring-2 ring-amber-500/50 shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedPartner(partner)} onMouseEnter={() => setHoveredPartnerId(partner.id)} onMouseLeave={() => setHoveredPartnerId(null)}>
                      {/* Number Badge */}
                      <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all ${badgeColor} ${isHovered ? 'scale-125' : ''}`}>
                        {displayIndex}
                      </div>
                      
                      {/* Pending Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-amber-500 text-white text-xs">Pending</Badge>
                      </div>
                      
                      {/* Offer Image */}
                      {partner.offer_image_url && <div className="h-24 w-full bg-secondary/20">
                        <img src={partner.offer_image_url} alt={partner.store_name} className="w-full h-full object-cover" />
                      </div>}
                      
                      {/* Partner Info */}
                      <div className="p-3 space-y-1 pt-10">
                        <h4 className="font-semibold text-sm text-foreground pr-10">{partner.store_name}</h4>
                        {partner.retail_category && <p className="text-xs text-muted-foreground">{partner.retail_category}</p>}
                        <p className="text-xs text-muted-foreground">{partner.retail_address}</p>
                        {partner.offer_call_to_action && <p className="text-xs text-primary font-medium">{partner.offer_call_to_action}</p>}
                        {partner.distance !== undefined && <p className="text-xs text-muted-foreground">{partner.distance.toFixed(1)} miles away</p>}
                        
                        <Button size="sm" className="w-full mt-2 text-xs bg-amber-500 hover:bg-amber-600 text-white" disabled>
                          Pending Partnership
                        </Button>
                      </div>
                    </div>;
                  })}
                </>
              )}
              
              {/* Available Partners Section */}
              {availablePartners.length > 0 && (
                <>
                  <div className="px-2 pt-4 pb-2 border-t mt-4">
                    <h3 className="text-sm font-semibold text-foreground">Available Partners</h3>
                  </div>
                  {availablePartners.map((partner, index) => {
                    const isHovered = hoveredPartnerId === partner.id;
                    const badgeColor = 'bg-primary';
                    const displayIndex = ownStores.length + currentPartners.length + pendingPartners.length + index + 1;
                    return <div key={partner.id} className={`relative border-2 border-primary rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPartner?.id === partner.id ? 'ring-2 ring-primary shadow-lg' : isHovered ? 'ring-2 ring-primary/50 shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedPartner(partner)} onMouseEnter={() => setHoveredPartnerId(partner.id)} onMouseLeave={() => setHoveredPartnerId(null)}>
                      {/* Number Badge */}
                      <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all ${badgeColor} ${isHovered ? 'scale-125' : ''}`}>
                        {displayIndex}
                      </div>
                      
                      {/* Offer Image */}
                      {partner.offer_image_url && <div className="h-24 w-full bg-secondary/20">
                        <img src={partner.offer_image_url} alt={partner.store_name} className="w-full h-full object-cover" />
                      </div>}
                      
                      {/* Partner Info */}
                      <div className="p-3 space-y-1">
                        <h4 className="font-semibold text-sm text-foreground pr-10">{partner.store_name}</h4>
                        {partner.retail_category && <p className="text-xs text-muted-foreground">{partner.retail_category}</p>}
                        <p className="text-xs text-muted-foreground">{partner.retail_address}</p>
                        {partner.offer_call_to_action && <p className="text-xs text-primary font-medium">{partner.offer_call_to_action}</p>}
                        {partner.distance !== undefined && <p className="text-xs text-muted-foreground">{partner.distance.toFixed(1)} miles away</p>}
                        
                        <Button size="sm" className="w-full mt-2 text-xs" onClick={e => {
                          e.stopPropagation();
                          setSelectedRequestPartner(partner);
                          setShowRequestDialog(true);
                        }}>
                          <Send className="h-3 w-3 mr-1" />
                          Request Partnership
                        </Button>
                      </div>
                    </div>;
                  })}
                </>
              )}
              
              {/* Loading Skeletons - Show when loading and no data yet */}
              {isLoading && partners.length === 0 && (
                <>
                  <div className="px-2 pb-2">
                    <Skeleton className="h-5 w-24 mb-3" />
                    {[...Array(1)].map((_, i) => (
                      <div key={i} className="relative border rounded-lg overflow-hidden mb-3">
                        <Skeleton className="absolute top-2 right-2 w-8 h-8 rounded-full" />
                        <Skeleton className="h-24 w-full" />
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-2 pt-4 pb-2 border-t mt-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="relative border rounded-lg overflow-hidden mb-3">
                        <Skeleton className="absolute top-2 right-2 w-8 h-8 rounded-full" />
                        <Skeleton className="h-24 w-full" />
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-8 w-full mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Show header if no sections above and not loading */}
              {!isLoading && ownStores.length === 0 && currentPartners.length === 0 && pendingPartners.length === 0 && availablePartners.length === 0 && (
                <div className="px-2 pb-2 text-center text-muted-foreground text-sm">
                  No partners available
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Request Partnership Dialog */}
    <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Request Partnership</DialogTitle>
          <DialogDescription>
            Send a partnership request to {selectedRequestPartner?.store_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto pr-4">
          <div className="space-y-4 py-4">
          {selectedRequestPartner && <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Partner Details:</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Store:</span> {selectedRequestPartner.store_name}</p>
                <p><span className="text-muted-foreground">Category:</span> {selectedRequestPartner.retail_category || 'N/A'}</p>
                <p><span className="text-muted-foreground">Address:</span> {selectedRequestPartner.retail_address}</p>
                {selectedRequestPartner.distance !== undefined && <p><span className="text-muted-foreground">Distance:</span> {selectedRequestPartner.distance.toFixed(1)} miles away</p>}
              </div>
            </div>}

          <div className="space-y-3">
            <Label>Select Your Location</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Select which location you want to use for this partnership. One offer can be used for one location per partnership.
            </div>
            {myLocations.length === 0 ? (
              <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
                No locations found. Please add a location first.
              </div>
            ) : (
              <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                {myLocations.map(location => (
                  <div key={location.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedMyLocations.includes(location.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Only allow one location to be selected at a time
                          setSelectedMyLocations([location.id]);
                        } else {
                          setSelectedMyLocations(selectedMyLocations.filter(id => id !== location.id));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`location-${location.id}`}
                      className="text-sm font-normal cursor-pointer leading-tight flex-1"
                    >
                      <div className="font-medium text-sm sm:text-base">{location.name}</div>
                      <div className="text-foreground/70 text-xs sm:text-sm break-words">{location.address}</div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {selectedMyLocations.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedMyLocations.length} location{selectedMyLocations.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Partnership includes:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>Your offer displayed in their partner carousel</li>
              <li>Their offer displayed in your partner carousel</li>
              <li>Partnership analytics showing views, scans and redemption</li>
              <li>Cross-promotion to increase foot traffic</li>
            </ul>
          </div>

          {/* Payment section removed temporarily as per user request */}
          {/* Note: Payment integration will be added later */}

          <div className="flex items-start space-x-2">
            <Checkbox id="consent" checked={consentChecked} onCheckedChange={checked => setConsentChecked(checked as boolean)} />
            <Label htmlFor="consent" className="text-sm font-normal cursor-pointer leading-tight">
              I agree to the partnership terms and understand that this partnership will allow cross-promotion of offers between our stores.
            </Label>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => {
            setShowRequestDialog(false);
            setSelectedMyLocations([]);
            setConsentChecked(false);
            setSelectedRequestPartner(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmitRequest} disabled={selectedMyLocations.length === 0 || !consentChecked}>
            <Send className="h-4 w-4 mr-2" />
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Cancel Partnership Dialog */}
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Cancel Partnership</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your partnership with {selectedCancelPartner?.store_name}?
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto pr-4">
          <div className="space-y-4 py-4">
          {selectedCancelPartner && <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Partnership Details:</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Partner:</span> {selectedCancelPartner.store_name}</p>
                <p><span className="text-muted-foreground">Category:</span> {selectedCancelPartner.retail_category || 'N/A'}</p>
                <p><span className="text-muted-foreground">Address:</span> {selectedCancelPartner.retail_address}</p>
              </div>
            </div>}

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Canceling this partnership will:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>Stop the $7/month recurring charge for both parties</li>
              <li>Remove your offer from their carousel and vice versa</li>
              <li>End the cross-promotion arrangement immediately</li>
            </ul>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => {
            setShowCancelDialog(false);
            setSelectedCancelPartner(null);
          }} disabled={isCanceling}>
            Keep Partnership
          </Button>
          <Button variant="destructive" onClick={handleCancelPartnership} disabled={isCanceling}>
            {isCanceling ? 'Canceling...' : 'Cancel Partnership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>;
};
export default PartnerMap;