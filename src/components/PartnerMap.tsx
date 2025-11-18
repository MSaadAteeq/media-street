import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  partnership_id?: string;
}
interface PartnerMapProps {
  partners: Partner[];
  onSendRequest: (storeName: string) => void;
  onRefresh?: () => void;
}
const PartnerMap: React.FC<PartnerMapProps> = ({
  partners,
  onSendRequest,
  onRefresh
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
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Mock user's locations - in production, fetch from database
  const myLocations = [{
    id: '1',
    name: "Sally's Salon - Broadway",
    address: "123 Broadway, New York, NY"
  }, {
    id: '2',
    name: "Sally's Salon - 5th Ave",
    address: "456 5th Avenue, New York, NY"
  }, {
    id: '3',
    name: "Sally's Salon - SoHo",
    address: "789 Spring St, New York, NY"
  }];

  // Sort partners by distance
  const sortedPartners = [...partners].sort((a, b) => (a.distance || 0) - (b.distance || 0));
  const handleSubmitRequest = () => {
    if (selectedMyLocations.length === 0 || !consentChecked) {
      toast.error('Please select at least one location and consent to the charge');
      return;
    }
    if (selectedRequestPartner) {
      // Send a request for each selected location
      selectedMyLocations.forEach(() => {
        onSendRequest(selectedRequestPartner.store_name);
      });
      toast.success(`Sent ${selectedMyLocations.length} partnership request${selectedMyLocations.length > 1 ? 's' : ''}`);
      setShowRequestDialog(false);
      setSelectedMyLocations([]);
      setConsentChecked(false);
      setSelectedRequestPartner(null);
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
        const markerNumber = index + 1;

        // Determine marker color: purple for current partners, gray for max partners, blue for available
        let markerColorClass = 'bg-primary hover:bg-primary/90';
        if (isCurrentPartner) {
          markerColorClass = 'bg-purple-600 hover:bg-purple-700';
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
  }, [partners]);

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
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span>Current partners</span>
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
              {sortedPartners.map((partner, index) => {
                const hasMaxPartners = (partner.active_partnerships_count || 0) >= 10;
                const isCurrentPartner = partner.is_current_partner;
                const isHovered = hoveredPartnerId === partner.id;
                let badgeColor = 'bg-primary';
                if (isCurrentPartner) {
                  badgeColor = 'bg-purple-600';
                } else if (hasMaxPartners) {
                  badgeColor = 'bg-gray-400';
                }
                return <div key={partner.id} className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPartner?.id === partner.id ? isCurrentPartner ? 'ring-2 ring-purple-600 shadow-lg' : 'ring-2 ring-primary shadow-lg' : isHovered ? isCurrentPartner ? 'ring-2 ring-purple-600/50 shadow-md' : 'ring-2 ring-primary/50 shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedPartner(partner)} onMouseEnter={() => setHoveredPartnerId(partner.id)} onMouseLeave={() => setHoveredPartnerId(null)}>
                    {/* Number Badge */}
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all ${badgeColor} ${isHovered ? 'scale-125' : ''}`}>
                      {index + 1}
                    </div>
                    
                    {/* Current Partner Badge */}
                    {isCurrentPartner && <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-purple-600 text-white text-xs">Active Partner</Badge>
                      </div>}
                    
                    {/* Offer Image */}
                    {partner.offer_image_url && <div className="h-24 w-full bg-secondary/20">
                        <img src={partner.offer_image_url} alt={partner.store_name} className="w-full h-full object-cover" />
                      </div>}
                    
                    {/* Partner Info */}
                    <div className={`p-3 space-y-1 ${isCurrentPartner ? 'pt-10' : ''}`}>
                      <h4 className="font-semibold text-sm text-foreground pr-10">{partner.store_name}</h4>
                      {partner.retail_category && <p className="text-xs text-muted-foreground">{partner.retail_category}</p>}
                      <p className="text-xs text-muted-foreground">{partner.retail_address}</p>
                      {partner.offer_call_to_action && <p className="text-xs text-primary font-medium">{partner.offer_call_to_action}</p>}
                      {partner.distance !== undefined && <p className="text-xs text-muted-foreground">{partner.distance.toFixed(1)} miles away</p>}
                      
                      {hasMaxPartners ? <Badge variant="secondary" className="text-xs mt-2">10 partnerships (max)</Badge> : isCurrentPartner ? <Button size="sm" variant="destructive" className="w-full mt-2 text-xs" onClick={e => {
                      e.stopPropagation();
                      setSelectedCancelPartner(partner);
                      setShowCancelDialog(true);
                    }}>
                          Cancel Partnership
                        </Button> : <Button size="sm" className="w-full mt-2 text-xs" onClick={e => {
                      e.stopPropagation();
                      setSelectedRequestPartner(partner);
                      setShowRequestDialog(true);
                    }}>
                          <Send className="h-3 w-3 mr-1" />
                          Request Partnership
                        </Button>}
                    </div>
                  </div>;
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Request Partnership Dialog */}
    <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Partnership</DialogTitle>
          <DialogDescription>
            Send a partnership request to {selectedRequestPartner?.store_name}
          </DialogDescription>
        </DialogHeader>

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
            <Label>Select Your Location(s)</Label>
            <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
              {myLocations.map(location => (
                <div key={location.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`location-${location.id}`}
                    checked={selectedMyLocations.includes(location.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMyLocations([...selectedMyLocations, location.id]);
                      } else {
                        setSelectedMyLocations(selectedMyLocations.filter(id => id !== location.id));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`location-${location.id}`}
                    className="text-sm font-normal cursor-pointer leading-tight"
                  >
                    <div className="font-medium">{location.name}</div>
                    <div className="text-muted-foreground text-xs">{location.address}</div>
                  </Label>
                </div>
              ))}
            </div>
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

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Total Monthly Cost:</span>
              <span className="text-2xl font-bold text-primary">
                ${(selectedMyLocations.length * 7).toFixed(2)}/month
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              $7/month per location × {selectedMyLocations.length || 0} location{selectedMyLocations.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox id="consent" checked={consentChecked} onCheckedChange={checked => setConsentChecked(checked as boolean)} />
            <Label htmlFor="consent" className="text-sm font-normal cursor-pointer leading-tight">
              I understand that sending {selectedMyLocations.length || 0} request{selectedMyLocations.length !== 1 ? 's' : ''} will initiate a ${(selectedMyLocations.length * 7).toFixed(2)}/month partnership fee if accepted by the other party and until cancelled on this page.
            </Label>
          </div>
        </div>

        <DialogFooter>
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
            Send {selectedMyLocations.length > 0 ? selectedMyLocations.length : ''} Request{selectedMyLocations.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Cancel Partnership Dialog */}
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Partnership</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your partnership with {selectedCancelPartner?.store_name}?
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
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