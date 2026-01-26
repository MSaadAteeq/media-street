import { useState, useEffect } from "react";
import { Bot, MapPin, Zap, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Supabase removed - will use Node.js API
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { get, post, patch } from "@/services/apis";
interface Location {
  id: string;
  name: string;
  address: string;
  currentOffer?: string;
  offerXActive?: boolean;
  openOfferActive?: boolean;
  canToggleOpenOffer?: boolean; // Only show toggle if no non-open offer exists
  hasActiveOffer?: boolean; // Whether location has any active (non-expired) offer
  activePartnerships: number;
  maxPartnerships: number;
  posConnected?: boolean;
}
const OfferAI = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingLocationId, setPendingLocationId] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [authorized, setAuthorized] = useState(false);
  const [allOpenOffers, setAllOpenOffers] = useState<any[]>([]);
  const [loadingOpenOffers, setLoadingOpenOffers] = useState(false);
  const [selectedOpenOffer, setSelectedOpenOffer] = useState<any>(null);
  const [isOpenOfferDialogOpen, setIsOpenOfferDialogOpen] = useState(false);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [pendingSubscribeOffer, setPendingSubscribeOffer] = useState<any>(null);
  const [selectedSubscribeLocationId, setSelectedSubscribeLocationId] = useState<string>("");

  // Load locations and offers from API
  useEffect(() => {
    loadLocationsAndOffers();
    fetchAllOpenOffers();
  }, []);

  const loadLocationsAndOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch locations from API
      const locationsResponse = await get({ 
        end_point: 'locations',
        token: true
      });
      
      // Fetch offers from API
      const offersResponse = await get({ 
        end_point: 'offers',
        token: true
      });
      
      // Fetch partnerships to check active partnerships
      let partnerships: any[] = [];
      try {
        const partnersResponse = await get({ 
          end_point: 'partners',
          token: true
        });
        if (partnersResponse.success && partnersResponse.data) {
          partnerships = partnersResponse.data;
        }
      } catch (error) {
        console.error('Error fetching partnerships:', error);
      }

      if (locationsResponse.success && locationsResponse.data) {
        const locationsData = locationsResponse.data;
        
        // Check if any location has open offer enabled
        const hasOpenOfferLocation = locationsData.some((loc: any) => 
          loc.open_offer_only === true || loc.openOfferOnly === true
        );
        
        // If no location has open offer enabled, redirect to locations page
        if (!hasOpenOfferLocation) {
          toast({
            title: "Open Offer Not Enabled",
            description: "Please enable Open Offer for at least one location to access this page.",
            variant: "destructive",
          });
          navigate('/locations');
          return;
        }
        
        const offersData = offersResponse.success ? offersResponse.data : [];

        // Map locations with their current offers and open offer status
        const mappedLocations: Location[] = locationsData.map((loc: any) => {
          const locationId = loc._id?.toString() || loc.id?.toString();
          
          // Find active offer for this location
          // Check both locationIds (array) and location_ids (array) fields
          const now = new Date();
          const locationOffers = offersData.filter((offer: any) => {
            const offerLocationIds = offer.locationIds || offer.location_ids || [];
            const locationIdStr = locationId;
            const isLocationMatch = offerLocationIds.some((lid: any) => {
              const lidStr = lid?._id?.toString() || lid?.toString() || lid;
              return lidStr === locationIdStr;
            });
            
            // Check if offer is active
            const isActive = offer.is_active === true || offer.isActive === true;
            
            // Check if offer is not expired
            const expiresAt = offer.expiresAt || offer.expiration_date || offer.expires_at;
            const notExpired = !expiresAt || new Date(expiresAt) > now;
            
            return isLocationMatch && isActive && notExpired;
          });
          
          const currentOffer = locationOffers.length > 0 
            ? (locationOffers[0].call_to_action || locationOffers[0].callToAction) 
            : null;
          
          // Check if location has any active (non-expired) offer
          const hasActiveOffer = locationOffers.length > 0;
          
          // Check if location has open offer active
          const hasOpenOffer = locationOffers.some((offer: any) => 
            offer.is_open_offer || offer.isOpenOffer
          );
          
          // Check if location has a non-open offer (regular offer)
          const hasNonOpenOffer = locationOffers.some((offer: any) => 
            !(offer.is_open_offer || offer.isOpenOffer)
          );
          
          // Show toggle only if: no offer exists OR offer is already an open offer
          // Hide toggle if there's a non-open offer
          const canToggleOpenOffer = !hasNonOpenOffer;
          
          // Count active partnerships for this location
          const locationPartnerships = partnerships.filter((p: any) => {
            const pLocationId = p.location_id?._id?.toString() || p.location_id?.toString() || p.location_id;
            return pLocationId === locationId && (p.status === 'active' || p.status === 'approved');
          });

          return {
            id: locationId,
            name: loc.name,
            address: loc.address,
            currentOffer: currentOffer || undefined,
            offerXActive: false, // TODO: Implement OfferX feature
            openOfferActive: hasOpenOffer,
            canToggleOpenOffer: canToggleOpenOffer, // Only show toggle if no non-open offer exists
            hasActiveOffer: hasActiveOffer, // Whether location has any active (non-expired) offer
            activePartnerships: locationPartnerships.length,
            maxPartnerships: 5,
            posConnected: false // TODO: Implement POS connection check
          };
        });

        setLocations(mappedLocations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error loading locations and offers:', error);
      setLocations([]);
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const checkUserHasOffer = async () => {
    try {
      // Check if user has any active offers via API
      const response = await get({ 
        end_point: 'offers',
        token: true
      });
      
      if (response.success && response.data) {
        const hasActiveOffer = response.data.some((offer: any) => offer.is_active);
        return hasActiveOffer;
      }
      return false;
    } catch (error) {
      console.error('Error checking user offers:', error);
      return false;
    }
  };
  const handleOpenOfferToggle = async (locationId: string, checked: boolean) => {
    if (checked) {
      // Check if user has an active offer
      const hasOffer = await checkUserHasOffer();
      if (!hasOffer) {
        toast({
          title: "Offer Required",
          description: "You must create an offer for your store before subscribing to Open Offer",
          variant: "destructive"
        });
        return;
      }

      // Check if location has active partnerships
      const location = locations.find(loc => loc.id === locationId);
      if (location && location.activePartnerships > 0) {
        toast({
          title: "Active Partnerships Found",
          description: "Please cancel your active partnerships before subscribing to Open Offer",
          variant: "destructive"
        });
        return;
      }

      // Show confirmation dialog when turning ON
      setPendingLocationId(locationId);
      setShowConfirmDialog(true);
    } else {
      // Turn OFF - Update offer to remove open offer status
      try {
        // Find offers for this location and update them
        const offersResponse = await get({ 
          end_point: 'offers',
          token: true
        });
        
        if (offersResponse.success && offersResponse.data) {
          const locationOffers = offersResponse.data.filter((offer: any) => 
            offer.location_ids && offer.location_ids.includes(locationId) && offer.is_open_offer
          );
          
          // Update each open offer to remove open offer status
          for (const offer of locationOffers) {
            await patch({
              end_point: `offers/${offer._id || offer.id}`,
              body: { is_open_offer: false },
              token: true
            });
          }
        }

        // Update local state
        setLocations(prev => prev.map(location => location.id === locationId ? {
          ...location,
          openOfferActive: false
        } : location));

        toast({
          title: "Success",
          description: "Open Offer has been turned off for this location",
        });
      } catch (error) {
        console.error('Error turning off open offer:', error);
        toast({
          title: "Error",
          description: "Failed to turn off Open Offer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  const handleConfirmOpenOffer = async () => {
    try {
      // Find offers for this location and update them to be open offers
      const offersResponse = await get({ 
        end_point: 'offers',
        token: true
      });
      
      if (offersResponse.success && offersResponse.data) {
        const locationOffers = offersResponse.data.filter((offer: any) => {
          const offerLocationIds = offer.locationIds || offer.location_ids || [];
          return offerLocationIds.some((lid: any) => {
            const lidStr = lid?._id?.toString() || lid?.toString() || lid;
            return lidStr === pendingLocationId;
          }) && (offer.is_active || offer.isActive);
        });
        
        if (locationOffers.length === 0) {
          toast({
            title: "No Active Offers",
            description: "Please create an active offer for this location first",
            variant: "destructive",
          });
          setShowConfirmDialog(false);
          setPendingLocationId("");
          setSelectedBudget("");
          setAuthorized(false);
          return;
        }
        
        // Update each active offer to be an open offer
        for (const offer of locationOffers) {
          await patch({
            end_point: `offers/${offer._id?.toString() || offer.id?.toString()}`,
            body: { is_open_offer: true },
            token: true
          });
        }
      }

      // Update local state
      setLocations(prev => prev.map(location => location.id === pendingLocationId ? {
        ...location,
        openOfferActive: true
      } : location));
      
      setShowConfirmDialog(false);
      setPendingLocationId("");
      setSelectedBudget("");
      setAuthorized(false);
      
      toast({
        title: "Success",
        description: "Open Offer has been activated for this location",
      });
    } catch (error) {
      console.error('Error activating open offer:', error);
      toast({
        title: "Error",
        description: "Failed to activate Open Offer. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleCancelOpenOffer = () => {
    setShowConfirmDialog(false);
    setPendingLocationId("");
    setSelectedBudget("");
    setAuthorized(false);
  };

  const fetchAllOpenOffers = async () => {
    try {
      setLoadingOpenOffers(true);
      // Fetch all open offers from all retailers (optionally authenticated to exclude own offers)
      const response = await get({ 
        end_point: 'offers/open',
        token: true // Send token so backend can exclude own offers and set subscription status
      });
      
      if (response.success && response.data) {
        // Backend already excludes current user's offers when token is sent, so no need to filter again
        // Format open offers data
        const formattedOpenOffers = response.data
          .map((offer: any) => {
            // Handle locations - could be in locations array or locationIds
            const offerLocations = Array.isArray(offer.locations) 
              ? offer.locations.map((loc: any) => {
                  if (loc && typeof loc === 'object' && loc._id) {
                    return {
                      name: loc.name || '',
                      address: loc.address || ''
                    };
                  }
                  return { name: 'Unknown', address: '' };
                })
              : Array.isArray(offer.locationIds)
              ? offer.locationIds.map((loc: any) => {
                  if (loc && typeof loc === 'object' && loc._id) {
                    return {
                      name: loc.name || '',
                      address: loc.address || ''
                    };
                  }
                  return { name: 'Unknown', address: '' };
                })
              : [];

            return {
              id: offer._id?.toString() || offer.id?.toString(),
              call_to_action: offer.callToAction || offer.call_to_action || '',
              locations: offerLocations,
              created_at: offer.createdAt || offer.created_at || new Date().toISOString(),
              is_active: offer.isActive !== undefined ? offer.isActive : (offer.is_active !== undefined ? offer.is_active : true),
              redemption_count: offer.redemptionCount || offer.redemption_count || 0,
              is_open_offer: true,
              retailer_name: offer.user?.fullName || 'Unknown Retailer',
              retailer_email: offer.user?.email || '',
              offer_image: offer.offerImage || offer.offer_image || null,
              is_subscribed: offer.isSubscribed || offer.is_subscribed || false,
              isSubscribed: offer.isSubscribed || offer.is_subscribed || false,
              is_subscribed_by_anyone: offer.isSubscribedByAnyone || offer.is_subscribed_by_anyone || false,
              isSubscribedByAnyone: offer.isSubscribedByAnyone || offer.is_subscribed_by_anyone || false
            };
          });
        
        setAllOpenOffers(formattedOpenOffers);
      } else {
        setAllOpenOffers([]);
      }
    } catch (error) {
      console.error('Error fetching all open offers:', error);
      setAllOpenOffers([]);
    } finally {
      setLoadingOpenOffers(false);
    }
  };
  if (loading) {
    return <AppLayout pageTitle="Open Offer" pageIcon={<Bot className="h-6 w-6 text-primary" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading locations...</div>
        </div>
      </AppLayout>;
  }
  return <AppLayout pageTitle="Open Offer" pageIcon={<Bot className="h-6 w-6 text-primary" />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">My Offer</h1>
            <p className="text-muted-foreground">Open Offer uses AI to optimize display of your current offer at nearby retail locations to maximize conversions. When turned on, your offer will start showing at nearby retailers also in the Open Offer network and vice versa ensuring maximum reach and conversion optimization for your offer. </p>
          </div>


          {/* Locations Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locations.map(location => {
          const hasActivePartnerships = location.activePartnerships > 0;
          return <Card key={location.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {location.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {location.address}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Current Offer */}
                  {location.currentOffer && <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-muted-foreground">Current Offer</div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/offers'} className="text-xs h-6 px-2">
                          Change offers
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm">{location.currentOffer}</span>
                      </div>
                    </div>}

                  {/* Partnership Status - Only show when Open Offer is OFF */}
                  {!location.openOfferActive && <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Partnership Status</div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Active Partnerships:</span>
                        <Badge variant={hasActivePartnerships ? "default" : "secondary"}>
                          {location.activePartnerships}
                        </Badge>
                      </div>
                    </div>}

                  {/* Open Offer Toggle - Only show if no non-open offer exists */}
                  {location.canToggleOpenOffer && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-muted-foreground">Open Offer</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch 
                                  checked={location.openOfferActive} 
                                  onCheckedChange={checked => handleOpenOfferToggle(location.id, checked)}
                                  disabled={location.hasActiveOffer}
                                />
                              </div>
                            </TooltipTrigger>
                            {location.hasActiveOffer && (
                              <TooltipContent>
                                <p className="text-sm">
                                  This toggle is disabled because there is an active offer running on this location. 
                                  Please wait until the offer expires to toggle Open Offer.
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                  {!location.canToggleOpenOffer && location.currentOffer && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <p className="text-xs">This location has a regular offer. To make it an open offer, please create a new offer and select "Open Offer" during creation.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>;
        })}
          </div>

          {/* No Locations State */}
          {locations.length === 0 && <Card className="text-center py-12">
              <CardContent>
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
                <p className="text-muted-foreground mb-4">
                  You need to add store locations before you can use Open Offer.
                </p>
                <Button onClick={() => window.location.href = '/locations'}>
                  Add Locations
                </Button>
              </CardContent>
            </Card>}

          {/* All Retailers' Open Offers Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                All Retailers' Open Offers
              </CardTitle>
              <CardDescription>
                Browse open offers from all retailers in the Open Offer network. These offers are available to display at your locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOpenOffers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading open offers...</p>
                </div>
              ) : allOpenOffers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No open offers available from other retailers yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Open offers will appear here when retailers enable them for their stores.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Retailer</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Redemptions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOpenOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">
                          {offer.call_to_action}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{offer.retailer_name}</p>
                            <p className="text-xs text-muted-foreground">{offer.retailer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {offer.locations.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No locations</p>
                            ) : offer.locations.length === 1 ? (
                              <div>
                                <p className="font-medium text-sm">{offer.locations[0].name}</p>
                                <p className="text-xs text-muted-foreground">{offer.locations[0].address}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-sm">{offer.locations.length} locations</p>
                                <div className="mt-1 space-y-1">
                                  {offer.locations.slice(0, 2).map((location: any, index: number) => (
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
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            Open Offer
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
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedOpenOffer(offer);
                                setIsOpenOfferDialogOpen(true);
                              }}
                              title="View Offer Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {offer.is_subscribed || offer.isSubscribed ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled
                              >
                                Subscribed
                              </Button>
                            ) : (offer.is_subscribed_by_anyone || offer.isSubscribedByAnyone) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled
                                title="This offer has already been subscribed by another retailer"
                              >
                                Already Subscribed
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  // Open dialog to select location for subscription
                                  setPendingSubscribeOffer(offer);
                                  setSelectedSubscribeLocationId("");
                                  setShowSubscribeDialog(true);
                                }}
                              >
                                Subscribe
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
        </div>

        {/* PartnerAI Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activate Open Offer?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="font-semibold text-foreground text-base">Pricing Terms</div>
                  <div className="space-y-2 text-sm">
                    <p>
                      Your payment method in{" "}
                      <button 
                        onClick={() => navigate('/settings?tab=billing')} 
                        className="text-primary hover:text-primary/80 underline font-medium"
                      >
                        Billing
                      </button>{" "}
                      will be charged <strong className="text-foreground">$25 per month</strong> for running your offer on POS machines at this location, until cancelled.
                    </p>
                    <div className="border-l-2 border-accent-green pl-3 py-1">
                      <p className="font-medium text-foreground">Earn Credits:</p>
                      <p>Receive $1 credit for every successful redemption you refer to another Open Offer retailer. Credits are applied monthly and reset when your subscription renews.</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm">
                  You'll be able to see campaign results from your <strong>Partnerships & Offers</strong> tab on the dashboard.
                </p>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="price-agreement" 
                    checked={authorized} 
                    onCheckedChange={(checked) => setAuthorized(checked === true)}
                  />
                  <label 
                    htmlFor="price-agreement" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I understand and agree to the $25/month subscription fee with credit discounts for referrals
                  </label>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelOpenOffer}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmOpenOffer}
                disabled={!authorized}
              >
                Activate Open Offer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Open Offer Details Dialog */}
        <Dialog open={isOpenOfferDialogOpen} onOpenChange={setIsOpenOfferDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Open Offer Details
              </DialogTitle>
              <DialogDescription>
                View details of this open offer from {selectedOpenOffer?.retailer_name || 'Unknown Retailer'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOpenOffer && (
              <div className="space-y-6 py-4">
                {/* Offer Image */}
                {selectedOpenOffer.offer_image && (
                  <div className="w-full rounded-lg overflow-hidden border">
                    <img 
                      src={selectedOpenOffer.offer_image} 
                      alt={selectedOpenOffer.call_to_action}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
                
                {/* Offer Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Offer</Label>
                    <p className="text-lg font-semibold mt-1">{selectedOpenOffer.call_to_action}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Retailer</Label>
                    <div className="mt-1">
                      <p className="font-medium">{selectedOpenOffer.retailer_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOpenOffer.retailer_email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Offer Type</Label>
                    <div className="mt-1">
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                        Open Offer
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Locations</Label>
                    <div className="mt-2 space-y-2">
                      {selectedOpenOffer.locations && selectedOpenOffer.locations.length > 0 ? (
                        selectedOpenOffer.locations.map((location: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{location.name}</p>
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No locations specified</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Subscription Status</Label>
                    <div className="mt-1">
                      {selectedOpenOffer.is_subscribed || selectedOpenOffer.isSubscribed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          You are subscribed
                        </Badge>
                      ) : selectedOpenOffer.is_subscribed_by_anyone || selectedOpenOffer.isSubscribedByAnyone ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Already subscribed by another retailer
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Available for subscription
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Redemptions</Label>
                      <p className="text-lg font-semibold mt-1">{selectedOpenOffer.redemption_count || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedOpenOffer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Subscribe to Open Offer Dialog - Location Selector */}
        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe to Open Offer</DialogTitle>
              <DialogDescription>
                Select which location should subscribe to this open offer: <strong>{pendingSubscribeOffer?.retailer_name || pendingSubscribeOffer?.call_to_action || 'this offer'}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Select Location <span className="text-muted-foreground">(Required)</span>
                </Label>
                <div className="text-xs text-muted-foreground mb-2">
                  Choose which of your locations should display this open offer in the carousel.
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {locations.map(location => (
                    <Button 
                      key={location.id} 
                      variant={selectedSubscribeLocationId === location.id ? "default" : "outline"} 
                      className="w-full justify-start text-left h-auto py-3" 
                      onClick={() => setSelectedSubscribeLocationId(location.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{location.name}</span>
                        <span className="text-xs text-muted-foreground">{location.address}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                {locations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No locations available. Please add a location first.</p>
                )}
                {locations.length > 0 && !selectedSubscribeLocationId && (
                  <p className="text-xs text-red-600">Please select a location to continue</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSubscribeDialog(false);
                  setPendingSubscribeOffer(null);
                  setSelectedSubscribeLocationId("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (!selectedSubscribeLocationId) {
                    toast({
                      title: "Location Required",
                      description: "Please select a location for this subscription",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (!pendingSubscribeOffer) {
                    return;
                  }

                  try {
                    const { post } = await import("@/services/apis");
                    const response = await post({
                      end_point: 'partners/subscribe-open-offer',
                      body: { 
                        offer_id: pendingSubscribeOffer.id,
                        location_id: selectedSubscribeLocationId
                      },
                      token: true
                    });
                    
                    if (response.success) {
                      toast({
                        title: "Subscribed!",
                        description: `You've subscribed to ${pendingSubscribeOffer.retailer_name || 'this'}'s open offer for ${locations.find(l => l.id === selectedSubscribeLocationId)?.name || 'your location'}. It will now appear in your carousel.`,
                      });
                      // Refresh open offers list
                      fetchAllOpenOffers();
                      // Close dialog
                      setShowSubscribeDialog(false);
                      setPendingSubscribeOffer(null);
                      setSelectedSubscribeLocationId("");
                    } else {
                      throw new Error(response.message || 'Failed to subscribe');
                    }
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error?.response?.data?.message || error?.message || "Failed to subscribe to offer",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!selectedSubscribeLocationId}
              >
                Subscribe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>;
};
export default OfferAI;