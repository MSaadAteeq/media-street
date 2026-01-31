import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, MapPin, MoreHorizontal, ChevronDown, Zap, Store, TrendingUp, Download, Sparkles, RefreshCw, X, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
// Supabase removed - will use Node.js API
import { useToast } from "@/hooks/use-toast";
import { get, deleteApi, patch } from "@/services/apis";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import mediaStreetLogoIcon from "@/assets/media-street-logo-icon.png";

interface Offer {
  id: string;
  call_to_action: string;
  locations: {
    name: string;
    address: string;
    id?: string;
  }[];
  created_at: string;
  expires_at?: string;
  expiresAt?: string;
  is_active: boolean;
  redemption_count: number;
  is_open_offer?: boolean;
  available_for_partnership?: boolean;
  offer_image_url?: string;
  offerImageUrl?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  current_offer?: {
    id: string;
    call_to_action: string;
  };
  total_redemptions: number;
  open_offer_only?: boolean;
  views_7_days?: number;
  views_30_days?: number;
  views_all_time?: number;
  redemptions_7_days?: number;
  redemptions_30_days?: number;
}

interface Redemption {
  id: string;
  offer: {
    call_to_action: string;
  };
  location: {
    name: string;
  };
  referring_store: string;
  redeemed_at: string;
  redemption_code: string;
}

