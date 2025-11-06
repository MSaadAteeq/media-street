import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Store, Check, X, Plus, Send, UserPlus, ArrowDown, ArrowUp, Eye, ChevronRight, Gift, Map, Building2, Trash2, MessageSquare, Lightbulb } from "lucide-react";
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
      generateRecommendations();
    }
  }, [userLocations, partnersForMap]);
  const fetchCurrentUser = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };
  const fetchUserLocations = async () => {
    try {
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('❌ No authenticated user found');
        return;
      }
      const mockLocations = [{
        id: "location_1",
        name: "Sally's Salon",
        address: "Sally's Salon Street 7, New York"
      }, {
        id: "location_2",
        name: "Sally's Salon",
        address: "Sangam Cinema, Hilton Park, New York"
      }];
      setUserLocations(mockLocations);
      if (mockLocations.length === 1) {
        setSelectedLocationId(mockLocations[0].id);
      }
    } catch (error) {
      console.error('💥 Exception in fetchUserLocations:', error);
    }
  };
  const fetchPartnersForMap = async () => {
    try {
      const mockPartners = [{
        id: '1',
        store_name: "Joe's Coffee",
        retail_address: "456 Brew Street, Midtown, NY",
        first_name: 'Joe',
        last_name: 'Smith',
        latitude: 40.7589,
        longitude: -73.9851,
        is_offerx_active: false
      }, {
        id: '2',
        store_name: "Joann's Flower Shop",
        retail_address: "789 Garden Way, Uptown, NY",
        first_name: 'Joann',
        last_name: 'Davis',
        latitude: 40.7831,
        longitude: -73.9712,
        is_offerx_active: false
      }, {
        id: '3',
        store_name: "Daily Dry Cleaner",
        retail_address: "321 Clean Lane, Westside, NY",
        first_name: 'Mike',
        last_name: 'Wilson',
        latitude: 40.7505,
        longitude: -74.0094,
        is_offerx_active: true
      }];
      setPartnersForMap(mockPartners);
    } catch (error) {
      console.error('Error fetching partners for map:', error);
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
  const generateRecommendations = () => {
    // Mock coordinates for user locations (Sally's Salon)
    const locationCoordinates = [{
      id: "location_1",
      name: "Sally's Salon",
      address: "Sally's Salon Street 7, New York",
      latitude: 40.7580,
      longitude: -73.9855
    }, {
      id: "location_2",
      name: "Sally's Salon",
      address: "Sangam Cinema, Hilton Park, New York",
      latitude: 40.7820,
      longitude: -73.9720
    }];
    const recs: any[] = [];
    partnersForMap.forEach(partner => {
      locationCoordinates.forEach(location => {
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user?.email) {
        setHasPaymentMethod(false);
        return;
      }

      // Check with Stripe if user has a payment method
      const {
        data,
        error
      } = await supabase.functions.invoke('check-payment-method');
      if (error) {
        console.error('Error checking payment method:', error);
        setHasPaymentMethod(false);
        return;
      }
      setHasPaymentMethod(data?.has_payment_method || false);
    } catch (error) {
      console.error('Error checking payment method:', error);
      setHasPaymentMethod(false);
    } finally {
      setIsCheckingPaymentMethod(false);
    }
  };
  const checkUserHasOffer = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return false;
      const {
        data,
        error
      } = await supabase.from('offers').select('id').eq('user_id', user.id).limit(1);
      if (error) {
        console.error('Error checking offers:', error);
        return false;
      }
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking user offers:', error);
      return false;
    }
  };
  const handleAddPaymentMethod = async () => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-setup-session');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.info('Please complete payment setup in the new window');
      }
    } catch (error) {
      console.error('Error creating setup session:', error);
      toast.error('Failed to open payment setup');
    }
  };
  const fetchPartnerRequests = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: requestsData,
        error: requestsError
      } = await supabase.from('partner_requests').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', {
        ascending: false
      });
      if (requestsError) throw requestsError;
      const enrichedRequests = await Promise.all((requestsData || []).map(async request => {
        const [senderProfile, recipientProfile] = await Promise.all([supabase.from('profiles').select('store_name, first_name, last_name').eq('user_id', request.sender_id).maybeSingle(), supabase.from('profiles').select('store_name, first_name, last_name').eq('user_id', request.recipient_id).maybeSingle()]);
        return {
          ...request,
          sender_profile: senderProfile.data,
          recipient_profile: recipientProfile.data
        };
      }));
      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching partner requests:', error);
      toast.error('Failed to load partner requests');
    } finally {
      setLoading(false);
    }
  };
  const searchStores = async (query: string) => {
    const exampleStores = [{
      store_name: "Joe's Coffee",
      retail_address: "456 Brew Street, Midtown"
    }, {
      store_name: "Joann's Flower Shop",
      retail_address: "789 Garden Way, Uptown"
    }, {
      store_name: "Daily Dry Cleaner",
      retail_address: "321 Clean Lane, Westside"
    }, {
      store_name: "Mike's Pizza Palace",
      retail_address: "654 Cheese Ave, Downtown"
    }, {
      store_name: "Sarah's Bookstore",
      retail_address: "987 Reading Rd, Library District"
    }];
    if (!isInputFocused) {
      setStoreOptions([]);
      return;
    }
    if (query.length === 0) {
      setStoreOptions(exampleStores);
      return;
    }
    if (query.length < 2) {
      const filteredExamples = exampleStores.filter(store => store.store_name.toLowerCase().includes(query.toLowerCase()));
      setStoreOptions(filteredExamples);
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('store_name, retail_address').ilike('store_name', `%${query}%`).not('store_name', 'is', null).limit(10);
      if (error) throw error;
      const filteredExamples = exampleStores.filter(example => example.store_name.toLowerCase().includes(query.toLowerCase()) && !(data || []).some(dbStore => dbStore.store_name === example.store_name));
      setStoreOptions([...(data || []), ...filteredExamples]);
    } catch (error) {
      console.error('Error searching stores:', error);
      const filteredExamples = exampleStores.filter(store => store.store_name.toLowerCase().includes(query.toLowerCase()));
      setStoreOptions(filteredExamples);
    }
  };
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return false;
    try {
      const {
        data,
        error
      } = await supabase.rpc('validate_promo_code', {
        promo_code_text: code
      });
      if (error) throw error;
      return data && data.length > 0 && data[0].is_valid;
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

    // If user has multiple locations and none is selected, open dialog and let them select there
    // Otherwise, proceed with the dialog
    setShowAuthDialog(true);
  };
  const sendPartnerRequest = async () => {
    try {
      // Validate location selection for multiple locations
      if (userLocations.length > 1 && !selectedLocationId) {
        toast.error('Please select which location you want to send the request for');
        return;
      }
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to send partner requests');
        return;
      }
      const {
        data: recipientData,
        error: recipientError
      } = await supabase.from('profiles').select('user_id').eq('store_name', newPartnerStore.trim()).maybeSingle();
      if (recipientError || !recipientData) {
        toast.error('Store not found');
        return;
      }
      if (recipientData.user_id === user.id) {
        toast.error('You cannot send a partner request to yourself');
        return;
      }

      // Check for existing pending request from current user to recipient
      const {
        data: existingOutgoingRequest,
        error: outgoingCheckError
      } = await supabase.from('partner_requests').select('id').eq('sender_id', user.id).eq('recipient_id', recipientData.user_id).eq('status', 'pending').maybeSingle();
      if (outgoingCheckError) {
        console.error('Error checking existing requests:', outgoingCheckError);
        toast.error('Unable to verify existing requests');
        return;
      }
      if (existingOutgoingRequest) {
        toast.error('You already have a pending request to this store');
        return;
      }

      // Check for existing pending request from recipient to current user
      const {
        data: existingIncomingRequest,
        error: incomingCheckError
      } = await supabase.from('partner_requests').select('id').eq('sender_id', recipientData.user_id).eq('recipient_id', user.id).eq('status', 'pending').maybeSingle();
      if (incomingCheckError) {
        console.error('Error checking incoming requests:', incomingCheckError);
        toast.error('Unable to verify incoming requests');
        return;
      }
      if (existingIncomingRequest) {
        toast.error('This store has already sent you a pending request. Please respond to their request instead.');
        return;
      }

      // Check if recipient has OpenOffer enabled
      const {
        data: recipientOfferxData,
        error: recipientOfferxError
      } = await supabase.from('offerx_subscriptions').select('id').eq('user_id', recipientData.user_id).eq('is_active', true).maybeSingle();
      if (recipientOfferxError) {
        console.error('Error checking recipient OpenOffer status:', recipientOfferxError);
        toast.error('Unable to verify partner availability');
        return;
      }
      if (recipientOfferxData) {
        toast.error('This store has OpenOffer enabled and cannot accept partner requests');
        return;
      }

      // Check if sender (current user) has OpenOffer enabled
      const {
        data: senderOfferxData,
        error: senderOfferxError
      } = await supabase.from('offerx_subscriptions').select('id').eq('user_id', user.id).eq('is_active', true).maybeSingle();
      if (senderOfferxError) {
        console.error('Error checking sender OpenOffer status:', senderOfferxError);
        toast.error('Unable to verify your OpenOffer status');
        return;
      }
      if (senderOfferxData) {
        toast.error('You have OpenOffer enabled and cannot send partner requests');
        return;
      }

      // Check if user has selected display options
      const hasDisplayOption = await checkDisplayOptions();
      if (!hasDisplayOption) {
        setPendingAction(() => async () => {
          await sendPartnerRequestFinal(user.id, recipientData.user_id);
        });
        setShowDisplayOptionCheck(true);
        return;
      }
      await sendPartnerRequestFinal(user.id, recipientData.user_id);
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    }
  };
  const sendPartnerRequestFinal = async (senderId: string, recipientId: string) => {
    try {
      const {
        error
      } = await supabase.from('partner_requests').insert({
        sender_id: senderId,
        recipient_id: recipientId
      });
      if (error) {
        throw error;
      }
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
      fetchPartnerRequests();
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to approve partner requests');
        return;
      }

      // Check if approver has OpenOffer enabled
      const {
        data: approverOfferxData,
        error: approverOfferxError
      } = await supabase.from('offerx_subscriptions').select('id').eq('user_id', user.id).eq('is_active', true).maybeSingle();
      if (approverOfferxError) {
        console.error('Error checking approver OpenOffer status:', approverOfferxError);
        toast.error('Unable to verify your OpenOffer status');
        setProcessingPayment(false);
        return;
      }
      if (approverOfferxData) {
        toast.error('You have OpenOffer enabled and cannot approve partner requests');
        setProcessingPayment(false);
        setShowBillingConfirmDialog(false);
        return;
      }

      // Check if sender has OpenOffer enabled
      const {
        data: senderOfferxData,
        error: senderOfferxError
      } = await supabase.from('offerx_subscriptions').select('id').eq('user_id', pendingBillingRequest.sender_id).eq('is_active', true).maybeSingle();
      if (senderOfferxError) {
        console.error('Error checking sender OpenOffer status:', senderOfferxError);
        toast.error('Unable to verify partner OpenOffer status');
        setProcessingPayment(false);
        return;
      }
      if (senderOfferxData) {
        toast.error('The requesting store has OpenOffer enabled and cannot participate in partnerships');
        setProcessingPayment(false);
        setShowBillingConfirmDialog(false);
        return;
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('create-partnership-payment', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_request_id: pendingBillingRequest.id,
          approver_user_id: user.id,
          sender_user_id: pendingBillingRequest.sender_id
        })
      });
      if (error) {
        throw error;
      }
      toast.success('Partnership approved and both parties billed successfully! You and your new partner have each been charged $10.');
      setShowBillingConfirmDialog(false);
      setPendingBillingRequest(null);
      fetchPartnerRequests();
    } catch (error) {
      console.error('Error processing partnership payment:', error);
      toast.error(error.message || 'Failed to process partnership payment. Please ensure both parties have saved payment methods.');
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
      const {
        error
      } = await supabase.from('partner_requests').update({
        status: 'cancelled'
      }).eq('id', pendingCancelRequest.id);
      if (error) throw error;
      const partnerStoreName = getRequestType(pendingCancelRequest) === 'outgoing' ? pendingCancelRequest.recipient_profile?.store_name : pendingCancelRequest.sender_profile?.store_name;
      toast.success(`Partnership with ${partnerStoreName} has been cancelled`);
      setShowCancelDialog(false);
      setPendingCancelRequest(null);
      fetchPartnerRequests();
    } catch (error) {
      console.error('Error cancelling partnership:', error);
      toast.error('Failed to cancel partnership');
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
      const {
        error
      } = await supabase.from('partner_requests').update({
        status
      }).eq('id', requestId);
      if (error) throw error;
      if (status === 'approved') {
        if (isApprovalPromoValid) {
          toast.success(`Partner request approved successfully! Partnership fee waived with promo code "${approvalPromoCode.toUpperCase()}"`);
        } else {
          toast.success('Partner request approved successfully!');
        }
        setShowApprovalAuthDialog(false);
        setHasApprovalAgreed(false);
        setPendingApprovalRequestId(null);
        setApprovalPromoCode("");
        setIsApprovalPromoValid(false);
      } else {
        toast.success(`Partner request ${status} successfully!`);
      }
      fetchPartnerRequests();
    } catch (error) {
      console.error('Error updating partner request:', error);
      toast.error('Failed to update partner request');
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
    return request.sender_id === currentUserId ? 'outgoing' : 'incoming';
  };
  const getRequestTypeIcon = (request: PartnerRequest) => {
    const isOutgoing = request.sender_id === currentUserId;
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
              <Map className="h-4 w-4" />
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
                  <Map className="h-5 w-5" />
                  Partner Search
                </CardTitle>
                <CardDescription>
                  Discover and connect with local business partners in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PartnerMap partners={partnersForMap} onSendRequest={handleSendRequest} />
                
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
              {userLocations.length > 1 && <div className="space-y-3">
                  <label className="text-sm font-medium">Select Location for Partnership</label>
                  <div className="grid grid-cols-1 gap-2">
                    {userLocations.map(location => <Button key={location.id} variant={selectedLocationId === location.id ? "default" : "outline"} className="w-full justify-start text-left h-auto py-3" onClick={() => setSelectedLocationId(location.id)}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{location.name}</span>
                          <span className="text-xs text-muted-foreground">{location.address}</span>
                        </div>
                      </Button>)}
                  </div>
                </div>}

              {!hasPaymentMethod && !isPromoValid && <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Payment Method Required
                  </div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    You need to add a payment method before sending partnership requests. The $7/month fee will be charged when your request is accepted.
                  </div>
                  <Button onClick={handleAddPaymentMethod} className="w-full" size="sm">
                    Add Payment Method
                  </Button>
                </div>}
              
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
                    {isPromoValid ? "I agree to the partnership terms (fee waived)" : "I agree to the $7 partnership fee charged to my payment method on file when the partnership request is accepted by the other retailer, and monthly until cancelled."}
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
            }}>
                Cancel
              </Button>
              <Button onClick={sendPartnerRequest} disabled={!hasAgreed && !isPromoValid || !hasPaymentMethod && !isPromoValid || userLocations.length > 1 && !selectedLocationId} className="gap-2">
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
              {!hasPaymentMethod && !isApprovalPromoValid && <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Payment Method Required
                  </div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    You need to add a payment method before approving partnership requests. The $7/month fee will be charged when you approve.
                  </div>
                  <Button onClick={handleAddPaymentMethod} className="w-full" size="sm">
                    Add Payment Method
                  </Button>
                </div>}

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
                    {isApprovalPromoValid ? "I agree to the partnership terms (fee waived)" : "I agree to the $7 partnership fee charged to my payment method on file when the partnership request is accepted by the other retailer, and monthly until cancelled."}
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
              <Button onClick={() => pendingApprovalRequestId && updateRequestStatus(pendingApprovalRequestId, 'approved')} disabled={!hasApprovalAgreed && !isApprovalPromoValid || !hasPaymentMethod && !isApprovalPromoValid} className="bg-green-600 hover:bg-green-700">
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