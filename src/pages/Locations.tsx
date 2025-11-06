import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  MoreVertical, 
  Plus,
  Search,
  Bell,
  Building,
  QrCode,
  Ticket,
  Monitor
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Locations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [retailChannel, setRetailChannel] = useState("");


  // Load locations from database
  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive",
        });
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    addSampleLocations();
  }, []);

  const addSampleLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping sample locations');
        return;
      }

      console.log('Checking for existing Sally Salon locations...');
      // Check if sample locations already exist
      const { data: existing, error: selectError } = await supabase
        .from('locations')
        .select('name')
        .eq('user_id', user.id)
        .ilike('name', 'Sally%Salon%');

      if (selectError) {
        console.error('Error checking existing locations:', selectError);
      }

      console.log('Existing locations:', existing);
      if (existing && existing.length > 0) {
        console.log('Sample locations already exist');
        return;
      }

      console.log('Adding sample Sally Salon locations...');
      // Add sample Sally's Salon locations
      const sampleLocations = [
        {
          user_id: user.id,
          name: "Sally's Salon - Downtown",
          address: "456 Oak Street, Manhattan, NY 10013",
          retail_channel: "salon"
        },
        {
          user_id: user.id,
          name: "Sally's Salon - Uptown",
          address: "789 Elm Avenue, Brooklyn, NY 11201",
          retail_channel: "salon"
        },
        {
          user_id: user.id,
          name: "Sally's Salon - Midtown",
          address: "321 Pine Boulevard, Queens, NY 11101",
          retail_channel: "salon"
        }
      ];

      const { error, data: insertedData } = await supabase
        .from('locations')
        .insert(sampleLocations)
        .select();

      if (error) {
        console.error('Error adding sample locations:', error);
        toast({
          title: "Error",
          description: "Could not add sample locations: " + error.message,
          variant: "destructive"
        });
      } else {
        console.log('Successfully added sample locations:', insertedData);
        loadLocations();
      }
    } catch (error) {
      console.error('Error adding sample locations:', error);
    }
  };

  const handleAddLocation = async () => {
    if (!storeName || !address || !city || !retailChannel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add locations",
          variant: "destructive",
        });
        return;
      }

      const fullAddress = `${address}, ${city}`;

      const { error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          name: storeName,
          address: fullAddress,
          retail_channel: retailChannel
        });

      if (error) {
        console.error('Error adding location:', error);
        toast({
          title: "Error",
          description: "Failed to add location",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Location added successfully",
      });
      
      // Reset form
      setStoreName("");
      setAddress("");
      setCity("");
      setRetailChannel("");
      setAddLocationOpen(false);
      loadLocations();
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete locations",
          variant: "destructive",
        });
        return;
      }

      // Delete OfferX subscriptions for this location
      const { error: offerxError } = await supabase
        .from('offerx_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (offerxError) {
        console.error('Error deleting OfferX subscriptions:', offerxError);
      }

      // Delete OfferAI subscriptions for this location
      const { error: offeraiError } = await supabase
        .from('offerai_subscriptions')
        .delete()
        .eq('location_id', locationToDelete.id);

      if (offeraiError) {
        console.error('Error deleting OfferAI subscriptions:', offeraiError);
      }

      // Delete offers for this location
      const { error: offersError } = await supabase
        .from('offers')
        .delete()
        .eq('location_id', locationToDelete.id);

      if (offersError) {
        console.error('Error deleting offers:', offersError);
      }

      // Finally delete the location
      const { error: locationError } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationToDelete.id)
        .eq('user_id', user.id);

      if (locationError) {
        console.error('Error deleting location:', locationError);
        toast({
          title: "Error",
          description: "Failed to delete location",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Location and all associated subscriptions have been removed",
      });
      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error", 
        description: "Failed to delete location",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  return (
    <AppLayout pageTitle="Store Locations" pageIcon={<MapPin className="h-5 w-5 text-primary" />}>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground">Manage the stores where Media Street is running.</p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setAddLocationOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>

          {/* Locations Table */}
          <Card className="bg-card border-border shadow-soft">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">#</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm whitespace-nowrap">Store Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden md:table-cell">City</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center text-xs sm:text-sm whitespace-nowrap">Redemptions</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center text-xs sm:text-sm">Partners</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center text-xs sm:text-sm">Display QR Code</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">Carousel</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                        Loading locations...
                      </TableCell>
                    </TableRow>
                  ) : locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                        No locations found. Add your first location to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location) => (
                      <TableRow 
                        key={location.id} 
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <TableCell className="text-foreground font-medium text-xs sm:text-sm">
                          {location.id.slice(0, 6)}...
                        </TableCell>
                        <TableCell className="text-foreground font-medium text-xs sm:text-sm whitespace-nowrap">
                          {location.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                          {location.address.split(',')[1]?.trim() || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                          {location.address}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Ticket className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span className="text-foreground font-semibold text-xs sm:text-sm">
                              {location.redemption_count || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {location.open_offer_active ? (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">Open Offer</Badge>
                          ) : (
                            <span className="text-primary font-semibold text-sm sm:text-lg">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => {
                              // Navigate to a QR code view or open modal
                              window.open(`/locations/${location.id}/qr`, '_blank');
                            }}
                          >
                            <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => navigate('/display')}
                          >
                            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <HoverCard openDelay={100} closeDelay={300}>
                            <HoverCardTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              align="end" 
                              side="left"
                              sideOffset={5}
                              className="w-40 p-1 bg-card border-border shadow-lg z-50"
                            >
                              <div className="space-y-1">
                                <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors">
                                  Edit
                                </button>
                                <button 
                                  className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                  onClick={() => {
                                    setLocationToDelete(location);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Add Location Dialog */}
        <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Enter your store details to add a new location
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="Enter store name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City, State ZIP</Label>
                <Input
                  id="city"
                  placeholder="New York, NY 10001"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailChannel">Retail Channel</Label>
                <Select value={retailChannel} onValueChange={setRetailChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select retail channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="salon">Salon/Spa</SelectItem>
                    <SelectItem value="cafe">Café/Coffee Shop</SelectItem>
                    <SelectItem value="grocery">Grocery/Market</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLocationOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation}>
                Add Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{locationToDelete?.name}"? This will:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Remove all OfferX subscriptions for this location</li>
                  <li>Remove all OfferAI subscriptions for this location</li>
                  <li>Delete all offers associated with this location</li>
                  <li>Remove this location from partner search results</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteLocation}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Location"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </AppLayout>
  );
};

export default Locations;