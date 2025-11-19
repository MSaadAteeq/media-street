import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Store, Check, X, Plus, Send, UserPlus, ArrowDown, ArrowUp, Eye, ChevronRight, Gift, Map as MapIcon, Building2, Trash2, MessageSquare, Lightbulb } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PartnerMap from "@/components/PartnerMap";
import DisplayOptionCheck from "@/components/DisplayOptionCheck";
import { checkDisplayOptions } from "@/utils/displayOptions";

// Import POS campaign images
import posCoffeeImage from "@/assets/pos-campaign-coffee.jpg";
import posSalonImage from "@/assets/pos-campaign-salon.jpg";
import posFlowersImage from "@/assets/pos-campaign-flowers.jpg";
import posSubsImage from "@/assets/pos-campaign-subs.jpg";
type PartnerRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    store_name: string;
    first_name: string;
    last_name: string;
    retail_address?: string;
  };
  recipient_profile?: {
    store_name: string;
    first_name: string;
    last_name: string;
    retail_address?: string;
  };
};
const PartnerRequests = () => {
  const navigate = useNavigate();

  // Example data for demonstration
  const exampleRequests: PartnerRequest[] = [{
    id: '1',
    sender_id: 'current-user-id',
    recipient_id: 'joes-coffee-id',
    status: 'approved',
    created_at: '2024-09-03T10:00:00Z',
    updated_at: '2024-09-03T11:00:00Z',
    sender_profile: {
      store_name: "Sally's Salon",
      first_name: 'Sally',
      last_name: 'Johnson',
      retail_address: "123 Beauty Blvd, Downtown"
    },
    recipient_profile: {
      store_name: "Joe's Coffee",
      first_name: 'Joe',
      last_name: 'Smith',
      retail_address: "456 Brew Street, Midtown"
    }
  }, {
    id: '2',
    sender_id: 'joanns-flower-id',
    recipient_id: 'current-user-id',
    status: 'pending',
    created_at: '2024-09-04T14:30:00Z',
    updated_at: '2024-09-04T14:30:00Z',
    sender_profile: {
      store_name: "Joann's Flower Shop",
      first_name: 'Joann',
      last_name: 'Davis',
      retail_address: "789 Garden Way, Uptown"
    },
    recipient_profile: {
      store_name: "Sally's Salon",
      first_name: 'Sally',
      last_name: 'Johnson',
      retail_address: "123 Beauty Blvd, Downtown"
    }
  }, {
    id: '3',
    sender_id: 'current-user-id',
    recipient_id: 'daily-dry-cleaner-id',
    status: 'rejected',
    created_at: '2024-09-01T09:15:00Z',
    updated_at: '2024-09-02T16:45:00Z',
    sender_profile: {
      store_name: "Sally's Salon",
      first_name: 'Sally',
      last_name: 'Johnson',
      retail_address: "123 Beauty Blvd, Downtown"
    },
    recipient_profile: {
      store_name: "Daily Dry Cleaner",
      first_name: 'Mike',
      last_name: 'Wilson',
      retail_address: "321 Clean Lane, Westside"
    }
  }, {
    id: '4',
    sender_id: 'media-street-ad-id',
    recipient_id: 'current-user-id',
    status: 'pending',
    created_at: '2024-09-05T16:00:00Z',
    updated_at: '2024-09-05T16:00:00Z',
    sender_profile: {
      store_name: "Media Street",
      first_name: 'Media',
      last_name: 'Street',
      retail_address: "Ad Network"
    },
    recipient_profile: {
      store_name: "Sally's Salon",
      first_name: 'Sally',
      last_name: 'Johnson',
      retail_address: "123 Beauty Blvd, Downtown"
    }
  }, {
    id: '5',
    sender_id: 'current-user-id',
    recipient_id: 'mikes-pizza-id',
    status: 'cancelled',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-09-01T14:00:00Z',
    sender_profile: {
      store_name: "Sally's Salon",
      first_name: 'Sally',
      last_name: 'Johnson',
      retail_address: "123 Beauty Blvd, Downtown"
    },
    recipient_profile: {
      store_name: "Mike's Pizza Palace",
      first_name: 'Mike',
      last_name: 'Romano',
      retail_address: "654 Cheese Ave, Downtown"
    }
  }].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const [requests, setRequests] = useState<PartnerRequest[]>(exampleRequests);
  console.log('Partner requests:', requests);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPartnerStore, setNewPartnerStore] = useState("");
  const [storeOptions, setStoreOptions] = useState<{
    store_name: string;
    retail_address: string;
  }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('current-user-id');
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showApprovalAuthDialog, setShowApprovalAuthDialog] = useState(false);
  const [hasApprovalAgreed, setHasApprovalAgreed] = useState(false);
  const [pendingApprovalRequestId, setPendingApprovalRequestId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [approvalPromoCode, setApprovalPromoCode] = useState("");
  const [isPromoValid, setIsPromoValid] = useState(false);
  const [isApprovalPromoValid, setIsApprovalPromoValid] = useState(false);
  const [userLocations, setUserLocations] = useState<{
    id: string;
    name: string;
    address: string;
  }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [partnersForMap, setPartnersForMap] = useState<any[]>([]);
  const [showBillingConfirmDialog, setShowBillingConfirmDialog] = useState(false);
  const [pendingBillingRequest, setPendingBillingRequest] = useState<PartnerRequest | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingCancelRequest, setPendingCancelRequest] = useState<PartnerRequest | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [isCheckingPaymentMethod, setIsCheckingPaymentMethod] = useState(true);
  const [showDisplayOptionCheck, setShowDisplayOptionCheck] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<PartnerRequest | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      await fetchPartnerRequests();
      await fetchUserLocations();
      await fetchPartnersForMap();
      await checkPaymentMethod();
    };
    init();
  }, []);
  useEffect(() => {
    if (userLocations.length > 0 && partnersForMap.length > 0) {
      generateRecommendations().catch(error => {
        console.error('Error generating recommendations:', error);
      });
    } else {
      setRecommendations([]);
    }
  }, [userLocations, partnersForMap]);
  const fetchCurrentUser = async () => {
    try {
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'users/me',
        token: true
      });
      
      if (response.success && response.data) {
        const userId = response.data._id?.toString() || response.data.id?.toString() || null;
        if (userId) {
          setCurrentUserId(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Fallback: try to get from token if available
      const token = localStorage.getItem('token');
      if (token) {
        // Try to decode token to get user ID (basic fallback)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            setCurrentUserId(payload.userId);
          }
        } catch (e) {
          console.error('Could not extract user ID from token');
        }
      }
    }
  };
  const fetchUserLocations = async () => {
    try {
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response.success && response.data) {
        // Only use actual locations from API - filter out any invalid entries
        const formattedLocations = response.data
          .filter((loc: any) => loc && (loc._id || loc.id)) // Filter out invalid locations
          .map((loc: any) => ({
            id: loc._id?.toString() || loc.id?.toString(),
            name: loc.name || 'Unnamed Location',
            address: loc.address || ''
          }));
        setUserLocations(formattedLocations);
        if (formattedLocations.length === 1) {
          setSelectedLocationId(formattedLocations[0].id);
        } else if (formattedLocations.length > 1 && !selectedLocationId) {
          // If multiple locations and none selected, clear selection
          setSelectedLocationId("");
        }
      } else {
        setUserLocations([]);
      }
    } catch (error) {
      console.error('Error fetching user locations:', error);
      setUserLocations([]);
    }
  };
  const fetchPartnersForMap = async () => {
    try {
      // Fetch retailers with partnership-eligible offers (not open offers)
      const { get } = await import("@/services/apis");
      
      // Get current user ID to exclude own locations
      let currentUserId: string | null = null;
      try {
        const currentUserResponse = await get({ 
          end_point: 'users/me',
          token: true
        });
        if (currentUserResponse.success && currentUserResponse.data) {
          currentUserId = currentUserResponse.data._id?.toString() || currentUserResponse.data.id?.toString() || null;
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
      
      // Strategy: Fetch all offers and filter for partnership-eligible ones
      // We need to fetch ALL offers (not just open offers) to find partnership-eligible ones
      let partnershipEligibleOffers: any[] = [];
      
      try {
        // Try dedicated endpoint first (if backend implements it)
        const dedicatedResponse = await get({ 
          end_point: 'offers/partnership-eligible',
          token: true // Use token to exclude current user's offers
        });
        
        if (dedicatedResponse.success && dedicatedResponse.data) {
          partnershipEligibleOffers = dedicatedResponse.data;
          console.log(`Found ${partnershipEligibleOffers.length} partnership-eligible offers from dedicated endpoint`);
          if (partnershipEligibleOffers.length > 0) {
            console.log('Sample partnership-eligible offer:', partnershipEligibleOffers[0]);
            console.log('Offer locations:', partnershipEligibleOffers[0].locations);
          }
        } else {
          console.warn('Partnership-eligible endpoint returned:', dedicatedResponse);
        }
      } catch (error) {
        console.log('Dedicated partnership-eligible endpoint not available, trying alternative methods...');
        
        // Strategy: We need to fetch offers that are NOT open offers
        // The /offers/open endpoint only returns open offers, so we can't use it
        // We need a public endpoint that returns all active offers, or we need to use authenticated endpoint
        // For now, let's try to fetch from authenticated endpoint and see if it returns all offers
        
        // Note: The authenticated /offers endpoint typically only returns current user's offers
        // We need a public endpoint like /offers/all or backend needs to implement /offers/partnership-eligible
        // For now, we'll try authenticated endpoint as a workaround (backend should ideally have a public endpoint)
        
        try {
          // Try to get all offers - this might require backend to have a public endpoint
          // For now, we'll use authenticated endpoint but note that it may only return user's own offers
          const allOffersResponse = await get({ 
            end_point: 'offers',
            token: true // Using authenticated endpoint - backend should ideally have a public one
          });
          
          if (allOffersResponse.success && allOffersResponse.data) {
            // Filter for partnership-eligible offers:
            // - Not open offers
            // - Active
            // - Available for partnership
            // - Not current user's offers
            partnershipEligibleOffers = allOffersResponse.data.filter((offer: any) => {
              const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
              const isOpenOffer = offer.is_open_offer || offer.isOpenOffer || false;
              const isActive = offer.is_active !== undefined ? offer.is_active : (offer.isActive !== undefined ? offer.isActive : true);
              const availableForPartnership = offer.available_for_partnership !== undefined 
                ? offer.available_for_partnership 
                : (offer.availableForPartnership !== undefined ? offer.availableForPartnership : false);
              
              // Exclude current user's offers and filter for partnership-eligible
              return offerUserId !== currentUserId && !isOpenOffer && isActive && availableForPartnership;
            });
            
            console.log(`Found ${partnershipEligibleOffers.length} partnership-eligible offers from authenticated endpoint`);
          }
        } catch (authError) {
          console.error('Error fetching offers:', authError);
          // If authenticated endpoint fails or only returns user's own offers,
          // we need backend to implement a public endpoint for partnership-eligible offers
          console.warn('Backend needs a public endpoint like /offers/partnership-eligible to show all partnership-eligible offers');
        }
      }
      
      // Extract unique locations from partnership-eligible offers
      const locationMap = new Map();
      
      partnershipEligibleOffers.forEach((offer: any) => {
        // Use locations array if available (formatted by backend), otherwise use locationIds
        const locations = offer.locations || offer.locationIds || offer.location_ids || [];
        const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
        
        // Skip if this is the current user's offer
        if (offerUserId === currentUserId) {
          return;
        }
        
        locations.forEach((loc: any) => {
          // Handle populated location objects or formatted location objects
          let locId: string;
          let locName: string;
          let locAddress: string;
          let locLatitude: number;
          let locLongitude: number;
          
          if (loc && typeof loc === 'object') {
            // It's a populated or formatted location object
            locId = loc._id?.toString() || loc.id?.toString() || '';
            locName = loc.name || 'Unknown Store';
            locAddress = loc.address || '';
            locLatitude = loc.latitude || 0;
            locLongitude = loc.longitude || 0;
          } else {
            // It's just an ID, skip if we don't have location details
            locId = loc?.toString() || '';
            if (!locId) return;
            // Skip locations without details - we need populated data
            return;
          }
          
          // Only add if we have valid location data and not already in map
          if (locId && locName && !locationMap.has(locId)) {
            // Ensure userId is properly extracted and stored
            const userId = offerUserId || offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
            
            if (!userId) {
              console.warn('Warning: No userId found for offer:', offer._id || offer.id);
              return; // Skip if no userId
            }
            
            locationMap.set(locId, {
              id: locId,
              store_name: locName,
              retail_address: locAddress,
              first_name: offer.user?.fullName?.split(' ')[0] || offer.userId?.fullName?.split(' ')[0] || '',
              last_name: offer.user?.fullName?.split(' ').slice(1).join(' ') || offer.userId?.fullName?.split(' ').slice(1).join(' ') || '',
              latitude: locLatitude,
              longitude: locLongitude,
              is_offerx_active: false,
              userId: userId, // Store userId for partner requests - ensure it's always set
              user_id: userId, // Also store as user_id for compatibility
              offer: {
                id: offer._id?.toString() || offer.id?.toString(),
                call_to_action: offer.callToAction || offer.call_to_action || ''
              }
            });
          }
        });
      });
      
      const formattedPartners = Array.from(locationMap.values());
      console.log(`Found ${formattedPartners.length} partnership-eligible locations from ${partnershipEligibleOffers.length} offers`);
      
      if (formattedPartners.length === 0 && partnershipEligibleOffers.length === 0) {
        console.warn('No partnership-eligible offers found. This could mean:');
        console.warn('1. No offers have been created with available_for_partnership: true');
        console.warn('2. Backend needs a public endpoint /offers/partnership-eligible to return all partnership-eligible offers');
        console.warn('3. The authenticated /offers endpoint only returns current user\'s offers, not all users\' offers');
      }
      
      setPartnersForMap(formattedPartners);
      
    } catch (error) {
      console.error('Error fetching partners for map:', error);
      console.error('Note: Backend needs a public endpoint /offers/partnership-eligible to show all partnership-eligible offers');
      setPartnersForMap([]);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const generateRecommendations = async () => {
    // Use actual user locations from database
    if (userLocations.length === 0) {
      setRecommendations([]);
      return;
    }

    // Fetch location details with coordinates from API
    const locationCoordinates: any[] = [];
    try {
      const { get } = await import("@/services/apis");
      for (const loc of userLocations) {
        try {
          const locationResponse = await get({ 
            end_point: `locations/${loc.id}`,
            token: true
          });
          
          if (locationResponse.success && locationResponse.data) {
            const locationData = locationResponse.data;
            if (locationData.latitude && locationData.longitude) {
              locationCoordinates.push({
                id: loc.id,
                name: loc.name,
                address: loc.address,
                latitude: locationData.latitude,
                longitude: locationData.longitude
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching location ${loc.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching location coordinates:', error);
      setRecommendations([]);
      return;
    }

    // If no locations with coordinates, return empty recommendations
    if (locationCoordinates.length === 0) {
      setRecommendations([]);
      return;
    }

    const recs: any[] = [];
    partnersForMap.forEach(partner => {
      locationCoordinates.forEach(location => {
        // Only calculate distance if partner has valid coordinates
        if (partner.latitude && partner.longitude && location.latitude && location.longitude) {
          const distance = calculateDistance(location.latitude, location.longitude, partner.latitude, partner.longitude);
          recs.push({
            partner_id: partner.id,
            partner_name: partner.store_name,
            partner_address: partner.retail_address,
            location_id: location.id,
            location_name: location.name,
            location_address: location.address,
            distance: distance,
            is_offerx_active: partner.is_offerx_active
          });
        }
      });
    });

    // Sort by distance and group by partner, keeping only the closest location for each partner
    const partnerMap: Record<string, any> = {};
    recs.forEach(rec => {
      if (!partnerMap[rec.partner_id] || rec.distance < partnerMap[rec.partner_id].distance) {
        partnerMap[rec.partner_id] = rec;
      }
    });
    const sortedRecs = Object.values(partnerMap).sort((a: any, b: any) => a.distance - b.distance);
    setRecommendations(sortedRecs);
  };
  const checkPaymentMethod = async () => {
    setIsCheckingPaymentMethod(true);
    try {
      // Payment system bypassed - always return true
      setHasPaymentMethod(true);
    } catch (error) {
      console.error('Error checking payment method:', error);
      // Even on error, bypass payment
      setHasPaymentMethod(true);
    } finally {
      setIsCheckingPaymentMethod(false);
    }
  };
  const checkUserHasOffer = async () => {
    try {
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'offers',
        token: true
      });
      
      if (response.success && response.data) {
        // Check if user has any active location-based offers (available for partnership)
        const hasLocationBasedOffer = response.data.some((offer: any) => 
          !offer.is_open_offer && 
          !offer.isOpenOffer && 
          (offer.is_active || offer.isActive) && 
          (offer.available_for_partnership || offer.availableForPartnership)
        );
        return hasLocationBasedOffer;
      }
      return false;
    } catch (error) {
      console.error('Error checking user offers:', error);
      return false;
    }
  };
  const handleAddPaymentMethod = async () => {
    try {
      // TODO: Replace with Node.js API call
      // const response = await post({ end_point: 'payment/create-setup-session' });
      // if (response.data.url) {
      //   window.open(response.data.url, '_blank');
      //   toast.info('Please complete payment setup in the new window');
      // }
      
      toast.info('Payment setup will be available after API integration');
    } catch (error) {
      console.error('Error creating setup session:', error);
      toast.error('Failed to open payment setup');
    }
  };
  const fetchPartnerRequests = async () => {
    try {
      setLoading(true);
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'partners/requests',
        token: true
      });
      
      if (response.success && response.data) {
        // Format requests to match interface
        const formattedRequests = response.data.map((req: any) => ({
          id: req._id?.toString() || req.id?.toString(),
          sender_id: req.senderId?.toString() || req.sender_id?.toString() || req.senderId || req.sender_id,
          recipient_id: req.recipientId?.toString() || req.recipient_id?.toString() || req.recipientId || req.recipient_id,
          status: req.status || 'pending',
          created_at: req.createdAt || req.created_at || new Date().toISOString(),
          updated_at: req.updatedAt || req.updated_at || new Date().toISOString(),
          sender_profile: req.senderProfile || req.sender_profile || {
            store_name: req.sender?.fullName || 'Unknown',
            first_name: req.sender?.fullName?.split(' ')[0] || '',
            last_name: req.sender?.fullName?.split(' ').slice(1).join(' ') || '',
            retail_address: req.senderLocation?.address || ''
          },
          recipient_profile: req.recipientProfile || req.recipient_profile || {
            store_name: req.recipient?.fullName || 'Unknown',
            first_name: req.recipient?.fullName?.split(' ')[0] || '',
            last_name: req.recipient?.fullName?.split(' ').slice(1).join(' ') || '',
            retail_address: req.recipientLocation?.address || ''
          }
        }));
        
        setRequests(formattedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching partner requests:', error);
      toast.error('Failed to load partner requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  const searchStores = async (query: string) => {
    if (!isInputFocused) {
      setStoreOptions([]);
      return;
    }
    
    // Use partners from map (partnership-eligible offers) for search
    if (partnersForMap.length > 0) {
      const searchQuery = query.toLowerCase().trim();
      const matchedStores = partnersForMap
        .filter(partner => {
          const storeName = partner.store_name?.toLowerCase() || '';
          const address = partner.retail_address?.toLowerCase() || '';
          return storeName.includes(searchQuery) || address.includes(searchQuery);
        })
        .map(partner => ({
          store_name: partner.store_name,
          retail_address: partner.retail_address,
          partner_id: partner.id
        }));
      
      setStoreOptions(matchedStores);
      return;
    }
    
    // Fallback: If no partners loaded yet, show empty or try to fetch
    if (query.length >= 2) {
      // Try to fetch partnership-eligible offers if not already loaded
      if (partnersForMap.length === 0) {
        await fetchPartnersForMap();
        // After fetching, search again
        setTimeout(() => {
          const searchQuery = query.toLowerCase().trim();
          const matchedStores = partnersForMap
            .filter(partner => {
              const storeName = partner.store_name?.toLowerCase() || '';
              const address = partner.retail_address?.toLowerCase() || '';
              return storeName.includes(searchQuery) || address.includes(searchQuery);
            })
            .map(partner => ({
              store_name: partner.store_name,
              retail_address: partner.retail_address,
              partner_id: partner.id
            }));
          setStoreOptions(matchedStores);
        }, 500);
      }
    } else {
      setStoreOptions([]);
    }
  };
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return false;
    try {
      // TODO: Replace with Node.js API call
      // const response = await post({ end_point: 'promo-codes/validate', body: { code } });
      // return response.data.is_valid || false;
      
      // Mock implementation
      return false;
    } catch (error) {
      console.error('Error validating promo code:', error);
      return false;
    }
  };
  const handlePromoCodeChange = async (code: string, isApproval: boolean = false) => {
    if (isApproval) {
      setApprovalPromoCode(code);
      const isValid = await validatePromoCode(code);
      setIsApprovalPromoValid(isValid);
      if (isValid) {
        setHasApprovalAgreed(true);
      }
    } else {
      setPromoCode(code);
      const isValid = await validatePromoCode(code);
      setIsPromoValid(isValid);
      if (isValid) {
        setHasAgreed(true);
      }
    }
  };
  const handleSendRequest = async (storeName?: string) => {
    const storeToRequest = storeName || newPartnerStore.trim();
    if (!storeToRequest) {
      toast.error('Please enter a store name');
      return;
    }

    // Check if user has an active offer
    const hasOffer = await checkUserHasOffer();
    if (!hasOffer) {
      toast.error('You must create an offer for your store before sending partnership requests');
      navigate('/offers/create');
      return;
    }
    if (storeName) {
      setNewPartnerStore(storeName);
    }

    // If user has only one location, auto-select it
    if (userLocations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(userLocations[0].id);
    }

    // Open dialog to select location and confirm
    setShowAuthDialog(true);
  };
  const sendPartnerRequest = async () => {
    try {
      // Validate location selection - always required
      if (!selectedLocationId) {
        toast.error('Please select a location for this partnership request');
        return;
      }
      
      // Ensure selected location exists
      const selectedLocation = userLocations.find(loc => loc.id === selectedLocationId);
      if (!selectedLocation) {
        toast.error('Selected location not found. Please select again.');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to send partner requests');
        return;
      }
      
      // Find recipient from partnersForMap or storeOptions
      let recipientId: string | null = null;
      const searchStoreName = newPartnerStore.trim();
      
      console.log('Searching for recipient with store name:', searchStoreName);
      console.log('Available partners in partnersForMap:', partnersForMap.length);
      console.log('Sample partner:', partnersForMap[0]);
      
      // First, try to find from storeOptions (if user selected from dropdown)
      const selectedStore = storeOptions.find(store => store.store_name === searchStoreName);
      if (selectedStore && selectedStore.partner_id) {
        console.log('Found in storeOptions, partner_id:', selectedStore.partner_id);
        // Get the partner from partnersForMap to find the user ID
        const partner = partnersForMap.find(p => p.id === selectedStore.partner_id);
        if (partner) {
          console.log('Found partner in partnersForMap:', partner);
          recipientId = (partner as any).userId || (partner as any).user_id;
          console.log('Extracted recipientId from partner:', recipientId);
        }
      }
      
      // If not found, try to find from partnersForMap by store name (exact match first)
      if (!recipientId) {
        const partner = partnersForMap.find(p => 
          p.store_name?.toLowerCase() === searchStoreName.toLowerCase()
        );
        if (partner) {
          console.log('Found partner by exact store name match:', partner);
          recipientId = (partner as any).userId || (partner as any).user_id;
          console.log('Extracted recipientId:', recipientId);
        }
      }
      
      // If still not found, try partial match
      if (!recipientId) {
        const partner = partnersForMap.find(p => 
          p.store_name?.toLowerCase().includes(searchStoreName.toLowerCase()) ||
          searchStoreName.toLowerCase().includes(p.store_name?.toLowerCase() || '')
        );
        if (partner) {
          console.log('Found partner by partial match:', partner);
          recipientId = (partner as any).userId || (partner as any).user_id;
          console.log('Extracted recipientId:', recipientId);
        }
      }
      
      // If still not found, try to fetch from API using partners/search endpoint
      if (!recipientId) {
        try {
          const { get } = await import("@/services/apis");
          // Try to search for partners using the backend search endpoint
          const searchResponse = await get({ 
            end_point: `partners/search?query=${encodeURIComponent(searchStoreName)}`,
            token: true
          });
          
          if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
            console.log('Found via API search:', searchResponse.data[0]);
            recipientId = searchResponse.data[0]._id || searchResponse.data[0].id;
            console.log('Extracted recipientId from API:', recipientId);
          }
        } catch (searchError) {
          console.error('Error searching for recipient via API:', searchError);
        }
      }
      
      if (!recipientId) {
        console.error('Could not find recipient. Available partners:', partnersForMap.map(p => ({
          store_name: p.store_name,
          userId: (p as any).userId,
          id: p.id
        })));
        toast.error(`Could not find the store "${searchStoreName}". Please select from the dropdown or ensure the store has a partnership-eligible offer.`);
        return;
      }
      
      console.log('Final recipientId to send request to:', recipientId);

      // Check if user has selected display options
      const hasDisplayOption = await checkDisplayOptions();
      if (!hasDisplayOption) {
        setPendingAction(() => async () => {
          await sendPartnerRequestFinal(currentUserId || 'current-user-id', recipientId);
        });
        setShowDisplayOptionCheck(true);
        return;
      }
      await sendPartnerRequestFinal(currentUserId || 'current-user-id', recipientId);
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    }
  };
  const sendPartnerRequestFinal = async (senderId: string, recipientId: string) => {
    try {
      const { post } = await import("@/services/apis");
      const response = await post({ 
        end_point: 'partners/requests', 
        body: { 
          recipient_id: recipientId,
          location_id: selectedLocationId, // Always use selected location (required)
          promo_code: isPromoValid ? promoCode : undefined
        },
        token: true
      });
      
      if (response.success) {
        const locationText = userLocations.length > 1 ? ` for ${userLocations.find(loc => loc.id === selectedLocationId)?.name}` : '';
        if (isPromoValid) {
          toast.success(`Partner request sent successfully${locationText}! Partnership fee waived with promo code "${promoCode.toUpperCase()}"`);
        } else {
          toast.success(`Partner request sent successfully${locationText}!`);
        }
        setNewPartnerStore("");
        setStoreOptions([]);
        setShowAuthDialog(false);
        setHasAgreed(false);
        setPromoCode("");
        setIsPromoValid(false);
        // Reset location selection only if user has multiple locations
        if (userLocations.length > 1) {
          setSelectedLocationId("");
        }
        fetchPartnerRequests();
      } else {
        throw new Error(response.message || 'Failed to send request');
      }
    } catch (error: any) {
      console.error('Error sending partner request:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send partner request');
    }
  };
  const handleApproveRequest = async (requestId: string) => {
    const hasDisplayOption = await checkDisplayOptions();
    if (!hasDisplayOption) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setPendingAction(() => async () => {
          setPendingBillingRequest(request);
          setShowBillingConfirmDialog(true);
        });
        setShowDisplayOptionCheck(true);
      }
      return;
    }
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setPendingBillingRequest(request);
      setShowBillingConfirmDialog(true);
    }
  };
  const handleConfirmBilling = async () => {
    if (!pendingBillingRequest) return;
    setProcessingPayment(true);
    try {
      const { patch } = await import("@/services/apis");
      const response = await patch({ 
        end_point: `partners/approve/${pendingBillingRequest.id}`, 
        body: {},
        token: true
      });
      
      if (response.success) {
        toast.success(response.message || 'Partnership approved and both parties billed successfully! You and your new partner have each been charged $10.');
        setShowBillingConfirmDialog(false);
        setPendingBillingRequest(null);
        fetchPartnerRequests();
      } else {
        throw new Error(response.message || 'Failed to approve partnership');
      }
    } catch (error: any) {
      console.error('Error processing partnership payment:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to process partnership payment. Please ensure both parties have saved payment methods.');
    } finally {
      setProcessingPayment(false);
    }
  };
  const handleCancelPartnership = (request: PartnerRequest) => {
    setPendingCancelRequest(request);
    setShowCancelDialog(true);
  };
  const confirmCancelPartnership = async () => {
    if (!pendingCancelRequest) return;
    try {
      const { patch } = await import("@/services/apis");
      const response = await patch({ 
        end_point: `partners/cancel/${pendingCancelRequest.id}`, 
        body: {},
        token: true
      });
      
      if (response.success) {
        const partnerStoreName = getRequestType(pendingCancelRequest) === 'outgoing' ? pendingCancelRequest.recipient_profile?.store_name : pendingCancelRequest.sender_profile?.store_name;
        toast.success(response.message || `Partnership with ${partnerStoreName} has been cancelled`);
        setShowCancelDialog(false);
        setPendingCancelRequest(null);
        fetchPartnerRequests();
      } else {
        throw new Error(response.message || 'Failed to cancel partnership');
      }
    } catch (error: any) {
      console.error('Error cancelling partnership:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to cancel partnership');
    }
  };
  const handleOpenMessaging = (request: PartnerRequest) => {
    const requestType = getRequestType(request);
    const partnerName = requestType === 'outgoing' ? request.recipient_profile?.store_name : request.sender_profile?.store_name;

    // Navigate to settings messages tab with partner selected
    navigate(`/settings/messages?partner=${encodeURIComponent(partnerName || '')}`);
  };
  const fetchMessages = async (partnershipId: string) => {
    setLoadingMessages(true);
    try {
      // Mock messages for now - will work once database table is created
      const mockMessages = [{
        id: '1',
        sender_id: currentUserId === 'current-user-id' ? 'joes-coffee-id' : 'current-user-id',
        recipient_id: currentUserId,
        partnership_id: partnershipId,
        message_text: "Hey! Looking forward to our partnership!",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        read: false
      }];
      setMessages(mockMessages);
      setLoadingMessages(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setLoadingMessages(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartnership) return;
    const recipientId = getRequestType(selectedPartnership) === 'outgoing' ? selectedPartnership.recipient_id : selectedPartnership.sender_id;
    try {
      // Add message to local state for now
      const newMsg = {
        id: Date.now().toString(),
        sender_id: currentUserId,
        recipient_id: recipientId,
        partnership_id: selectedPartnership.id,
        message_text: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { patch } = await import("@/services/apis");
      const endpoint = status === 'approved' 
        ? `partners/approve/${requestId}`
        : `partners/reject/${requestId}`;
      
      const response = await patch({ 
        end_point: endpoint, 
        body: {
          promo_code: status === 'approved' && isApprovalPromoValid ? approvalPromoCode : undefined
        },
        token: true
      });
      
      if (response.success) {
        if (status === 'approved') {
          if (isApprovalPromoValid) {
            toast.success(`Partner request approved successfully! Partnership fee waived with promo code "${approvalPromoCode.toUpperCase()}"`);
          } else {
            toast.success(response.message || 'Partner request approved successfully!');
          }
          setShowApprovalAuthDialog(false);
          setHasApprovalAgreed(false);
          setPendingApprovalRequestId(null);
          setApprovalPromoCode("");
          setIsApprovalPromoValid(false);
        } else {
          toast.success(response.message || `Partner request ${status} successfully!`);
        }
        fetchPartnerRequests();
      } else {
        throw new Error(response.message || 'Failed to update partner request');
      }
    } catch (error: any) {
      console.error('Error updating partner request:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update partner request');
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expired</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };
  const getRequestType = (request: PartnerRequest) => {
    // Compare as strings to handle both ObjectId and string formats
    const senderIdStr = request.sender_id?.toString() || request.senderId?.toString() || '';
    const currentUserIdStr = currentUserId?.toString() || '';
    
    // If sender_id matches current user, it's an outgoing request
    // Otherwise, it's an incoming request (user is the receiver)
    return senderIdStr === currentUserIdStr ? 'outgoing' : 'incoming';
  };
  const getRequestTypeIcon = (request: PartnerRequest) => {
    const requestType = getRequestType(request);
    const isOutgoing = requestType === 'outgoing';
    return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isOutgoing ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {isOutgoing ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOutgoing ? 'Outgoing Request' : 'Incoming Request'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
  };
  const filteredRequests = requests.filter(request => {
    const partnerStoreName = getRequestType(request) === 'outgoing' ? request.recipient_profile?.store_name : request.sender_profile?.store_name;
    return partnerStoreName?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  return <AppLayout pageTitle="Partners" pageIcon={<Store className="h-5 w-5 text-primary" />}>
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Partner Network
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your partnership requests and discover local business partners
          </p>
        </div>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Partner Requests
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Partner Search
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Send Partner Request
              </CardTitle>
              <CardDescription>
                Enter a store name to send a partnership request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Enter store name to send request..." value={newPartnerStore} onChange={e => {
                    setNewPartnerStore(e.target.value);
                    searchStores(e.target.value);
                  }} onFocus={() => {
                    setIsInputFocused(true);
                    searchStores(newPartnerStore);
                  }} onBlur={() => {
                    setTimeout(() => setIsInputFocused(false), 200);
                  }} className="flex-1" />
                  <Button onClick={() => handleSendRequest()} disabled={!newPartnerStore.trim()} className="shrink-0">
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>

                {storeOptions.length > 0 && isInputFocused && <div className="relative">
                  <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {storeOptions.map((store, index) => <button key={index} className="w-full px-4 py-2 text-left hover:bg-muted border-b last:border-b-0 text-sm" onClick={() => {
                      setNewPartnerStore(store.store_name);
                      setStoreOptions([]);
                      setIsInputFocused(false);
                    }}>
                      <div className="font-medium">{store.store_name}</div>
                      <div className="text-muted-foreground text-xs">{store.retail_address}</div>
                    </button>)}
                  </div>
                </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Partnership Recommendations
              </CardTitle>
              <CardDescription>Other retailers ordered by distance, similarities in audience and complimentary purchase behavior.</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                No recommendations available yet.
              </div> : <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Retailer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Your Location</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendations.map((rec, index) => <TableRow key={`${rec.partner_id}-${rec.location_id}`}>
                      <TableCell className="font-medium">
                        {rec.partner_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.partner_address}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{rec.location_name}</span>
                          <span className="text-xs text-muted-foreground">{rec.location_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rec.distance < 1 ? `${(rec.distance * 5280).toFixed(0)} ft` : `${rec.distance.toFixed(1)} mi`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rec.is_offerx_active ? <Badge variant="default" className="bg-green-600">Active Partner</Badge> : <Badge variant="outline">Available</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => {
                          setSelectedLocationId(rec.location_id);
                          handleSendRequest(rec.partner_name);
                        }} className="gap-2">
                          <Send className="h-4 w-4" />
                          Send Request
                        </Button>
                      </TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Partner Search
              </CardTitle>
              <CardDescription>
                Discover and connect with local business partners in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PartnerMap 
                partners={partnersForMap} 
                onSendRequest={handleSendRequest}
                userLocations={userLocations}
              />

              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input placeholder="Enter store name to send request..." value={newPartnerStore} onChange={e => {
                      setNewPartnerStore(e.target.value);
                      searchStores(e.target.value);
                    }} onFocus={() => {
                      setIsInputFocused(true);
                      searchStores(newPartnerStore);
                    }} onBlur={() => {
                      setTimeout(() => setIsInputFocused(false), 200);
                    }} />
                  </div>
                  <Button onClick={() => handleSendRequest()} disabled={!newPartnerStore.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>

                {storeOptions.length > 0 && isInputFocused && <div className="relative">
                  <div className="absolute z-10 w-full mt-2 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {storeOptions.map((store, index) => <button key={index} className="w-full px-4 py-2 text-left hover:bg-muted border-b last:border-b-0 text-sm" onClick={() => {
                      setNewPartnerStore(store.store_name);
                      setStoreOptions([]);
                      setIsInputFocused(false);
                    }}>
                      <div className="font-medium">{store.store_name}</div>
                      <div className="text-muted-foreground text-xs">{store.retail_address}</div>
                    </button>)}
                  </div>
                </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Partnership Requests Table - Always Visible */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Partner Requests
          </CardTitle>
          <CardDescription>
            View and manage your partnership requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex-1">
              <Input placeholder="Search requests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
            </div>

            {loading ? <div className="text-center py-8">Loading requests...</div> : filteredRequests.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              No partner requests found.
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Partner/Advertiser</TableHead>
                    <TableHead>Your Store</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Their Ad</TableHead>
                    <TableHead>Your Ad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => {
                    const requestType = getRequestType(request);
                    const partnerStore = requestType === 'outgoing' ? request.recipient_profile?.store_name : request.sender_profile?.store_name;

                    // Determine if this is an Ad request (from Media Street)
                    const isAdRequest = partnerStore === "Media Street";

                    // Mock distance calculation
                    const getDistance = () => {
                      const distances = [".1 mi", ".2 mi", "< 1 mile", ".3 mi"];
                      return distances[Math.floor(Math.random() * distances.length)];
                    };

                    // Get offer images based on store type
                    const getOfferImage = (storeName: string) => {
                      if (storeName?.toLowerCase().includes('coffee')) {
                        return posCoffeeImage;
                      } else if (storeName?.toLowerCase().includes('salon')) {
                        return posSalonImage;
                      } else if (storeName?.toLowerCase().includes('flower')) {
                        return posFlowersImage;
                      } else {
                        return posSubsImage;
                      }
                    };
                    return <TableRow key={request.id}>
                      <TableCell>
                        {getRequestTypeIcon(request)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={isAdRequest ? "default" : "outline"}>
                            {isAdRequest ? "Ad" : "Partner"}
                          </Badge>
                          {isAdRequest && <Badge variant="secondary">$25</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {partnerStore}
                      </TableCell>
                      <TableCell className="font-medium">
                        {requestType === 'incoming' ? request.recipient_profile?.store_name : request.sender_profile?.store_name}
                      </TableCell>
                      <TableCell>
                        {isAdRequest ? "N/A" : getDistance()}
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setEnlargedImage({
                          src: getOfferImage(partnerStore || ''),
                          title: `${partnerStore} offer`
                        })}>
                          <img src={getOfferImage(partnerStore || '')} alt={`${partnerStore} offer`} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdRequest ? <div className="text-muted-foreground">N/A</div> : <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setEnlargedImage({
                          src: posSalonImage,
                          title: "Your offer"
                        })}>
                          <img src={posSalonImage} alt="Your offer" className="w-full h-full object-cover" />
                        </div>}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {isAdRequest ? <>
                          {new Date(request.created_at).toLocaleDateString()} - {new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </> : request.status === 'pending' ? <>
                          {new Date(request.created_at).toLocaleDateString()}
                        </> : request.status === 'rejected' ? <>
                          {new Date(request.created_at).toLocaleDateString()} - N/A
                        </> : <>
                          {new Date(request.created_at).toLocaleDateString()} - ∞
                        </>}
                      </TableCell>
                      <TableCell>
                        {requestType === 'incoming' && request.status === 'pending' && <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveRequest(request.id)} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateRequestStatus(request.id, 'rejected')} className="text-red-600 border-red-600 hover:bg-red-50">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>}
                        {request.status === 'approved' && <Button size="sm" variant="outline" onClick={() => handleCancelPartnership(request)} className="text-red-600 border-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>}
                        {requestType === 'outgoing' && request.status === 'pending' && <Badge variant="outline" className="text-xs">
                          Awaiting Response
                        </Badge>}
                        {request.status === 'cancelled' && <Button size="sm" variant="outline" onClick={() => {
                          setNewPartnerStore(partnerStore || '');
                          handleSendRequest();
                        }} className="text-primary border-primary hover:bg-primary/10">
                          <Send className="h-4 w-4 mr-1" />
                          New Request
                        </Button>}
                      </TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            </div>}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send Partner Request
            </DialogTitle>
            <DialogDescription>
              You're about to send a partner request to <strong>{newPartnerStore}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Select Location for Partnership {userLocations.length > 1 && <span className="text-muted-foreground">(Required)</span>}
              </label>
              <div className="text-xs text-muted-foreground mb-2">
                Select which location you want to use for this partnership. One offer can be used for one location per partnership.
              </div>
              <div className="grid grid-cols-1 gap-2">
                {userLocations.map(location => (
                  <Button 
                    key={location.id} 
                    variant={selectedLocationId === location.id ? "default" : "outline"} 
                    className="w-full justify-start text-left h-auto py-3" 
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{location.name}</span>
                      <span className="text-xs text-muted-foreground">{location.address}</span>
                    </div>
                  </Button>
                ))}
              </div>
              {userLocations.length > 0 && !selectedLocationId && (
                <p className="text-xs text-red-600">Please select a location to continue</p>
              )}
            </div>

            {/* Payment method check bypassed - payment system disabled */}

            <div className="space-y-2">
              <label htmlFor="promo-code" className="text-sm font-medium">
                Promo Code (Optional)
              </label>
              <div className="space-y-2">
                <Input id="promo-code" placeholder="Enter promo code to waive partnership fee" value={promoCode} onChange={e => handlePromoCodeChange(e.target.value)} />
                {promoCode && <div className={`text-xs ${isPromoValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isPromoValid ? '✓ Valid promo code - partnership fee waived!' : '✗ Invalid promo code'}
                </div>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="agree-terms" checked={hasAgreed || isPromoValid} onCheckedChange={checked => {
                  if (!isPromoValid) {
                    setHasAgreed(checked as boolean);
                  }
                }} />
                <label htmlFor="agree-terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the partnership terms and understand that this partnership will allow cross-promotion of offers between our stores.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAuthDialog(false);
              setHasAgreed(false);
              setPromoCode("");
              setIsPromoValid(false);
              // Reset location selection only if user has multiple locations
              if (userLocations.length > 1) {
                setSelectedLocationId("");
              }
            }}>
              Cancel
            </Button>
            <Button onClick={sendPartnerRequest} disabled={!hasAgreed && !isPromoValid || !selectedLocationId} className="gap-2">
              <Send className="h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Authentication Dialog */}
      <Dialog open={showApprovalAuthDialog} onOpenChange={setShowApprovalAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Approve Partner Request
            </DialogTitle>
            <DialogDescription>
              You're about to approve this partnership request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment method check bypassed - payment system disabled */}

            <div className="space-y-2">
              <label htmlFor="approval-promo-code" className="text-sm font-medium">
                Promo Code (Optional)
              </label>
              <div className="space-y-2">
                <Input id="approval-promo-code" placeholder="Enter promo code to waive partnership fee" value={approvalPromoCode} onChange={e => handlePromoCodeChange(e.target.value, true)} />
                {approvalPromoCode && <div className={`text-xs ${isApprovalPromoValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isApprovalPromoValid ? '✓ Valid promo code - partnership fee waived!' : '✗ Invalid promo code'}
                </div>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="agree-approval-terms" checked={hasApprovalAgreed || isApprovalPromoValid} onCheckedChange={checked => {
                  if (!isApprovalPromoValid) {
                    setHasApprovalAgreed(checked as boolean);
                  }
                }} />
                <label htmlFor="agree-approval-terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the partnership terms and understand that this partnership will allow cross-promotion of offers between our stores.
                </label>
              </div>

              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                Partnership includes: Cross-promotional campaigns, shared customer insights,
                analytics dashboard, and promotional materials.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowApprovalAuthDialog(false);
              setHasApprovalAgreed(false);
              setPendingApprovalRequestId(null);
              setApprovalPromoCode("");
              setIsApprovalPromoValid(false);
            }}>
              Cancel
            </Button>
            <Button onClick={() => pendingApprovalRequestId && updateRequestStatus(pendingApprovalRequestId, 'approved')} disabled={!hasApprovalAgreed && !isApprovalPromoValid} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Approve Partnership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Confirmation Dialog */}
      <Dialog open={showBillingConfirmDialog} onOpenChange={setShowBillingConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Confirm Partnership Billing
            </DialogTitle>
            <DialogDescription>
              Approving this partnership will charge both you and{" "}
              <strong>{pendingBillingRequest?.sender_profile?.store_name}</strong> $10 each
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Billing Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You will be charged $10 to your saved payment method</li>
                      <li>{pendingBillingRequest?.sender_profile?.store_name} will also be charged $10</li>
                      <li>Both charges will be processed simultaneously</li>
                      <li>Please ensure you have a valid payment method in Settings &gt; Billing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
              This partnership fee covers setup, management, and ongoing cross-promotional services between both stores.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBillingConfirmDialog(false);
              setPendingBillingRequest(null);
            }} disabled={processingPayment}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBilling} disabled={processingPayment} className="bg-green-600 hover:bg-green-700">
              {processingPayment ? <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </> : <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Charge Both Parties
              </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Partnership Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Cancel Partnership
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your partnership with{" "}
              <strong>
                {pendingCancelRequest && (getRequestType(pendingCancelRequest) === 'outgoing' ? pendingCancelRequest.recipient_profile?.store_name : pendingCancelRequest.sender_profile?.store_name)}
              </strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>This action cannot be undone</li>
                      <li>Your partner will be notified of the cancellation</li>
                      <li>You will lose access to shared promotional campaigns</li>
                      <li>You can send a new partnership request in the future</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCancelDialog(false);
              setPendingCancelRequest(null);
            }}>
              Keep Partnership
            </Button>
            <Button onClick={confirmCancelPartnership} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Partnership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enlarged Image Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img src={enlargedImage?.src || ''} alt={enlargedImage?.title || ''} className="w-full h-auto rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Display Option Check Dialog */}
      <DisplayOptionCheck open={showDisplayOptionCheck} onOpenChange={setShowDisplayOptionCheck} onConfirm={() => {
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      }} title="Select Display Option" description="Before sending or accepting partnership requests, please select how you'll display partner offers." />

      {/* Messaging Dialog */}
      <Dialog open={showMessagingDialog} onOpenChange={setShowMessagingDialog}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages with {selectedPartnership && (getRequestType(selectedPartnership) === 'outgoing' ? selectedPartnership.recipient_profile?.store_name : selectedPartnership.sender_profile?.store_name)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {loadingMessages ? <div className="text-center py-8 text-muted-foreground">Loading messages...</div> : messages.length === 0 ? <div className="text-center py-8 text-muted-foreground">No messages yet. Start the conversation!</div> : <div className="space-y-4">
              {messages.map(msg => {
                const isOwnMessage = msg.sender_id === currentUserId;
                return <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{msg.message_text}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>;
              })}
            </div>}
          </ScrollArea>
          <div className="flex gap-2">
            <Input placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </AppLayout>;
};
export default PartnerRequests;