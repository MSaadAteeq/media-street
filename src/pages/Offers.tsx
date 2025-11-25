import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, MapPin, MoreHorizontal, ChevronDown, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  useEffect(() => {
    // Fetch locations first, then offers (so locations are available for mapping)
    fetchLocations().then(() => {
      fetchOffers();
    });
    fetchRedemptions();
  }, []);

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
        
        // Format offers data to match frontend interface
        // Filter to only include current user's offers (backend should already do this, but double-check)
        const userOffers = currentUserId 
          ? response.data.filter((offer: any) => {
              const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
              return offerUserId === currentUserId;
            })
          : response.data; // If we can't get user ID, trust backend filtering
        
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
            
            const formattedOffer = {
              id: offerId,
              call_to_action: offer.callToAction || offer.call_to_action || '',
              locations: offerLocations,
              created_at: offer.createdAt || offer.created_at || new Date().toISOString(),
              is_active: offer.isActive !== undefined ? offer.isActive : (offer.is_active !== undefined ? offer.is_active : true),
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
            console.warn(`Offer at index ${index} has no ID, skipping:`, offer);
            return false;
          }
          // Check for duplicate IDs (keep first occurrence)
          const firstIndex = self.findIndex(o => o.id === offer.id);
          if (firstIndex !== index) {
            console.warn(`Duplicate offer ID found: ${offer.id}, keeping first occurrence`);
            return false;
          }
          return true;
        });
        
        console.log(`Valid offers after filtering: ${validOffers.length}`);
        
        if (validOffers.length !== userOffers.length) {
          console.warn(`Warning: ${userOffers.length - validOffers.length} offers were filtered out`);
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

  const handleAddLocationToOffer = (offerId: string, locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;

    // Update the offers state to include the new location
    setOffers(offers.map(offer => 
      offer.id === offerId 
        ? { 
            ...offer, 
            locations: [...offer.locations, { name: location.name, address: location.address }]
          }
        : offer
    ));

    toast({
      title: "Success",
      description: `Added ${location.name} to offer`,
    });
  };

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
            <Button variant="outline" onClick={() => navigate("/openoffer")}>
              Browse Open Offers
            </Button>
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
              Manage which offers are active at each of your locations
            </CardTitle>
            <p className="text-muted-foreground">Control offer visibility and track performance across all locations</p>
            <p className="text-sm text-primary mt-2">
              <strong>Please note:</strong> Offers will only show for these locations if you've partnered with other retailers or enrolled in Open Offer.
            </p>
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
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="text-2xl font-bold text-primary">{location.total_redemptions}</div>
                      <p className="text-xs text-muted-foreground">Total Redemptions</p>
                    </div>

                    {/* Open Offer Eligibility */}
                    <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/20">
                      <Checkbox
                        id={`open-offer-only-${location.id}`}
                        checked={!!location.open_offer_only}
                        onCheckedChange={(checked) =>
                          handleToggleOpenOfferOnly(location.id, Boolean(checked))
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label
                          htmlFor={`open-offer-only-${location.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Dedicate this location to Open Offers
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {location.open_offer_only
                            ? "This location will only appear when creating Open Offers."
                            : "This location can be used for regular offers. Enable to reserve it for Open Offers only."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Current Offer or Selection */}
                    <div>
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
                    </div>
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
                          
                          {/* Add Location Dropdown */}
                          <div className="pt-2">
                            <Select onValueChange={(value) => handleAddLocationToOffer(offer.id, value)}>
                              <SelectTrigger className="h-7 text-xs bg-background border border-border">
                                <SelectValue placeholder="+ Add location" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border shadow-lg z-50">
                                {locations
                                  .filter(location => !offer.locations.some(ol => ol.name === location.name))
                                  .map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      <div>
                                        <p className="font-medium">{location.name}</p>
                                        <p className="text-xs text-muted-foreground">{location.address}</p>
                                      </div>
                                    </SelectItem>
                                  ))}
                                {locations.filter(location => !offer.locations.some(ol => ol.name === location.name)).length === 0 && (
                                  <SelectItem value="none" disabled>
                                    All locations already added
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={offer.is_active ? "default" : "secondary"}>
                          {offer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">{offer.redemption_count}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(offer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!offer.is_active && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteOffer(offer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Recent Redemptions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="export">Export Data</TabsTrigger>
              </TabsList>
              
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
              
              <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{redemptions.length}</div>
                      <p className="text-xs text-muted-foreground">Total Redemptions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{offers.filter(o => o.is_active).length}</div>
                      <p className="text-xs text-muted-foreground">Active Offers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">
                        {redemptions.length > 0 && offers.length > 0 
                          ? Math.round((redemptions.length / (offers.reduce((sum, o) => sum + (o.redemption_count || 0), 0) || 1)) * 100)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Conversion Rate</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Detailed analytics coming soon</p>
                </div>
              </TabsContent>
              
              <TabsContent value="export" className="mt-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline">Export Offers (CSV)</Button>
                    <Button variant="outline">Export Redemptions (CSV)</Button>
                    <Button variant="outline">Export Analytics (PDF)</Button>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Export functionality coming soon</p>
                  </div>
                </div>
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

        </div>
      </div>
    </AppLayout>
  );
};

export default Offers;