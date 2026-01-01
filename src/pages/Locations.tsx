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
import { Switch } from "@/components/ui/switch";
import LocationPicker from "@/components/LocationPicker";
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
import { RETAIL_CHANNELS } from "@/constants/retailChannels";
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
  const [openOfferConfirmOpen, setOpenOfferConfirmOpen] = useState(false);
  const [pendingLocationToggle, setPendingLocationToggle] = useState<{ id: string; checked: boolean } | null>(null);
  const [storeName, setStoreName] = useState("");
  const [retailChannel, setRetailChannel] = useState("");
  const [selectedLatitude, setSelectedLatitude] = useState<number | undefined>(undefined);
  const [selectedLongitude, setSelectedLongitude] = useState<number | undefined>(undefined);
  const [selectedAddress, setSelectedAddress] = useState<string>("");


  // Load locations from database
  const loadLocations = async () => {
    try {
      setLoading(true);
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
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    
    // If API fails, set empty array (no fallback to static data)
    setLocations([]);
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleLocationSelect = (latitude: number, longitude: number, locationName?: string) => {
    setSelectedLatitude(latitude);
    setSelectedLongitude(longitude);
    if (locationName) {
      setSelectedAddress(locationName);
    }
  };

  const handleAddLocation = async () => {
    if (!storeName || !selectedLatitude || !selectedLongitude || !retailChannel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a location on the map",
        variant: "destructive",
      });
      return;
    }

    try {
      const { post } = await import("@/services/apis");
      
      const response = await post({ 
        end_point: 'locations', 
        body: { 
          name: storeName, 
          address: selectedAddress || `Location at ${selectedLatitude}, ${selectedLongitude}`, 
          latitude: selectedLatitude,
          longitude: selectedLongitude,
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
        setSelectedLatitude(undefined);
        setSelectedLongitude(undefined);
        setSelectedAddress("");
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

  const handleToggleOpenOfferOnly = (locationId: string, checked: boolean) => {
    // If turning ON, show confirmation dialog
    if (checked) {
      setPendingLocationToggle({ id: locationId, checked });
      setOpenOfferConfirmOpen(true);
    } else {
      // If turning OFF, proceed directly without confirmation
      proceedWithToggle(locationId, checked);
    }
  };

  const proceedWithToggle = async (locationId: string, checked: boolean) => {
    // Optimistically update UI first
    setLocations(prev => prev.map(loc => 
      loc.id === locationId 
        ? { ...loc, openOfferOnly: checked, open_offer_only: checked }
        : loc
    ));

    // Close dialog
    setOpenOfferConfirmOpen(false);
    setPendingLocationToggle(null);

    try {
      const { patch } = await import("@/services/apis");
      
      const response = await patch({ 
        end_point: `locations/${locationId}`, 
        body: { 
          open_offer_only: checked
        },
        token: true
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: checked 
            ? "Location is now dedicated to Open Offers only" 
            : "Location is now available for regular offers",
        });
        
        // Dispatch custom event to notify AppLayout about the toggle
        window.dispatchEvent(new CustomEvent('locationToggle'));
      } else {
        throw new Error(response.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error toggling open offer only:', error);
      toast({
        title: "Error", 
        description: "Failed to update location setting",
        variant: "destructive",
      });
      // Revert UI state on error
      setLocations(prev => prev.map(loc => 
        loc.id === locationId 
          ? { ...loc, openOfferOnly: !checked, open_offer_only: !checked }
          : loc
      ));
    }
  };

  const cancelToggle = () => {
    setOpenOfferConfirmOpen(false);
    setPendingLocationToggle(null);
    // No need to reload - the toggle was never actually changed in the UI
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
                    <TableHead className="text-muted-foreground font-medium text-center text-xs sm:text-sm whitespace-nowrap">Open Offer</TableHead>
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
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={location.openOfferOnly || location.open_offer_only || false}
                              onCheckedChange={(checked) => handleToggleOpenOfferOnly(location.id, checked)}
                              disabled={loading}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-primary font-semibold text-sm sm:text-lg">
                            {location.partner_count || location.partners || 0}
                          </span>
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
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  placeholder="Enter store name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailChannel">Retail Channel *</Label>
                <Select value={retailChannel} onValueChange={setRetailChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select retail channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETAIL_CHANNELS.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Location *</Label>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLatitude={selectedLatitude}
                  initialLongitude={selectedLongitude}
                  height="400px"
                />
                {(!selectedLatitude || !selectedLongitude) && (
                  <p className="text-sm text-destructive mt-1">
                    Please select your business location on the map
                  </p>
                )}
                {selectedAddress && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedAddress}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setAddLocationOpen(false);
                setStoreName("");
                setSelectedLatitude(undefined);
                setSelectedLongitude(undefined);
                setSelectedAddress("");
                setRetailChannel("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddLocation}
                disabled={!storeName || !selectedLatitude || !selectedLongitude || !retailChannel}
              >
                Add Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Open Offer Confirmation Dialog */}
        <AlertDialog open={openOfferConfirmOpen} onOpenChange={(open) => {
          if (!open) {
            cancelToggle();
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enable Open Offer for This Location?</AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-4">
                  You're enrolling this location in Open Offer which means:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm mb-4">
                  <li>Your offer for this location will automatically show at other nearby stores for maximum visibility</li>
                  <li>Offers for nearby stores will show on your partner carousel</li>
                </ul>
                <p className="font-medium">Do you want to proceed?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelToggle}>No thanks</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (pendingLocationToggle) {
                    proceedWithToggle(pendingLocationToggle.id, pendingLocationToggle.checked);
                  }
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Yes, proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{locationToDelete?.name}"? This will:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>End all active partnerships</li>
                  <li>Cancel your Open Offer subscription for this location</li>
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