const Offers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isViewOfferDialogOpen, setIsViewOfferDialogOpen] = useState(false);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [impressionsData, setImpressionsData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch locations first, then offers (so locations are available for mapping)
    fetchLocations().then(() => {
      fetchOffers();
    });
    fetchRedemptions();
  }, []);

  useEffect(() => {
    // Fetch impressions when locations are loaded
    if (locations.length > 0) {
      fetchImpressions();
    }
  }, [locations.length]);

  const fetchLocations = async () => {
    try {
      // Fetch locations from backend API
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response.success && response.data) {
        const mappedLocations = response.data.map((location: any) => ({
          ...location,
          id: location._id?.toString() || location.id?.toString() || location.id,
          open_offer_only: location.open_offer_only ?? location.openOfferOnly ?? false
        }));
        setLocations(mappedLocations);
        return;
      }
    } catch (error) {
      console.error('Error fetching locations from API:', error);
    }
    
    // If API fails, set empty array (no fallback to static data)
    setLocations([]);
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // Fetch offers from backend API (should only return current user's offers)
      const response = await get({ 
        end_point: 'offers',
        token: true
      });
      
      console.log('Offers API Response:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log(`Total offers received from API: ${response.data.length}`);
        
        // Get current user ID to ensure we only show user's own offers
        let currentUserId: string | null = null;
        try {
          const currentUserResponse = await get({ 
            end_point: 'users/me',
            token: true
          });
          if (currentUserResponse.success && currentUserResponse.data) {
            currentUserId = currentUserResponse.data._id?.toString() || currentUserResponse.data.id?.toString() || null;
          }
        } catch (userError) {
          console.error('Error fetching current user:', userError);
        }
        
        // Fetch locations if not already loaded (to ensure we have them for mapping)
        let locationsData: any[] = locations as any[];
        if (locationsData.length === 0) {
          try {
            const locationsResponse = await get({ 
              end_point: 'locations',
              token: true
            });
            if (locationsResponse.success && locationsResponse.data) {
              locationsData = locationsResponse.data;
              setLocations(locationsResponse.data);
            }
          } catch (locError) {
            console.error('Error fetching locations in fetchOffers:', locError);
          }
        }
        
        // Backend already filters by userId, so use all offers from response
        // Don't filter again on frontend as it might cause issues
        const userOffers = response.data;
        console.log(`📊 Using ${userOffers.length} offers from backend (no additional filtering)`);
        
        const formattedOffers = userOffers.map((offer: any, index: number) => {
          try {
            // Handle locationIds - could be populated objects or just IDs
            // Check both locationIds (from backend) and location_ids (alternative format)
            const locationIdsArray = offer.locationIds || offer.location_ids || [];
            const offerLocations = Array.isArray(locationIdsArray) 
              ? locationIdsArray.map((loc: any) => {
                  // If it's a populated location object (has _id and name)
                  if (loc && typeof loc === 'object' && loc._id) {
                    return {
                      id: loc._id?.toString() || loc.id?.toString() || '',
                      name: loc.name || '',
                      address: loc.address || ''
                    };
                  }
                  // If it's just an ID string or ObjectId, find it from locations state
                  const locIdStr = loc?._id?.toString() || loc?.toString() || loc;
                  const foundLoc: any = locationsData.find((l: any) => {
                    const lIdStr = l?._id?.toString() || l?.id?.toString();
                    return lIdStr === locIdStr;
                  });
                  return foundLoc ? {
                    id: foundLoc?._id?.toString() || foundLoc?.id?.toString() || locIdStr,
                    name: foundLoc?.name || '',
                    address: foundLoc?.address || ''
                  } : { id: locIdStr, name: 'Unknown Location', address: '' };
                })
              : [];

            // Ensure we have a valid ID - try multiple sources
            const offerId = offer._id?.toString() || 
                           offer.id?.toString() || 
                           offer._id || 
                           offer.id || 
                           `offer-${index}-${Date.now()}`;
            
            // Check if offer has expired
            const expiresAt = offer.expiresAt || offer.expires_at;
            const isExpired = expiresAt && new Date(expiresAt) < new Date();
            const isActive = offer.isActive !== undefined ? offer.isActive : (offer.is_active !== undefined ? offer.is_active : true);
            
            // If expired, set is_active to false
            const finalIsActive = isExpired ? false : isActive;
            
            // Get offer image - check all possible field names from backend
            const offerImage = offer.offerImage || 
                              offer.offer_image || 
                              offer.offerImageUrl || 
                              offer.offer_image_url || 
                              null;
            
            // Handle base64 images - convert to data URL if needed
            let processedImageUrl = offerImage;
            if (offerImage && !offerImage.startsWith('http') && !offerImage.startsWith('data:') && !offerImage.startsWith('/')) {
              // Check if it's base64 without data URL prefix
              if (offerImage.length > 100) {
                processedImageUrl = `data:image/png;base64,${offerImage}`;
              }
            }
            
            const formattedOffer = {
              id: offerId,
              call_to_action: offer.callToAction || offer.call_to_action || '',
              locations: offerLocations,
              created_at: offer.createdAt || offer.created_at || new Date().toISOString(),
              expires_at: expiresAt || null,
              expiresAt: expiresAt || null,
              is_active: finalIsActive,
              redemption_count: offer.redemptionCount || offer.redemption_count || 0,
              is_open_offer: offer.isOpenOffer || offer.is_open_offer || false,
              available_for_partnership: offer.availableForPartnership !== undefined 
                ? offer.availableForPartnership 
                : (offer.available_for_partnership !== undefined ? offer.available_for_partnership : true),
              offer_image_url: processedImageUrl,
              offerImageUrl: processedImageUrl
            };
            
            console.log(`Formatted offer ${index + 1}:`, formattedOffer);
            return formattedOffer;
          } catch (offerError) {
            console.error(`Error formatting offer ${index + 1}:`, offerError, offer);
            // Get offer image - check all possible field names from backend
            const offerImage = offer.offerImage || 
                              offer.offer_image || 
                              offer.offerImageUrl || 
                              offer.offer_image_url || 
                              null;
            
            // Handle base64 images - convert to data URL if needed
            let processedImageUrl = offerImage;
            if (offerImage && !offerImage.startsWith('http') && !offerImage.startsWith('data:') && !offerImage.startsWith('/')) {
              // Check if it's base64 without data URL prefix
              if (offerImage.length > 100) {
                processedImageUrl = `data:image/png;base64,${offerImage}`;
              }
            }
            
            // Return a basic formatted offer even if there's an error
            return {
              id: offer._id?.toString() || offer.id?.toString() || `offer-${index}`,
              call_to_action: offer.callToAction || offer.call_to_action || 'Unknown Offer',
              locations: [],
              created_at: offer.createdAt || offer.created_at || new Date().toISOString(),
              is_active: offer.isActive !== undefined ? offer.isActive : true,
              redemption_count: offer.redemptionCount || offer.redemption_count || 0,
              is_open_offer: offer.isOpenOffer || offer.is_open_offer || false,
              available_for_partnership: offer.availableForPartnership !== undefined 
                ? offer.availableForPartnership 
                : true,
              offer_image_url: processedImageUrl,
              offerImageUrl: processedImageUrl
            };
          }
        });
        
        console.log(`Total formatted offers (user's own): ${formattedOffers.length}`);
        console.log('Formatted offers:', formattedOffers);
        
        // Ensure all offers have unique IDs and are included
        const validOffers = formattedOffers.filter((offer, index, self) => {
          // Filter out any offers without an ID
          if (!offer.id) {
            console.warn(`⚠️ Offer at index ${index} has no ID, skipping:`, offer);
            return false;
          }
          // Check for duplicate IDs (keep first occurrence)
          const firstIndex = self.findIndex(o => o.id === offer.id);
          if (firstIndex !== index) {
            console.warn(`⚠️ Duplicate offer ID found: ${offer.id}, keeping first occurrence`);
            return false;
          }
          return true;
        });
        
        console.log(`✅ Valid offers after filtering: ${validOffers.length}`);
        console.log('📋 Final offers to display:', validOffers);
        
        if (validOffers.length !== userOffers.length) {
          console.warn(`⚠️ Warning: ${userOffers.length - validOffers.length} offers were filtered out`);
        }
        
        if (validOffers.length === 0 && userOffers.length > 0) {
          console.error('❌ ERROR: All offers were filtered out!');
          console.error('Raw offers:', userOffers);
          console.error('Formatted offers:', formattedOffers);
        }
        
        setOffers(validOffers);
        setLoading(false);
        return;
      } else {
        // If response is not in expected format, log and set empty array
        console.warn('Unexpected response format:', response);
        setOffers([]);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching offers from API:', error);
      setOffers([]);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load offers. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAssignOffer = async (locationId: string, offerId: string) => {
    try {
      // Update offer to include this location
      const response = await patch({
        end_point: `offers/${offerId}`,
        body: { 
          locationIds: [...(offers.find(o => o.id === offerId)?.locations || []).map((l: any) => l.id || l._id), locationId]
        },
        token: true
      });
      
      if (response.success) {
        // Reload offers to get updated data
        await fetchOffers();
        toast({
          title: "Success",
          description: "Offer assigned to location successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to assign offer');
      }
    } catch (error: any) {
      console.error("Error assigning offer:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to assign offer to location",
        variant: "destructive",
      });
    }
  };

  const handleRemoveOfferFromLocation = async (locationId: string, offerId: string) => {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) return;
      
      // Remove location from offer's locationIds
      const updatedLocationIds = offer.locations
        .filter((loc: any) => {
          const locId = loc.id || loc._id;
          return locId !== locationId;
        })
        .map((loc: any) => loc.id || loc._id);
      
      const response = await patch({
        end_point: `offers/${offerId}`,
        body: { locationIds: updatedLocationIds },
        token: true
      });
      
      if (response.success) {
        await fetchOffers();
        toast({
          title: "Success",
          description: "Offer removed from location",
        });
      } else {
        throw new Error(response.message || 'Failed to remove offer');
      }
    } catch (error: any) {
      console.error("Error removing offer:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to remove offer from location",
        variant: "destructive",
      });
    }
  };

  const handleAddLocationToOffer = async (offerId: string, locationId: string) => {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) return;
      
      // Check if location is already in the offer
      const isAlreadyAdded = offer.locations.some((loc: any) => {
        const locId = loc.id || loc._id;
        return locId === locationId;
      });
      
      if (isAlreadyAdded) {
        toast({
          title: "Info",
          description: "Location is already added to this offer",
        });
        return;
      }
      
      // Add location to offer
      const currentLocationIds = offer.locations.map((loc: any) => loc.id || loc._id);
      const response = await patch({
        end_point: `offers/${offerId}`,
        body: { locationIds: [...currentLocationIds, locationId] },
        token: true
      });
      
      if (response.success) {
        await fetchOffers();
        toast({
          title: "Success",
          description: "Location added to offer successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to add location');
      }
    } catch (error: any) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to add location to offer",
        variant: "destructive",
      });
    }
  };

  // Removed handleAddLocationToOffer - locations can't be added to offers after creation

  const handleToggleOpenOfferOnly = async (locationId: string, checked: boolean) => {
    try {
      const response = await patch({
        end_point: `locations/${locationId}`,
        body: { open_offer_only: checked },
        token: true
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update location");
      }

      setLocations(prev =>
        prev.map(location =>
          location.id === locationId
            ? { ...location, open_offer_only: checked }
            : location
        )
      );

      toast({
        title: "Location Updated",
        description: checked
          ? "This location is now dedicated to Open Offers."
          : "This location can now be used for regular offers.",
      });
    } catch (error: any) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update location eligibility",
        variant: "destructive",
      });
    }
  };

  const fetchRedemptions = async () => {
    try {
      // Fetch redemptions from backend API
      const response = await get({ 
        end_point: 'redemptions',
        token: true
      });
      
      if (response.success && response.data) {
        setRedemptions(response.data);
      } else {
        setRedemptions([]);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      setRedemptions([]);
      toast({
        title: "Error",
        description: "Failed to load redemptions",
        variant: "destructive",
      });
    }
  };

  const fetchImpressions = async () => {
    try {
      // Fetch impressions for all locations
      const impressionsPromises = locations.map(async (loc) => {
        const locId = loc.id;
        if (!locId) return { locationId: locId, inbound: [], outbound: [] };
        
        try {
          const [inboundResponse, outboundResponse] = await Promise.all([
            get({ end_point: `impressions/inbound/${locId}`, token: true }).catch(() => ({ success: false, data: [] })),
            get({ end_point: `impressions/outbound/${locId}`, token: true }).catch(() => ({ success: false, data: [] }))
          ]);
          
          return {
            locationId: locId,
            inbound: inboundResponse.success ? inboundResponse.data : [],
            outbound: outboundResponse.success ? outboundResponse.data : []
          };
        } catch (error) {
          console.error(`Error fetching impressions for location ${locId}:`, error);
          return { locationId: locId, inbound: [], outbound: [] };
        }
      });
      
      const impressions = await Promise.all(impressionsPromises);
      setImpressionsData(impressions);
    } catch (error) {
      console.error("Error fetching impressions:", error);
      setImpressionsData([]);
    }
  };

  // Calculate analytics for each location
  const locationAnalytics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return locations.map(loc => {
      const locImpressions = impressionsData.find(imp => imp.locationId === loc.id);
      const inboundImpressions = locImpressions?.inbound || [];
      const outboundImpressions = locImpressions?.outbound || [];

      // Filter impressions by date
      const views7Days = inboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= sevenDaysAgo;
      }).length;

      const views30Days = inboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= thirtyDaysAgo;
      }).length;

      const viewsAllTime = inboundImpressions.length;

      // Filter redemptions by date
      const redemptions7Days = redemptions.filter(red => {
        const redeemedAt = new Date(red.redeemed_at);
        return redeemedAt >= sevenDaysAgo && red.location?.name === loc.name;
      }).length;

      const redemptions30Days = redemptions.filter(red => {
        const redeemedAt = new Date(red.redeemed_at);
        return redeemedAt >= thirtyDaysAgo && red.location?.name === loc.name;
      }).length;

      return {
        ...loc,
        views_7_days: views7Days,
        views_30_days: views30Days,
        views_all_time: viewsAllTime,
        redemptions_7_days: redemptions7Days,
        redemptions_30_days: redemptions30Days,
        total_redemptions: redemptions.filter(red => red.location?.name === loc.name).length
      };
    });
  }, [locations, impressionsData, redemptions]);

  // Generate monthly chart data
  const generateMonthlyChartData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push({ month: monthName });
    }

    // Add data for each location
    locationAnalytics.forEach(loc => {
      months.forEach((monthData, index) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (11 - index) + 1, 0);
        
        const monthRedemptions = redemptions.filter(red => {
          const redeemedAt = new Date(red.redeemed_at);
          return redeemedAt >= monthStart && redeemedAt <= monthEnd && red.location?.name === loc.name;
        }).length;
        
        monthData[loc.name] = monthRedemptions;
      });
    });

    // Add "All Stores" line
    months.forEach((monthData, index) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (11 - index) + 1, 0);
      
      const allStoresRedemptions = redemptions.filter(red => {
        const redeemedAt = new Date(red.redeemed_at);
        return redeemedAt >= monthStart && redeemedAt <= monthEnd;
      }).length;
      
      monthData["All Stores"] = allStoresRedemptions;
    });

    return months;
  };

  const handleDownloadChart = () => {
    const chartElement = document.getElementById('weekly-performance-chart');
    if (!chartElement) return;

    // Simple download - could be enhanced with html2canvas
    toast({
      title: "Download",
      description: "Chart download functionality coming soon",
    });
  };

  // Visit value estimates (placeholder - could be fetched from backend)
  const visitValueEstimates = useMemo(() => {
    const estimates = new Map();
    locationAnalytics.forEach(loc => {
      // Default estimate of $10 per visit
      estimates.set(loc.id, { estimatedValue: 10 });
    });
    return estimates;
  }, [locationAnalytics]);

  const handleViewOffer = (offer: Offer) => {
    setViewingOffer(offer);
    setIsViewOfferDialogOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { deleteApi } = await import("@/services/apis");
      const response = await deleteApi({ 
        end_point: `offers/${offerId}`,
        token: true
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Offer deleted successfully",
        });
        
        // Reload offers
        fetchOffers();
      } else {
        throw new Error(response.message || 'Failed to delete offer');
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout pageTitle="Your Offers" pageIcon={<Zap className="h-5 w-5 text-primary" />}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Manage which promotional offers are active for each of your store locations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/offers/create")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Offer
            </Button>
          </div>
        </div>

        <div className="space-y-8 mt-6">

             {/* Location Management */}
             <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Redeemable Locations
            </CardTitle>
            <p className="text-muted-foreground">Link a created offer to your store location(s) to start promoting that store. Please note after linking your offer you’ll need to add partners or join Open Offer to get views for your store’s offer.</p>
            {/* <p className="text-sm text-primary mt-2">
              <strong>Please note:</strong> Offers will only show for these locations if you've partnered with other retailers or enrolled in Open Offer.
            </p> */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locations.map((location) => {
                // Find current offer for this location
                const locationId = location.id;
                const currentOffer = offers.find(offer => 
                  offer.locations.some((loc: any) => {
                    const locId = loc.id || loc._id || loc;
                    return locId === locationId;
                  }) && offer.is_active
                );
                
                return (
                  <Card key={location.id} className="p-4 border">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                        </div>
                      </div>
                      
                      {currentOffer && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Current offer:</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4"
                              onClick={() => handleViewOffer(currentOffer)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-medium">{currentOffer.call_to_action}</p>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={currentOffer.id} 
                              onValueChange={(value) => handleAssignOffer(location.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue>
                                  <span className="truncate max-w-[200px]">
                                    {currentOffer.call_to_action.length > 30 
                                      ? `${currentOffer.call_to_action.substring(0, 30)}...` 
                                      : currentOffer.call_to_action}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border shadow-lg z-50">
                                {offers.filter(offer => offer.is_active).map((offer) => (
                                  <SelectItem key={offer.id} value={offer.id}>
                                    {offer.call_to_action}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveOfferFromLocation(location.id, currentOffer.id)}
                              className="h-8"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

             {/* Created Offers Table */}
             <Card>
          <CardHeader>
            <CardTitle>Created Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No offers created yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Redeemable Locations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">
                        {offer.call_to_action}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {offer.locations.length === 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">No locations assigned</p>
                              <Select onValueChange={(value) => handleAddLocationToOffer(offer.id, value)}>
                                <SelectTrigger className="h-8 text-xs w-auto">
                                  <SelectValue>
                                    <div className="flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      <span>Add location</span>
                                      <ChevronDown className="h-3 w-3" />
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  {locations
                                    .filter(loc => !offer.locations.some((ol: any) => {
                                      const olId = ol.id || ol._id || ol;
                                      return olId === loc.id;
                                    }))
                                    .map((location) => (
                                      <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {offer.locations.map((location: any, index: number) => (
                                <div key={index}>
                                  <p className="font-medium text-sm">{location.name}</p>
                                  <p className="text-xs text-muted-foreground">{location.address}</p>
                                </div>
                              ))}
                              <Select onValueChange={(value) => handleAddLocationToOffer(offer.id, value)}>
                                <SelectTrigger className="h-8 text-xs w-auto">
                                  <SelectValue>
                                    <div className="flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      <span>Add location</span>
                                      <ChevronDown className="h-3 w-3" />
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  {locations
                                    .filter(loc => !offer.locations.some((ol: any) => {
                                      const olId = ol.id || ol._id || ol;
                                      return olId === loc.id;
                                    }))
                                    .map((location) => (
                                      <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // Check if offer has expired
                          const expiresAt = (offer as any).expires_at || (offer as any).expiresAt;
                          const isExpired = expiresAt && new Date(expiresAt) < new Date();
                          const isActive = offer.is_active && !isExpired;
                          
                          if (isExpired) {
                            return (
                              <Badge variant="destructive">
                                Expired
                              </Badge>
                            );
                          }
                          return (
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">{offer.redemption_count}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(offer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewOffer(offer)}
                            title="View offer details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => fetchOffers()}
                            title="Refresh"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

             {/* Analytics & Redemptions */}
             <Card>
          <CardHeader>
            <CardTitle>Analytics & Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="recent">Redemptions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analytics" className="mt-6 space-y-8">
                {locationAnalytics.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No locations yet. Add a location to see analytics.</p>
                  </div>
                ) : (
                  <>
                    {/* Per-Store Analytics */}
                    {locationAnalytics.map(location => {
                      const estimate = visitValueEstimates.get(location.id);
                      const avgValue = estimate?.estimatedValue || 10;
                      
                      return (
                        <Card key={location.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/30 pb-3">
                            <div className="flex items-center gap-2">
                              <Store className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <CardTitle className="text-lg">{location.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{location.address}</p>
                              </div>
                              {estimate && (
                                <Badge variant="outline" className="ml-auto text-xs">
                                  ~${avgValue} avg visit <Sparkles className="h-3 w-3 inline ml-1 text-primary" />
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 font-medium text-muted-foreground"></th>
                                    <th className="text-center py-2 font-medium text-muted-foreground px-4">This Week</th>
                                    <th className="text-center py-2 font-medium text-muted-foreground px-4">This Month</th>
                                    <th className="text-center py-2 font-medium text-muted-foreground px-4">All-Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-border/50">
                                    <td className="py-3 flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                      <span>Offer Views</span>
                                    </td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.views_7_days || 0}</td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.views_30_days || 0}</td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.views_all_time || 0}</td>
                                  </tr>
                                  <tr className="border-b border-border/50">
                                    <td className="py-3 flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-muted-foreground" />
                                      <span>New Customers</span>
                                    </td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.redemptions_7_days || 0}</td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.redemptions_30_days || 0}</td>
                                    <td className="text-center py-3 text-primary font-semibold">{location.total_redemptions || 0}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-3 flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                      <span>Est. ROI</span>
                                    </td>
                                    <td className="text-center py-3">
                                      <div className="text-primary font-semibold">${((location.redemptions_7_days || 0) * avgValue).toFixed(0)}</div>
                                      <div className="text-xs text-muted-foreground">{location.redemptions_7_days || 0} new customers × ${avgValue}</div>
                                    </td>
                                    <td className="text-center py-3">
                                      <div className="text-primary font-semibold">${((location.redemptions_30_days || 0) * avgValue).toFixed(0)}</div>
                                      <div className="text-xs text-muted-foreground">{location.redemptions_30_days || 0} new customers × ${avgValue}</div>
                                    </td>
                                    <td className="text-center py-3">
                                      <div className="text-primary font-semibold">${((location.total_redemptions || 0) * avgValue).toFixed(0)}</div>
                                      <div className="text-xs text-muted-foreground">{location.total_redemptions || 0} new customers × ${avgValue}</div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Cumulative Totals for All Stores */}
                    {locationAnalytics.length > 1 && (
                      <Card className="overflow-hidden border-primary/30">
                        <CardHeader className="bg-primary/10 pb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">All Stores Combined</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 font-medium text-muted-foreground"></th>
                                  <th className="text-center py-2 font-medium text-muted-foreground px-4">This Week</th>
                                  <th className="text-center py-2 font-medium text-muted-foreground px-4">This Month</th>
                                  <th className="text-center py-2 font-medium text-muted-foreground px-4">All-Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-border/50">
                                  <td className="py-3 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>Total Offer Views</span>
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.views_7_days || 0), 0)}
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.views_30_days || 0), 0)}
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.views_all_time || 0), 0)}
                                  </td>
                                </tr>
                                <tr className="border-b border-border/50">
                                  <td className="py-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                    <span>Total New Customers</span>
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.redemptions_7_days || 0), 0)}
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.redemptions_30_days || 0), 0)}
                                  </td>
                                  <td className="text-center py-3 text-primary font-bold text-lg">
                                    {locationAnalytics.reduce((sum, loc) => sum + (loc.total_redemptions || 0), 0)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-3 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span>Total Est. ROI</span>
                                  </td>
                                  <td className="text-center py-3">
                                    <div className="text-primary font-bold text-lg">
                                      ${locationAnalytics.reduce((sum, loc) => {
                                        const est = visitValueEstimates.get(loc.id);
                                        return sum + (loc.redemptions_7_days || 0) * (est?.estimatedValue || 10);
                                      }, 0).toFixed(0)}
                                    </div>
                                  </td>
                                  <td className="text-center py-3">
                                    <div className="text-primary font-bold text-lg">
                                      ${locationAnalytics.reduce((sum, loc) => {
                                        const est = visitValueEstimates.get(loc.id);
                                        return sum + (loc.redemptions_30_days || 0) * (est?.estimatedValue || 10);
                                      }, 0).toFixed(0)}
                                    </div>
                                  </td>
                                  <td className="text-center py-3">
                                    <div className="text-primary font-bold text-lg">
                                      ${locationAnalytics.reduce((sum, loc) => {
                                        const est = visitValueEstimates.get(loc.id);
                                        return sum + (loc.total_redemptions || 0) * (est?.estimatedValue || 10);
                                      }, 0).toFixed(0)}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Monthly Performance Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Monthly New Customers</h3>
                        <Button variant="outline" size="sm" onClick={handleDownloadChart}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <Card id="weekly-performance-chart" className="p-4">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={generateMonthlyChartData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))'
                              }} />
                              <Legend />
                              {locationAnalytics.map((loc, index) => {
                                const colors = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(280 68% 60%)', 'hsl(200 75% 50%)'];
                                return (
                                  <Line 
                                    key={loc.id}
                                    type="monotone" 
                                    dataKey={loc.name} 
                                    stroke={colors[index % colors.length]} 
                                    strokeWidth={2} 
                                    dot={{ fill: colors[index % colors.length] }} 
                                  />
                                );
                              })}
                              <Line 
                                type="monotone" 
                                dataKey="All Stores" 
                                stroke="hsl(var(--foreground))" 
                                strokeWidth={3} 
                                strokeDasharray="5 5"
                                dot={{ fill: 'hsl(var(--foreground))' }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="mt-6">
                {redemptions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No redemptions yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Offer Redeemed</TableHead>
                        <TableHead>Store Location</TableHead>
                        <TableHead>Referring Store</TableHead>
                        <TableHead>Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            {new Date(redemption.redeemed_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {redemption.offer?.call_to_action}
                          </TableCell>
                          <TableCell>
                            {redemption.location?.name}
                          </TableCell>
                          <TableCell>
                            {redemption.referring_store || "-"}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{redemption.redemption_code}</code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

             {/* Location Details Dialog */}
             <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Offer Locations
              </DialogTitle>
              <DialogDescription>
                {selectedOffer?.call_to_action}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Active in {selectedOffer?.locations.length || 0} locations:
              </p>
              
              <div className="space-y-3">
                {selectedOffer?.locations.map((location, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">{location.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
             </DialogContent>
             </Dialog>

             {/* View Offer Preview Dialog */}
             <Dialog open={isViewOfferDialogOpen} onOpenChange={setIsViewOfferDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1f2e] border-0">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-primary" />
                Offer Preview
              </DialogTitle>
            </DialogHeader>
            
            {viewingOffer && (() => {
              const offerImageUrl = viewingOffer.offer_image_url || viewingOffer.offerImageUrl;
              
              // Debug logging
              console.log('🔍 Offer Preview - Image Debug:', {
                offerId: viewingOffer.id,
                offer_image_url: viewingOffer.offer_image_url,
                offerImageUrl: viewingOffer.offerImageUrl,
                finalImageUrl: offerImageUrl,
                hasImage: !!offerImageUrl,
                imageType: offerImageUrl ? (offerImageUrl.startsWith('data:') ? 'base64' : offerImageUrl.startsWith('http') ? 'url' : 'other') : 'none'
              });
              
              const firstLocation = viewingOffer.locations[0];
              const locationName = firstLocation?.name || 'Your Store';
              const locationAddress = firstLocation?.address || '';
              const expiresAt = viewingOffer.expires_at || viewingOffer.expiresAt;
              const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : null;
              
              // Generate QR code URL - use location ID if available
              const locationId = firstLocation?.id || (locations.find(l => l.name === firstLocation?.name)?.id);
              const qrCodeUrl = locationId 
                ? `${window.location.origin}/carousel/${locationId}`
                : `${window.location.origin}/redeem?offer=${viewingOffer.id}`;
              
              return (
                <div className="space-y-6 mt-6">
                  {/* Main Offer Preview Card */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-border">
                    {/* Background Image */}
                    {offerImageUrl ? (
                      <img 
                        src={offerImageUrl} 
                        alt={viewingOffer.call_to_action}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <p className="text-muted-foreground">No image available</p>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Media Street Logo Tag - Top Left */}
                    <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-sm rounded-lg shadow-lg flex items-center px-2 py-1 gap-1.5 z-10">
                      <img src={mediaStreetLogoIcon} alt="Media Street" className="h-4 w-4" />
                      <span className="font-semibold text-gray-800 text-xs">Partner offers by Media Street</span>
                    </div>
                    
                    {/* QR Code - Top Right */}
                    <div className="absolute top-3 right-3 bg-white rounded-lg p-2.5 flex flex-col items-center z-10 shadow-lg">
                      <QRCodeSVG 
                        value={qrCodeUrl}
                        size={120}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                      <p className="text-xs text-center mt-2 text-gray-700 font-medium max-w-[140px]">
                        Scan to redeem at {locationName}
                      </p>
                    </div>
                    
                    {/* Offer Content - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 text-white p-6 space-y-3">
                      <h2 className="font-bold text-3xl md:text-4xl drop-shadow-lg">
                        {viewingOffer.call_to_action}
                      </h2>
                      <p className="text-lg font-medium drop-shadow-md">{locationName}</p>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                          Partner Offer
                        </Badge>
                        {expirationDate && (
                          <p className="text-sm text-white/90">
                            Valid until: {expirationDate} *Terms apply
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructional Text */}
                  <p className="text-sm text-muted-foreground text-center">
                    This is the coupon consumers will present at your store to redeem your offer.
                  </p>
                  
                  {/* Mobile Preview */}
                  <div className="flex justify-center">
                    <div className="relative w-[280px] h-[500px] bg-white rounded-[2.5rem] p-2 shadow-2xl">
                      {/* Phone Frame */}
                      <div className="w-full h-full bg-gray-900 rounded-[2rem] overflow-hidden flex flex-col">
                        {/* Status Bar */}
                        <div className="bg-white h-6 flex items-center justify-between px-4 text-[10px] font-medium text-gray-900 flex-shrink-0">
                          <span className="text-gray-900">Verizon</span>
                          <span className="text-gray-900">9:41 AM</span>
                          <div className="w-4 h-2 bg-green-500 rounded-sm" />
                        </div>
                        
                        {/* App Content */}
                        <div className="bg-white flex-1 overflow-hidden flex flex-col">
                          {/* App Header */}
                          <div className="bg-white border-b flex items-center gap-2 px-4 py-2 flex-shrink-0">
                            <img src={mediaStreetLogoIcon} alt="Media Street" className="h-5 w-5" />
                            <span className="text-sm font-medium text-gray-900">Partner offer</span>
                          </div>
                          
                          {/* Content Area - No scrolling, everything fits */}
                          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            {/* Referring Retailer */}
                            {viewingOffer.is_open_offer && (
                              <div className="px-4 py-1.5 text-xs text-gray-600 border-b flex-shrink-0">
                                <span className="block truncate">
                                  Referring Retailer → <span className="font-medium text-gray-900">{locationName}</span>
                                </span>
                              </div>
                            )}
                            
                            {/* Offer Image */}
                            <div className="w-full h-28 flex-shrink-0 overflow-hidden">
                              {offerImageUrl ? (
                                <img 
                                  src={offerImageUrl} 
                                  alt={viewingOffer.call_to_action}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                              )}
                            </div>
                            
                            {/* Offer Details - Fits without scrolling */}
                            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                                <h3 className="font-bold text-sm text-black break-words leading-tight flex-shrink-0">
                                  {viewingOffer.call_to_action}
                                </h3>
                                
                                {expiresAt && (
                                  <div className="flex items-start gap-1.5 text-orange-600 flex-shrink-0">
                                    <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-[11px] font-medium break-words leading-tight">
                                      Expires on {new Date(expiresAt).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1.5 text-primary flex-shrink-0">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-[11px] font-medium">Directions</span>
                                </div>
                                
                                {/* Coupon Design Placeholder */}
                                <div className="mt-1.5 pt-1.5 border-t flex-1 flex flex-col min-h-0">
                                  <p className="text-[10px] text-muted-foreground mb-1.5 flex-shrink-0">For cashier to redeem:</p>
                                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 rounded-lg p-2 space-y-1.5 flex-1 flex flex-col min-h-0">
                                    {/* Coupon Header */}
                                    <div className="flex items-center justify-between flex-shrink-0">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                          <span className="text-primary font-bold text-[9px]">MS</span>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-semibold text-foreground leading-tight">Media Street</p>
                                          <p className="text-[8px] text-muted-foreground leading-tight">Coupon</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[9px] font-bold text-primary leading-tight">VALID</p>
                                        <p className="text-[8px] text-muted-foreground leading-tight">Redeemable</p>
                                      </div>
                                    </div>
                                    
                                    {/* Coupon Content */}
                                    <div className="space-y-1 pt-1 border-t border-primary/20 flex-shrink-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[9px] font-medium text-foreground">Offer:</span>
                                        <span className="text-[9px] text-muted-foreground text-right max-w-[60%] truncate">
                                          {viewingOffer.call_to_action}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[9px] font-medium text-foreground">Location:</span>
                                        <span className="text-[9px] text-muted-foreground text-right max-w-[60%] truncate">
                                          {locationName}
                                        </span>
                                      </div>
                                      {expirationDate && (
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[9px] font-medium text-foreground">Expires:</span>
                                          <span className="text-[9px] text-muted-foreground">{expirationDate}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Coupon Footer */}
                                    <div className="pt-1 border-t border-primary/20 flex-shrink-0 mt-auto">
                                      <div className="flex items-center justify-center gap-1">
                                        <div className="w-1 h-1 bg-primary/30 rounded-full"></div>
                                        <div className="flex-1 h-px bg-primary/20"></div>
                                        <div className="w-1 h-1 bg-primary/30 rounded-full"></div>
                                      </div>
                                      <p className="text-[8px] text-center text-muted-foreground mt-1 leading-tight">
                                        Present this coupon at checkout
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
             </DialogContent>
             </Dialog>

        </div>
      </div>
    </AppLayout>
  );
};

export default Offers;