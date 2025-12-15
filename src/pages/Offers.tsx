import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, MapPin, MoreHorizontal, ChevronDown, Zap, Store, TrendingUp, Download, Sparkles } from "lucide-react";
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

interface Offer {
  id: string;
  call_to_action: string;
  locations: {
    name: string;
    address: string;
  }[];
  created_at: string;
  expires_at?: string;
  expiresAt?: string;
  is_active: boolean;
  redemption_count: number;
  is_open_offer?: boolean;
  available_for_partnership?: boolean;
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
        let locationsData = locations;
        if (locationsData.length === 0) {
          try {
            const locationsResponse = await get({ 
              end_point: 'locations',
              token: true
            });
            if (locationsResponse.success && locationsResponse.data) {
              locationsData = locationsResponse.data;
              setLocations(locationsData);
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
                      name: loc.name || '',
                      address: loc.address || ''
                    };
                  }
                  // If it's just an ID string or ObjectId, find it from locations state
                  const locIdStr = loc?._id?.toString() || loc?.toString() || loc;
                  const foundLoc = locationsData.find((l: any) => {
                    const lIdStr = l._id?.toString() || l.id?.toString();
                    return lIdStr === locIdStr;
                  });
                  return foundLoc ? {
                    name: foundLoc.name || '',
                    address: foundLoc.address || ''
                  } : { name: 'Unknown Location', address: '' };
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
                : (offer.available_for_partnership !== undefined ? offer.available_for_partnership : true)
            };
            
            console.log(`Formatted offer ${index + 1}:`, formattedOffer);
            return formattedOffer;
          } catch (offerError) {
            console.error(`Error formatting offer ${index + 1}:`, offerError, offer);
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
                : true
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

  const handleAssignOffer = (locationId: string, offerId: string) => {
    // Update location's current offer
    setLocations(locations.map(location => 
      location.id === locationId 
        ? { 
            ...location, 
            current_offer: offers.find(offer => offer.id === offerId) || null 
          }
        : location
    ));
    
    toast({
      title: "Success",
      description: "Offer assigned to location successfully",
    });
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
            <p className="text-muted-foreground">Manage your promotional offers and track redemptions</p>
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
              Offers x Locations
            </CardTitle>
            <p className="text-muted-foreground">Link a created offer to your store location(s) to start promoting that store. Please note after linking your offer you’ll need to add partners or join Open Offer to get views for your store’s offer.</p>
            {/* <p className="text-sm text-primary mt-2">
              <strong>Please note:</strong> Offers will only show for these locations if you've partnered with other retailers or enrolled in Open Offer.
            </p> */}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <Card key={location.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{location.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                          <DropdownMenuItem>View Analytics</DropdownMenuItem>
                          <DropdownMenuItem>Remove Offer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Total Redemptions */}
                    {/* <div className="bg-muted/30 rounded-lg p-3">
                      <div className="text-2xl font-bold text-primary">{location.total_redemptions}</div>
                      <p className="text-xs text-muted-foreground">Total Redemptions</p>
                    </div> */}

                    {/* Current Offer or Selection */}
                    {/* <div>
                      {location.current_offer ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current offer:</p>
                          <p className="text-sm font-medium mb-2">{location.current_offer.call_to_action}</p>
                          <Select 
                            value={location.current_offer.id} 
                            onValueChange={(value) => handleAssignOffer(location.id, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Change offer" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border shadow-lg z-50">
                              {offers.filter(offer => offer.is_active).map((offer) => (
                                <SelectItem key={offer.id} value={offer.id}>
                                  {offer.call_to_action}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">No active offer. Add one!</p>
                          <Select onValueChange={(value) => handleAssignOffer(location.id, value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select an offer" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border shadow-lg z-50">
                              {offers.filter(offer => offer.is_active).map((offer) => (
                                <SelectItem key={offer.id} value={offer.id}>
                                  {offer.call_to_action}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div> */}
                  </div>
                </Card>
              ))}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Locations</TableHead>
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
                        {(offer as any).is_open_offer ? (
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            Open Offer
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Location-based
                            {(offer as any).available_for_partnership && (
                              <span className="ml-1 text-xs">(Available for Partnership)</span>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {offer.locations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No locations assigned</p>
                          ) : offer.locations.length === 1 ? (
                            <div>
                              <p className="font-medium">{offer.locations[0].name}</p>
                              <p className="text-sm text-muted-foreground">{offer.locations[0].address}</p>
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedOffer(offer);
                                  setIsLocationDialogOpen(true);
                                }}
                                className="font-medium text-primary hover:text-primary/80 text-left"
                              >
                                {offer.locations.length} locations
                              </button>
                              <div className="mt-1 space-y-1">
                                {offer.locations.slice(0, 2).map((location, index) => (
                                  <p key={index} className="text-xs text-muted-foreground">
                                    {location.name}
                                  </p>
                                ))}
                                {offer.locations.length > 2 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{offer.locations.length - 2} more
                                  </p>
                                )}
                              </div>
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewOffer(offer)}
                            title="View offer details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

             {/* View Offer Details Dialog */}
             <Dialog open={isViewOfferDialogOpen} onOpenChange={setIsViewOfferDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Offer Details
              </DialogTitle>
            </DialogHeader>
            
            {viewingOffer && (
              <div className="space-y-6 mt-4">
                {/* Offer Text */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Offer Text</Label>
                  <p className="text-lg font-medium mt-1">{viewingOffer.call_to_action}</p>
                </div>

                {/* Offer Type */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Offer Type</Label>
                  <div className="mt-1">
                    {viewingOffer.is_open_offer ? (
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                        Open Offer
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Location-based
                        {viewingOffer.available_for_partnership && (
                          <span className="ml-1 text-xs">(Available for Partnership)</span>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Locations ({viewingOffer.locations.length})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {viewingOffer.locations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No locations assigned</p>
                    ) : (
                      viewingOffer.locations.map((location, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-sm text-muted-foreground">{location.address}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={viewingOffer.is_active ? "default" : "secondary"}>
                      {viewingOffer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">
                    {new Date(viewingOffer.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Redemptions */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Total Redemptions</Label>
                  <p className="text-2xl font-bold text-primary mt-1">{viewingOffer.redemption_count}</p>
                </div>
              </div>
            )}
             </DialogContent>
             </Dialog>

        </div>
      </div>
    </AppLayout>
  );
};

export default Offers;