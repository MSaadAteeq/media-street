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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    fetchOffers();
    fetchRedemptions();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add sample locations with current offers if no real data exists
      if (!data || data.length === 0) {
        const sampleLocations = [
          {
            id: "loc-1",
            name: "Coffee Corner",
            address: "123 Main St",
            current_offer: { id: "sample-1", call_to_action: "Get 15% off your coffee order" },
            total_redemptions: 23
          },
          {
            id: "loc-2", 
            name: "Bloom & Blossom",
            address: "456 Garden Ave",
            current_offer: { id: "sample-2", call_to_action: "Buy 2 get 1 free flowers" },
            total_redemptions: 8
          },
          {
            id: "loc-3",
            name: "Bistro 789", 
            address: "789 Food Plaza",
            current_offer: null,
            total_redemptions: 41
          },
          {
            id: "loc-4",
            name: "Tech Repair Hub",
            address: "321 Digital Dr",
            current_offer: null,
            total_redemptions: 0
          }
        ];
        setLocations(sampleLocations);
      } else {
        // Add total_redemptions to real data
        const locationsWithRedemptions = data.map(location => ({
          ...location,
          total_redemptions: 0 // This would be calculated from actual redemption data
        }));
        setLocations(locationsWithRedemptions);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id,
          call_to_action,
          created_at,
          is_active,
          location:locations(name, address)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get redemption counts for each offer and convert to new format
      const offersWithCounts = await Promise.all(
        (data || []).map(async (offer) => {
          const { count } = await supabase
            .from("offer_redemptions")
            .select("*", { count: "exact" })
            .eq("offer_id", offer.id);

          return {
            ...offer,
            locations: offer.location ? [offer.location] : [], // Convert single location to array
            redemption_count: count || 0,
          };
        })
      );

      // Add sample data if no real data exists
      if (offersWithCounts.length === 0) {
        const sampleOffers = [
          {
            id: "sample-1",
            call_to_action: "Get 15% off your coffee order",
            locations: [
              { name: "Coffee Corner", address: "123 Main St" },
              { name: "Coffee Corner East", address: "456 Oak Ave" }
            ],
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            redemption_count: 23
          },
          {
            id: "sample-2", 
            call_to_action: "Buy 2 get 1 free flowers",
            locations: [
              { name: "Bloom & Blossom", address: "456 Garden Ave" }
            ],
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            redemption_count: 8
          },
          {
            id: "sample-3",
            call_to_action: "Free appetizer with entree",
            locations: [
              { name: "Bistro 789", address: "789 Food Plaza" },
              { name: "Bistro Downtown", address: "321 City Center" },
              { name: "Bistro Westside", address: "555 West Ave" }
            ],
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: false,
            redemption_count: 41
          }
        ];
        setOffers(sampleOffers);
      } else {
        setOffers(offersWithCounts);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
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

  const fetchRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from("offer_redemptions")
        .select(`
          id,
          redemption_code,
          referring_store,
          redeemed_at,
          offer:offers(call_to_action),
          location:locations(name)
        `)
        .order("redeemed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Add sample data if no real data exists
      if (!data || data.length === 0) {
        const sampleRedemptions = [
          {
            id: "redemption-1",
            redemption_code: "CR789123",
            referring_store: "Coffee Corner",
            redeemed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            offer: { call_to_action: "Get 15% off your coffee order" },
            location: { name: "Coffee Corner" }
          },
          {
            id: "redemption-2",
            redemption_code: "FL456789",
            referring_store: "Bloom & Blossom",
            redeemed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            offer: { call_to_action: "Buy 2 get 1 free flowers" },
            location: { name: "Bloom & Blossom" }
          },
          {
            id: "redemption-3",
            redemption_code: "BR234567",
            referring_store: "Bistro 789",
            redeemed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            offer: { call_to_action: "Free appetizer with entree" },
            location: { name: "Bistro 789" }
          },
          {
            id: "redemption-4",
            redemption_code: "CF567890",
            referring_store: "Coffee Corner",
            redeemed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            offer: { call_to_action: "Get 15% off your coffee order" },
            location: { name: "Coffee Corner" }
          }
        ];
        setRedemptions(sampleRedemptions);
      } else {
        setRedemptions(data);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      toast({
        title: "Error",
        description: "Failed to load redemptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
      
      fetchOffers();
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
           <Button onClick={() => navigate("/offers/create")} className="flex items-center gap-2">
             <Plus className="h-4 w-4" />
             Create New Offer
           </Button>
         </div>

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
                      <div className="text-2xl font-bold">72</div>
                      <p className="text-xs text-muted-foreground">Total Redemptions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">Active Offers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">24%</div>
                      <p className="text-xs text-muted-foreground">Conversion Rate</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Analytics dashboard coming soon</p>
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
    </AppLayout>
  );
};

export default Offers;