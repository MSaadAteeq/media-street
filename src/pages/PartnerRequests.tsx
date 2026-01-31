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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Check, X, Plus, Send, UserPlus, ArrowDown, ArrowUp, Eye, ChevronRight, Gift, Map as MapIcon, Trash2, MessageSquare, Lightbulb, Monitor, Printer, QrCode as QrCodeIcon } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PartnerMap from "@/components/PartnerMap";
import DisplayOptionCheck from "@/components/DisplayOptionCheck";
import PartnershipAnalyticsDialog from "@/components/PartnershipAnalyticsDialog";
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
  sender_offer_image?: string | null;
  recipient_offer_image?: string | null;
  sender_offer?: any;
  recipient_offer?: any;
};
const PartnerRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPartnerStore, setNewPartnerStore] = useState("");
  const [storeOptions, setStoreOptions] = useState<{
    store_name: string;
    retail_address: string;
    partner_id?: string;
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
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
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
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [selectedRequestForAnalytics, setSelectedRequestForAnalytics] = useState<PartnerRequest | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // 3-step partnership request flow state
  const [partnershipStep, setPartnershipStep] = useState<1 | 2 | 3>(1);
  const [displayCarousel, setDisplayCarousel] = useState(false);
  const [displayQR, setDisplayQR] = useState(false);
  const [creativeIdeas, setCreativeIdeas] = useState("");
  const [creditBalance, setCreditBalance] = useState<number>(50);
  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      await fetchPartnerRequests();
      await fetchUserLocations();
      await fetchPartnersForMap();
      await checkPaymentMethod();
      await fetchCreditBalance();
    };
    init();
  }, []);
  
  const fetchCreditBalance = async () => {
    try {
      const { get } = await import("@/services/apis");
      const response = await get({ end_point: 'users/me', token: true });
      if (response.success && response.data) {
        setCreditBalance(response.data.credit || 50);
      } else {
        setCreditBalance(50);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      setCreditBalance(50);
    }
  };
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
    setIsLoadingPartners(true);
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
        
        // Extract userId - handle both populated and non-populated cases
        let offerUserId: string | null = null;
        if (offer.userId) {
          if (typeof offer.userId === 'object' && offer.userId._id) {
            // Populated user object
            offerUserId = offer.userId._id.toString();
          } else if (typeof offer.userId === 'object' && offer.userId.toString) {
            // ObjectId object
            offerUserId = offer.userId.toString();
          } else if (typeof offer.userId === 'string') {
            // String ID
            offerUserId = offer.userId;
          }
        }
        
        // Also check user object if available (from backend formatted response)
        if (!offerUserId && offer.user?._id) {
          offerUserId = offer.user._id.toString();
        }
        
        // Skip if no userId found
        if (!offerUserId) {
          console.warn('⚠️ Warning: No userId found for offer:', offer._id || offer.id);
          console.warn('   Offer structure:', {
            userId: offer.userId,
            user: offer.user,
            id: offer._id || offer.id
          });
          return; // Skip this offer
        }
        
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
            locationMap.set(locId, {
              id: locId,
              store_name: locName,
              retail_address: locAddress,
              first_name: offer.user?.fullName?.split(' ')[0] || offer.userId?.fullName?.split(' ')[0] || '',
              last_name: offer.user?.fullName?.split(' ').slice(1).join(' ') || offer.userId?.fullName?.split(' ').slice(1).join(' ') || '',
              latitude: locLatitude,
              longitude: locLongitude,
              is_offerx_active: false,
              userId: offerUserId, // Store userId for partner requests - ensure it's always set
              user_id: offerUserId, // Also store as user_id for compatibility
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
      
      // Fetch pending partner requests to mark partners with pending status
      let pendingRequestMap = new Map<string, boolean>();
      try {
        const { get: getPending } = await import("@/services/apis");
        const pendingResponse = await getPending({ 
          end_point: 'partners/requests',
          token: true
        });
        
        if (pendingResponse.success && pendingResponse.data && Array.isArray(pendingResponse.data)) {
          // Get current user ID
          const currentUserIdStr = currentUserId?.toString() || '';
          
          // Mark partners that have pending requests (only outgoing requests from current user)
          pendingResponse.data.forEach((request: any) => {
            // Only consider pending requests where current user is the requester
            const requesterId = request.requesterId?._id?.toString() || 
                               request.requesterId?.toString() || 
                               request.requester_id?.toString() ||
                               (typeof request.requesterId === 'object' && request.requesterId?._id?.toString());
            const receiverId = request.receiverId?._id?.toString() || 
                              request.receiverId?.toString() || 
                              request.receiver_id?.toString() ||
                              (typeof request.receiverId === 'object' && request.receiverId?._id?.toString());
            const requestStatus = request.status || request.requestStatus;
            
            // If current user is the requester and request is pending, mark the receiver's partner as pending
            if (requesterId === currentUserIdStr && receiverId && requestStatus === 'pending') {
              // Find partner by userId (receiver's userId)
              formattedPartners.forEach(partner => {
                const partnerUserId = (partner as any).userId?.toString() || (partner as any).user_id?.toString();
                if (partnerUserId === receiverId) {
                  pendingRequestMap.set(partner.id, true);
                }
              });
            }
          });
          
          console.log(`Found ${pendingRequestMap.size} partners with pending requests`);
        }
      } catch (pendingError) {
        console.error('Error fetching pending requests:', pendingError);
        // Continue without pending request info
      }
      
      // Add pending request status to partners
      const partnersWithPendingStatus = formattedPartners.map(partner => ({
        ...partner,
        has_pending_request: pendingRequestMap.has(partner.id) || false
      }));
      
      // Filter out locations without valid coordinates (latitude and longitude must be valid numbers)
      const validPartners = partnersWithPendingStatus.filter(partner => {
        const hasValidCoords = partner.latitude && partner.longitude && 
                               typeof partner.latitude === 'number' && 
                               typeof partner.longitude === 'number' &&
                               partner.latitude !== 0 && 
                               partner.longitude !== 0 &&
                               !isNaN(partner.latitude) && 
                               !isNaN(partner.longitude);
        
        if (!hasValidCoords) {
          console.warn(`Location "${partner.store_name}" (${partner.id}) is missing valid coordinates: lat=${partner.latitude}, lng=${partner.longitude}`);
        }
        
        return hasValidCoords;
      });
      
      console.log(`Filtered to ${validPartners.length} locations with valid coordinates (removed ${formattedPartners.length - validPartners.length} without coordinates)`);
      
      if (validPartners.length === 0 && partnershipEligibleOffers.length === 0) {
        console.warn('No partnership-eligible offers found. This could mean:');
        console.warn('1. No offers have been created with available_for_partnership: true');
        console.warn('2. Backend needs a public endpoint /offers/partnership-eligible to return all partnership-eligible offers');
        console.warn('3. The authenticated /offers endpoint only returns current user\'s offers, not all users\' offers');
      } else if (validPartners.length === 0 && partnershipEligibleOffers.length > 0) {
        console.warn(`Found ${partnershipEligibleOffers.length} offers but none have valid location coordinates.`);
        console.warn('Please ensure all locations have latitude and longitude set when creating them.');
      }
      
      setPartnersForMap(validPartners);
      
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
      
      if (response.success && response.data && Array.isArray(response.data)) {
        // Check if user has any active offers with locations assigned
        // An offer is valid if:
        // 1. It's active (is_active or isActive is true)
        // 2. It has at least one location assigned (locationIds or location_ids array has items)
        // 3. It's not expired (expiresAt is in the future or null)
        const now = new Date();
        const hasActiveOffer = response.data.some((offer: any) => {
          const isActive = offer.is_active !== false && offer.isActive !== false;
          const hasLocations = (offer.locationIds && offer.locationIds.length > 0) || 
                              (offer.location_ids && offer.location_ids.length > 0);
          const expiresAt = offer.expiresAt || offer.expires_at;
          const notExpired = !expiresAt || new Date(expiresAt) > now;
          
          return isActive && hasLocations && notExpired;
        });
        
        console.log('🔍 Offer check result:', {
          totalOffers: response.data.length,
          hasActiveOffer,
          offers: response.data.map((o: any) => ({
            id: o._id || o.id,
            isActive: o.is_active !== false && o.isActive !== false,
            hasLocations: (o.locationIds && o.locationIds.length > 0) || (o.location_ids && o.location_ids.length > 0),
            expiresAt: o.expiresAt || o.expires_at,
            isOpenOffer: o.is_open_offer || o.isOpenOffer
          }))
        });
        
        return hasActiveOffer;
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
      console.log('🔍 Fetching partner requests...');
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'partners/requests',
        token: true
      });
      
      console.log('📥 Partner requests API response:', response);
      
      if (response && response.success && response.data) {
        console.log(`✅ Received ${response.data.length} partner requests`);
        
        // Fetch all offers to get offer details for each request
        let allOffers: any[] = [];
        try {
          const offersResponse = await get({
            end_point: 'offers',
            token: true
          });
          if (offersResponse.success && offersResponse.data) {
            allOffers = offersResponse.data;
            console.log(`✅ Fetched ${allOffers.length} offers for matching`);
          }
        } catch (offerError) {
          console.warn('⚠️ Could not fetch offers:', offerError);
        }
        
        // Format requests to match interface and include offer images
        const formattedRequests = await Promise.all(response.data.map(async (req: any) => {
          const senderId = req.senderId?.toString() || req.sender_id?.toString() || req.senderId || req.sender_id;
          const recipientId = req.recipientId?.toString() || req.recipient_id?.toString() || req.recipientId || req.recipient_id;
          
          // Find offers for sender and recipient
          let senderOffer = req.senderOffer || req.sender_offer || null;
          let recipientOffer = req.recipientOffer || req.recipient_offer || null;
          
          console.log(`🔍 Processing request ${req._id || req.id}:`, {
            status: req.status,
            senderId,
            recipientId,
            hasSenderOffer: !!senderOffer,
            hasRecipientOffer: !!recipientOffer,
            senderOfferImage: req.senderOfferImage || req.sender_offer_image,
            recipientOfferImage: req.recipientOfferImage || req.recipient_offer_image
          });
          
          // If offers not included in response, try to find them from allOffers
          if (!senderOffer && senderId && allOffers.length > 0) {
            senderOffer = allOffers.find((offer: any) => {
              const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
              return offerUserId === senderId;
            });
            if (senderOffer) {
              console.log(`✅ Found sender offer from allOffers:`, senderOffer._id || senderOffer.id);
            }
          }
          
          if (!recipientOffer && recipientId && allOffers.length > 0) {
            recipientOffer = allOffers.find((offer: any) => {
              const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
              return offerUserId === recipientId;
            });
            if (recipientOffer) {
              console.log(`✅ Found recipient offer from allOffers:`, recipientOffer._id || recipientOffer.id);
            }
          }
          
          // Get offer images - try multiple possible field names (matching Offers.tsx logic)
          const getOfferImage = (offer: any) => {
            if (!offer) return null;
            
            // Check all possible image field names from backend
            const offerImage = offer.offerImage || 
                              offer.offer_image || 
                              offer.offerImageUrl || 
                              offer.offer_image_url ||
                              offer.image ||
                              null;
            
            // Handle base64 images - convert to data URL if needed
            let processedImageUrl = offerImage;
            if (offerImage && !offerImage.startsWith('http') && !offerImage.startsWith('data:') && !offerImage.startsWith('/')) {
              // Check if it's base64 without data URL prefix
              if (offerImage.length > 100) {
                processedImageUrl = `data:image/png;base64,${offerImage}`;
              }
            }
            
            return processedImageUrl;
          };
          
          // Try to get images from multiple sources
          let senderOfferImage = req.senderOfferImage || req.sender_offer_image || null;
          if (!senderOfferImage && senderOffer) {
            senderOfferImage = getOfferImage(senderOffer);
          }
          
          let recipientOfferImage = req.recipientOfferImage || req.recipient_offer_image || null;
          if (!recipientOfferImage && recipientOffer) {
            recipientOfferImage = getOfferImage(recipientOffer);
          }
          
          console.log(`📸 Offer images for request ${req._id || req.id}:`, {
            senderOfferImage,
            recipientOfferImage,
            hasSenderOffer: !!senderOffer,
            hasRecipientOffer: !!recipientOffer,
            senderOfferFields: senderOffer ? Object.keys(senderOffer) : [],
            recipientOfferFields: recipientOffer ? Object.keys(recipientOffer) : []
          });
          
          return {
            id: req._id?.toString() || req.id?.toString(),
            sender_id: senderId,
            recipient_id: recipientId,
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
            },
            // Include offer images and full offer objects
            sender_offer_image: senderOfferImage,
            recipient_offer_image: recipientOfferImage,
            sender_offer: senderOffer,
            recipient_offer: recipientOffer
          };
        }));
        
        setRequests(formattedRequests);
        console.log(`✅ Set ${formattedRequests.length} formatted requests to state with offer details`);
      } else {
        console.warn('⚠️ No data in response or response not successful:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Error fetching partner requests:', error);
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
          partner_id: partner.id,
          userId: (partner as any).userId || (partner as any).user_id
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
              partner_id: partner.id,
              userId: (partner as any).userId || (partner as any).user_id
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

    // Reset to step 1 and open dialog
    setPartnershipStep(1);
    setDisplayCarousel(false);
    setDisplayQR(false);
    setCreativeIdeas("");
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
      
      // Save display options
      if (displayCarousel) {
        localStorage.setItem('displayCarousel', 'true');
      }
      if (displayQR) {
        localStorage.setItem('displayQR', 'true');
      }
      if (creativeIdeas.trim()) {
        localStorage.setItem('creativeIdeas', creativeIdeas.trim());
      }
      
      // Find recipient from partnersForMap or storeOptions
      let recipientId: string | null = null;
      const searchStoreName = newPartnerStore.trim();
      
      console.log('🔍 Searching for recipient with store name:', searchStoreName);
      console.log('📊 Available partners in partnersForMap:', partnersForMap.length);
      if (partnersForMap.length > 0) {
        console.log('📋 Sample partner:', {
          id: partnersForMap[0].id,
          store_name: partnersForMap[0].store_name,
          userId: (partnersForMap[0] as any).userId,
          user_id: (partnersForMap[0] as any).user_id
        });
      }
      
      // First, try to find from storeOptions (if user selected from dropdown)
      const selectedStore = storeOptions.find(store => store.store_name === searchStoreName);
      if (selectedStore) {
        console.log('Found in storeOptions, partner_id:', selectedStore.partner_id);
        // First try to get userId directly from storeOptions if available
        if ((selectedStore as any).userId) {
          recipientId = (selectedStore as any).userId;
          console.log('Extracted recipientId directly from storeOptions:', recipientId);
        } else if (selectedStore.partner_id) {
          // Get the partner from partnersForMap to find the user ID
          const partner = partnersForMap.find(p => p.id === selectedStore.partner_id);
          if (partner) {
            console.log('Found partner in partnersForMap:', partner);
            recipientId = (partner as any).userId || (partner as any).user_id;
            console.log('Extracted recipientId from partner:', recipientId);
          }
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
        console.error('❌ Could not find recipient. Available partners:', partnersForMap.map(p => ({
          store_name: p.store_name,
          userId: (p as any).userId,
          user_id: (p as any).user_id,
          id: p.id
        })));
        console.error('❌ Search store name:', searchStoreName);
        console.error('❌ Store options:', storeOptions);
        toast.error(`Could not find the store "${searchStoreName}". Please select from the dropdown or ensure the store has a partnership-eligible offer.`);
        return;
      }
      
      console.log('Final recipientId to send request to:', recipientId);
      
      await sendPartnerRequestFinal(currentUserId || 'current-user-id', recipientId);
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    }
  };
  const sendPartnerRequestFinal = async (senderId: string, recipientId: string) => {
    try {
      // Find the partner location ID from partnersForMap based on the store name
      // This is the location ID of the partner's location that was selected
      let partnerLocationId: string | undefined = undefined;
      const searchStoreName = newPartnerStore.trim();
      const selectedPartner = partnersForMap.find(p => 
        p.store_name?.toLowerCase() === searchStoreName.toLowerCase()
      );
      if (selectedPartner && selectedPartner.id) {
        partnerLocationId = selectedPartner.id;
        console.log('Found partner location ID:', partnerLocationId);
      }
      
      const { post } = await import("@/services/apis");
      const response = await post({ 
        end_point: 'partners/requests', 
        body: { 
          recipient_id: recipientId,
          location_id: selectedLocationId, // Requester's location (required)
          partner_location_id: partnerLocationId, // Partner's location ID (optional but recommended)
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
        setPartnershipStep(1);
        setHasAgreed(false);
        setPromoCode("");
        setIsPromoValid(false);
        setDisplayCarousel(false);
        setDisplayQR(false);
        setCreativeIdeas("");
        // Reset location selection only if user has multiple locations
        if (userLocations.length > 1) {
          setSelectedLocationId("");
        }
        fetchPartnerRequests();
        // Refresh partners list to update pending status
        fetchPartnersForMap();
      } else {
        throw new Error(response.message || 'Failed to send request');
      }
    } catch (error: any) {
      console.error('Error sending partner request:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send partner request');
    }
  };
  const handleApproveRequest = async (requestId: string) => {
    // Set display options to default (tablet) if not already set
    if (localStorage.getItem('displayCarousel') === null) {
      localStorage.setItem('displayCarousel', 'true');
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
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: `messages/partnership/${partnershipId}`, 
        token: true 
      });
      if (response.success && response.data) {
        setMessages(response.data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartnership) return;
    const recipientId = getRequestType(selectedPartnership) === 'outgoing' 
      ? selectedPartnership.recipient_id 
      : selectedPartnership.sender_id;
    
    try {
      const { post } = await import("@/services/apis");
      const response = await post({
        end_point: 'messages',
        body: {
          partnershipId: selectedPartnership.id,
          messageText: newMessage.trim(),
          recipientId: recipientId
        },
        token: true
      });

      if (response.success && response.data) {
        setMessages([...messages, response.data]);
        setNewMessage("");
        toast.success('Message sent!');
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error?.response?.data?.message || 'Failed to send message');
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
        return <Badge className="bg-amber-400 text-gray-900 border border-gray-800 rounded-full px-3 py-1">Pending</Badge>;
    }
  };
  const getRequestType = (request: PartnerRequest) => {
    // Compare as strings to handle both ObjectId and string formats
    const senderIdStr = request.sender_id?.toString() || '';
    const currentUserIdStr = currentUserId?.toString() || '';
    
    // If sender_id matches current user, it's an outgoing request
    // Otherwise, it's an incoming request (user is the receiver)
    return senderIdStr === currentUserIdStr ? 'outgoing' : 'incoming';
  };
  const getRequestTypeIcon = (request: PartnerRequest) => {
    const requestType = getRequestType(request);
    const isOutgoing = requestType === 'outgoing';
    // Incoming requests show green with down arrow, outgoing show blue with up arrow
    return (
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isOutgoing ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-600'}`}>
        {isOutgoing ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </div>
    );
  };
  const filteredRequests = requests.filter(request => {
    const partnerStoreName = getRequestType(request) === 'outgoing' ? request.recipient_profile?.store_name : request.sender_profile?.store_name;
    return partnerStoreName?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  return <AppLayout pageTitle="Partners" pageIcon={<Store className="h-5 w-5 text-primary" />}>
    <div className="w-full p-6 space-y-6">
      <p className="text-muted-foreground">
        Send, approve and manage your partnerships with other retailers
      </p>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Partner Search
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

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
                onRefresh={fetchPartnersForMap}
                isLoading={isLoadingPartners}
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

            {loading ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Your Store</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Their Offer</TableHead>
                      <TableHead>Your Offer</TableHead>
                      <TableHead>X-Promo Assets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Analytics</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-16 w-16 rounded-lg" /></TableCell>
                        <TableCell><Skeleton className="h-16 w-16 rounded-lg" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No partner requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Your Store</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Their Offer</TableHead>
                      <TableHead>Your Offer</TableHead>
                      <TableHead>X-Promo Assets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Analytics</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map(request => {
                    const requestType = getRequestType(request);
                    
                    // Partner store name: the other party's store
                    const partnerStoreName = requestType === 'outgoing' 
                      ? request.recipient_profile?.store_name 
                      : request.sender_profile?.store_name;

                    // Your store name: the current user's store
                    const yourStoreName = requestType === 'incoming' 
                      ? request.recipient_profile?.store_name 
                      : request.sender_profile?.store_name;

                    // Determine if this is an Ad request (from Media Street)
                    const isAdRequest = partnerStoreName === "Media Street";

                    // Mock distance calculation
                    const getDistance = () => {
                      const distances = [".1 mi", ".2 mi", "< 1 mile", ".3 mi"];
                      return distances[Math.floor(Math.random() * distances.length)];
                    };

                    // Get offer images - use actual offer image if available (matching Offers.tsx logic)
                    const getOfferImageFromRequest = (offerImage: string | null | undefined, offer: any) => {
                      // First try the direct image field
                      if (offerImage) {
                        // Handle base64 images
                        if (!offerImage.startsWith('http') && !offerImage.startsWith('data:') && !offerImage.startsWith('/')) {
                          if (offerImage.length > 100) {
                            return `data:image/png;base64,${offerImage}`;
                          }
                        }
                        return offerImage;
                      }
                      
                      // If no direct image, try to get from offer object
                      if (offer) {
                        // Check all possible image field names
                        const img = offer.offerImage || 
                                   offer.offer_image || 
                                   offer.offerImageUrl || 
                                   offer.offer_image_url ||
                                   offer.image ||
                                   null;
                        
                        if (img) {
                          // Handle base64 images
                          if (!img.startsWith('http') && !img.startsWith('data:') && !img.startsWith('/')) {
                            if (img.length > 100) {
                              return `data:image/png;base64,${img}`;
                            }
                          }
                          return img;
                        }
                      }
                      
                      return null;
                    };
                    
                    // Get partner's offer image
                    const getPartnerOfferImage = (request: any) => {
                      // For outgoing requests, show recipient's offer image
                      // For incoming requests, show sender's offer image
                      const offerImage = requestType === 'outgoing' 
                        ? request.recipient_offer_image 
                        : request.sender_offer_image;
                      
                      const offer = requestType === 'outgoing' 
                        ? request.recipient_offer 
                        : request.sender_offer;
                      
                      const image = getOfferImageFromRequest(offerImage, offer);
                      
                      if (image) {
                        return image;
                      }
                      
                      // Only fallback to placeholder if no image found
                      console.warn(`No image found for partner offer in request ${request.id}`);
                      return null; // Return null instead of placeholder
                    };
                    
                    // Get your offer image
                    const getYourOfferImage = (request: any) => {
                      // For outgoing requests, show sender's offer image
                      // For incoming requests, show recipient's offer image
                      const offerImage = requestType === 'outgoing' 
                        ? request.sender_offer_image 
                        : request.recipient_offer_image;
                      
                      const offer = requestType === 'outgoing' 
                        ? request.sender_offer 
                        : request.recipient_offer;
                      
                      const image = getOfferImageFromRequest(offerImage, offer);
                      
                      if (image) {
                        return image;
                      }
                      
                      // Only fallback to placeholder if no image found
                      console.warn(`No image found for your offer in request ${request.id}`);
                      return null; // Return null instead of placeholder
                    };
                    
                    return <TableRow key={request.id}>
                      <TableCell>
                        {getRequestTypeIcon(request)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {partnerStoreName || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {yourStoreName || 'Your Store'}
                      </TableCell>
                      <TableCell>
                        {isAdRequest ? "N/A" : getDistance()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const partnerImage = getPartnerOfferImage(request);
                          return partnerImage ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setEnlargedImage({
                              src: partnerImage,
                              title: `${partnerStoreName} offer`
                            })}>
                              <img src={partnerImage} alt={`${partnerStoreName} offer`} className="w-full h-full object-cover" onError={(e) => {
                                console.error('Error loading partner offer image:', partnerImage);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }} />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {isAdRequest ? <div className="text-muted-foreground">N/A</div> : (() => {
                          const yourImage = getYourOfferImage(request);
                          return yourImage ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setEnlargedImage({
                              src: yourImage,
                              title: "Your offer"
                            })}>
                              <img src={yourImage} alt="Your offer" className="w-full h-full object-cover" onError={(e) => {
                                console.error('Error loading your offer image:', yourImage);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }} />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigate('/display');
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="View Partner Carousel"
                          >
                            <Monitor className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={() => {
                              // Get location ID from user's offer or use first user location
                              const yourOffer = requestType === 'outgoing' 
                                ? request.sender_offer 
                                : request.recipient_offer;
                              
                              // Try to get location ID from offer
                              let locationId: string | null = null;
                              
                              // First, try to get from offer's locations array
                              if (yourOffer?.locations && Array.isArray(yourOffer.locations) && yourOffer.locations.length > 0) {
                                const firstLocation = yourOffer.locations[0];
                                locationId = firstLocation?.id || firstLocation?._id?.toString() || (typeof firstLocation === 'string' ? firstLocation : null);
                              } 
                              // Try locationIds array
                              else if (yourOffer?.locationIds && Array.isArray(yourOffer.locationIds) && yourOffer.locationIds.length > 0) {
                                locationId = yourOffer.locationIds[0]?.toString() || yourOffer.locationIds[0];
                              }
                              // Try location_ids array
                              else if (yourOffer?.location_ids && Array.isArray(yourOffer.location_ids) && yourOffer.location_ids.length > 0) {
                                locationId = yourOffer.location_ids[0]?.toString() || yourOffer.location_ids[0];
                              }
                              // Try single locationId field
                              else if (yourOffer?.locationId) {
                                locationId = yourOffer.locationId?.toString() || yourOffer.locationId;
                              }
                              // Fallback to first user location
                              else if (userLocations.length > 0) {
                                locationId = userLocations[0].id;
                              }
                              
                              if (locationId) {
                                navigate(`/locations/${locationId}/qr`);
                              } else {
                                toast.error('Location not found for QR code');
                              }
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="View QR Code"
                          >
                            <Printer className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequestForAnalytics(request);
                              setShowAnalyticsDialog(true);
                            }}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>
                        {requestType === 'incoming' && request.status === 'pending' && <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveRequest(request.id)} className="bg-green-600 hover:bg-green-700 text-white">
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
                        {requestType === 'outgoing' && request.status === 'pending' && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white bg-transparent rounded-full px-3 py-1">
                            Awaiting Response
                          </Badge>
                        )}
                        {request.status === 'cancelled' && <Button size="sm" variant="outline" onClick={() => {
                          setNewPartnerStore(partnerStoreName || '');
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
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3-Step Partnership Request Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={(open) => {
        setShowAuthDialog(open);
        if (!open) {
          setPartnershipStep(1);
          setDisplayCarousel(false);
          setDisplayQR(false);
          setCreativeIdeas("");
          setHasAgreed(false);
          setPromoCode("");
          setIsPromoValid(false);
          if (userLocations.length > 1) {
            setSelectedLocationId("");
          }
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0">
          {/* Step 1: Select Your Location */}
          {partnershipStep === 1 && (
            <>
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Send className="h-5 w-5" />
                    Select Your Location
                  </DialogTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAuthDialog(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 min-h-0 px-6 [&_[data-radix-scroll-area-scrollbar]]:hidden">
                <div className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    Select which of your locations to partner from:
                  </p>
                  
                  <div className="space-y-2">
                    {userLocations.map(location => (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocationId(location.id)}
                        className={`flex items-center gap-3 p-4 rounded-full border-2 cursor-pointer transition-all ${
                          selectedLocationId === location.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/20 bg-background hover:border-white/40'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                          selectedLocationId === location.id
                            ? 'bg-primary text-white'
                            : 'bg-muted'
                        }`}>
                          {selectedLocationId === location.id && <Check className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base">{location.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{location.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedLocationId ? `${userLocations.filter(l => l.id === selectedLocationId).length} location selected` : 'No location selected'}
                  </p>
                </div>
              </ScrollArea>
              
              <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedLocationId) {
                      setPartnershipStep(2);
                    } else {
                      toast.error('Please select a location');
                    }
                  }}
                  disabled={!selectedLocationId}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Request
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Step 2: Confirm Display Options */}
          {partnershipStep === 2 && (
            <>
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                      <Send className="h-5 w-5" />
                      Confirm Display Options
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-muted-foreground">
                      Choose how you'll display <strong>{newPartnerStore}</strong>'s offer at your location
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAuthDialog(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 min-h-0 px-6 [&_[data-radix-scroll-area-scrollbar]]:hidden">
                <div className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    Select which of your locations to send a partner request from:
                  </p>
                  
                  <RadioGroup 
                    value={displayCarousel ? "carousel" : displayQR ? "qr" : ""} 
                    onValueChange={(value) => {
                      setDisplayCarousel(value === "carousel");
                      setDisplayQR(value === "qr");
                    }} 
                    className="space-y-3"
                  >
                    {/* Display Partner Carousel */}
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/20 bg-background">
                      <RadioGroupItem
                        value="carousel"
                        id="carousel"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Monitor className="h-5 w-5" />
                          <Label htmlFor="carousel" className="font-semibold text-base cursor-pointer">
                            Display Partner Carousel
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Run your dedicated partner carousel on a tablet in-store
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary text-sm"
                          onClick={() => navigate('/display')}
                        >
                          Set up carousel →
                        </Button>
                      </div>
                    </div>
                    
                    {/* Post QR Code */}
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/20 bg-background">
                      <RadioGroupItem
                        value="qr"
                        id="qr"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <QrCodeIcon className="h-5 w-5" />
                          <Label htmlFor="qr" className="font-semibold text-base cursor-pointer">
                            Post Your Store's Media Street QR code
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Display your store's QR code sticker in a high traffic location
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary text-sm"
                          onClick={() => navigate('/location-qr')}
                        >
                          Print QR codes →
                        </Button>
                      </div>
                    </div>
                  </RadioGroup>
                    
                    {/* Get Creative */}
                    <div className="p-4 rounded-lg border border-white/20 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5" />
                        <Label className="font-semibold text-base">
                          Get Creative (Optional)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share additional ways you'll promote <strong>{newPartnerStore}</strong>'s offer
                      </p>
                      <Textarea
                        placeholder="e.g. include qr code on receipts, mention partner offer in newsletter, one social media post a week"
                        value={creativeIdeas}
                        onChange={(e) => setCreativeIdeas(e.target.value)}
                        className="min-h-[100px] bg-background"
                      />
                    </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setPartnershipStep(3)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Request
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Step 3: Confirm Partnership Request */}
          {partnershipStep === 3 && (
            <>
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Check className="h-5 w-5" />
                    Confirm Partnership Request
                  </DialogTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAuthDialog(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 min-h-0 px-6 [&_[data-radix-scroll-area-scrollbar]]:hidden">
                <div className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    You're about to send a partner request to <strong>{newPartnerStore}</strong>
                  </p>
                  
                  <div>
                    <p className="font-semibold text-base mb-2">If accepted, this partnership will:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                      <li>Show your offer at their store location</li>
                      <li>Display their offer at your store</li>
                      <li>Activate analytics on consumer views and redemptions</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 border border-white/10">
                    <p className="font-semibold text-sm mb-2">Billing note:</p>
                    <p className="text-xs text-muted-foreground">
                      The recurring partnership fee ($10) is charged 30 days after the partnership is confirmed to the party receiving more redemptions from the partnership, and every 30 days thereafter until cancelled. Promo credits are applied first before any card charges.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your promo credit balance:</span>
                    <span className="text-primary font-semibold text-base">${creditBalance.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="promo-code-confirm" className="text-sm font-medium">
                      Promo Code (Optional)
                    </label>
                    <Input 
                      id="promo-code-confirm" 
                      placeholder="Enter promo code to waive partnership fee" 
                      value={promoCode} 
                      onChange={e => handlePromoCodeChange(e.target.value)} 
                    />
                    {promoCode && (
                      <div className={`text-xs ${isPromoValid ? 'text-green-600' : 'text-red-600'}`}>
                        {isPromoValid ? '✓ Valid promo code - partnership fee waived!' : '✗ Invalid promo code'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox 
                      id="agree-terms-confirm" 
                      checked={hasAgreed || isPromoValid} 
                      onCheckedChange={checked => {
                        if (!isPromoValid) {
                          setHasAgreed(checked as boolean);
                        }
                      }} 
                      className="mt-1" 
                    />
                    <label htmlFor="agree-terms-confirm" className="text-xs text-muted-foreground leading-tight">
                      I authorize Media Street to charge my card on file until cancelled.
                    </label>
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setPartnershipStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={sendPartnerRequest} 
                  disabled={!hasAgreed && !isPromoValid}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirm & Request
                </Button>
              </DialogFooter>
            </>
          )}
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

      {/* Analytics Dialog */}
      {selectedRequestForAnalytics && (
        <PartnershipAnalyticsDialog
          open={showAnalyticsDialog}
          onOpenChange={setShowAnalyticsDialog}
          partnership={{
            id: selectedRequestForAnalytics.id,
            partnerStoreName: (() => {
              const requestType = getRequestType(selectedRequestForAnalytics);
              return requestType === 'outgoing' 
                ? selectedRequestForAnalytics.recipient_profile?.store_name || 'Partner'
                : selectedRequestForAnalytics.sender_profile?.store_name || 'Partner';
            })(),
            yourStoreName: (() => {
              const requestType = getRequestType(selectedRequestForAnalytics);
              return requestType === 'incoming' 
                ? selectedRequestForAnalytics.recipient_profile?.store_name || 'Your Store'
                : selectedRequestForAnalytics.sender_profile?.store_name || 'Your Store';
            })(),
            createdAt: selectedRequestForAnalytics.created_at
          }}
        />
      )}
    </div>
  </AppLayout>;
};
export default PartnerRequests;