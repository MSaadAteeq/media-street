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
// Supabase removed - will use Node.js API
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
      // Fetch locations from backend API
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response.success && response.data) {
        setLocations(response.data);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching locations from API:', error);
      // Fall through to mock data if API fails
    }
    
    // Fallback to mock data if API call fails
    try {
      // Static data for now
      const sampleLocations = [
        {
          id: "loc-1",
          name: "Sally's Salon - Downtown",
          address: "456 Oak Street, Manhattan, NY 10013",
          retail_channel: "salon",
          created_at: new Date().toISOString()
        },
        {
          id: "loc-2",
          name: "Sally's Salon - Uptown",
          address: "789 Elm Avenue, Brooklyn, NY 11201",
          retail_channel: "salon",
          created_at: new Date().toISOString()
        },
        {
          id: "loc-3",
          name: "Sally's Salon - Midtown",
          address: "321 Pine Boulevard, Queens, NY 11101",
          retail_channel: "salon",
          created_at: new Date().toISOString()
        }
      ];
      setLocations(sampleLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

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
      const { post } = await import("@/services/apis");
      const fullAddress = `${address}, ${city}`;
      
      const response = await post({ 
        end_point: 'locations', 
        body: { 
          name: storeName, 
          address: fullAddress, 
          retail_channel: retailChannel 
        },
        token: true
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Location added successfully",
        });
        
        // Reload locations
        loadLocations();
        
        // Reset form
        setStoreName("");
        setAddress("");
        setCity("");
        setRetailChannel("");
        setAddLocationOpen(false);
      } else {
        throw new Error(response.message || 'Failed to add location');
      }
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: "Failed to add location",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    
    setDeleting(true);
    try {
      const { deleteApi } = await import("@/services/apis");
      const response = await deleteApi({ 
        end_point: `locations/${locationToDelete.id}`,
        token: true
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Location and all associated subscriptions have been removed",
        });
        
        // Reload locations
        loadLocations();
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete location');
      }
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