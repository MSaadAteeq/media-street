import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DisplayOptionCheck from "@/components/DisplayOptionCheck";
import { checkDisplayOptions } from "@/utils/displayOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import { ShoppingBag, Store, AlertTriangle, DollarSign, X, MapPin, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

interface Location {
  id: string;
  name: string;
  address: string;
  offerx_active?: boolean;
  posConnected?: boolean;
  current_offer?: {
    id: string;
    call_to_action: string;
  } | null;
  total_redemptions?: number;
}

interface Offer {
  id: string;
  call_to_action: string;
  is_active: boolean;
}

const OfferX = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocations, setActiveLocations] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingLocationId, setPendingLocationId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{subscribed: boolean, active_locations: string[], total_subscriptions?: number}>({subscribed: false, active_locations: []});
  const [processingSubscription, setProcessingSubscription] = useState<string | null>(null);
  const [showDisplayOptionCheck, setShowDisplayOptionCheck] = useState(false);
  const [pendingOfferXLocationId, setPendingOfferXLocationId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // For now, use the same mock data as the Locations page since that's what the user is referring to
    loadMockLocations();
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-offerx-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscriptionStatus(data || {subscribed: false, active_locations: []});
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadMockLocations = () => {
    const mockLocations = [
      {
        id: "1",
        name: "Sally's Salon", 
        address: "Sally's Salon Street 7, New York",
        posConnected: true,
        current_offer: {
          id: "offer-1",
          call_to_action: "Get 15% off your coffee order"
        },
        total_redemptions: 23
      },
      {
        id: "2", 
        name: "Sally's Spa",
        address: "456 Garden Ave, New York", 
        posConnected: false,
        current_offer: {
          id: "offer-2",
          call_to_action: "Buy 2 get 1 free flowers"
        },
        total_redemptions: 8
      },
      {
        id: "3",
        name: "Sally's Boutique", 
        address: "789 Food Plaza, New York",
        posConnected: true,
        current_offer: null,
        total_redemptions: 41
      },
      {
        id: "4",
        name: "Sally's Cafe",
        address: "321 Digital Dr, New York", 
        posConnected: false,
        current_offer: null,
        total_redemptions: 0
      }
    ];

    const mockOffers = [
      { id: "offer-1", call_to_action: "Get 15% off your coffee order", is_active: true },
      { id: "offer-2", call_to_action: "Buy 2 get 1 free flowers", is_active: true },
      { id: "offer-3", call_to_action: "20% off all services", is_active: true },
      { id: "offer-4", call_to_action: "Free consultation", is_active: true }
    ];

    setLocations(mockLocations);
    setOffers(mockOffers);
    setLoading(false);
  };


  const handleAssignOffer = async (locationId: string, offerId: string) => {
    // This would update the offer assignment in the database
    // For now, just update the local state
    setLocations(prev => prev.map(location => 
      location.id === locationId 
        ? { 
            ...location, 
            current_offer: offers.find(offer => offer.id === offerId) || null 
          }
        : location
    ));
    
    toast({
      title: "Offer Updated",
      description: "The offer has been assigned to this location.",
    });
  };

  const handleOfferXToggle = (locationId: string, enable: boolean) => {
    if (enable) {
      // Check if location has POS connected
      const location = locations.find(loc => loc.id === locationId);
      if (!location?.posConnected) {
        toast({
          title: "Clover Machine Required",
          description: "OfferX is not available if you joined Media Street without connecting to a Clover machine.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if location has an offer selected
      if (!location?.current_offer) {
        // Only redirect to create offer if they don't have one
        navigate('/offer-create');
        return;
      }
      
      // Show confirmation dialog if POS is connected and offer is selected
      setPendingLocationId(locationId);
      setConfirmDialogOpen(true);
    } else {
      // Disable immediately without confirmation
      toggleLocationOfferX(locationId, false);
    }
  };

  const confirmOfferXActivation = () => {
    if (pendingLocationId) {
      toggleLocationOfferX(pendingLocationId, true);
      setPendingLocationId(null);
    }
    setConfirmDialogOpen(false);
  };

  const cancelOfferXActivation = () => {
    setPendingLocationId(null);
    setConfirmDialogOpen(false);
  };

  const toggleLocationOfferX = async (locationId: string, enable: boolean) => {
    if (enable) {
      const hasDisplayOption = await checkDisplayOptions();
      if (!hasDisplayOption) {
        setPendingOfferXLocationId(locationId);
        setShowDisplayOptionCheck(true);
        return;
      }
      
      // Check if this specific location already has a subscription
      const locationActive = subscriptionStatus.active_locations.includes(locationId);
      
      if (!locationActive) {
        // Start subscription process for this location
        setProcessingSubscription(locationId);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast({
              title: "Authentication Required",
              description: "Please log in to activate OfferX.",
              variant: "destructive"
            });
            return;
          }

          const { data, error } = await supabase.functions.invoke('create-offerx-checkout', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location_id: locationId }),
          });

          if (error) {
            throw error;
          }

          // Open checkout in new tab
          window.open(data.url, '_blank');
          
          toast({
            title: "Billing Initiated",
            description: "Complete the payment to activate OfferX for this location. $10/month will be charged to your saved payment method.",
          });

          // Check subscription status after a delay to allow for payment completion
          setTimeout(() => {
            checkSubscriptionStatus();
          }, 5000);

        } catch (error) {
          console.error('Error creating checkout:', error);
          toast({
            title: "Error",
            description: "Failed to start subscription process. Please try again.",
            variant: "destructive"
          });
        } finally {
          setProcessingSubscription(null);
        }
      } else {
        // Location already has subscription, just enable it locally
        setActiveLocations(prev => new Set([...prev, locationId]));
        toast({
          title: "OfferX Activated",
          description: "OfferX is now active for this location.",
        });
      }
    } else {
      // Disable OfferX for this location and cancel its subscription
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.functions.invoke('cancel-offerx-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location_id: locationId }),
        });

        if (error) {
          throw error;
        }

        // Update local state
        setActiveLocations(prev => {
          const newSet = new Set(prev);
          newSet.delete(locationId);
          return newSet;
        });

        // Update subscription status
        setSubscriptionStatus(prev => ({
          ...prev,
          active_locations: prev.active_locations.filter(id => id !== locationId)
        }));

        toast({
          title: "OfferX Cancelled",
          description: "OfferX subscription has been cancelled for this location.",
        });

      } catch (error) {
        console.error('Error cancelling location subscription:', error);
        toast({
          title: "Error",
          description: "Failed to cancel subscription for this location. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const cancelAllSubscriptions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('cancel-offerx-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // No location_id means cancel all
      });

      if (error) {
        throw error;
      }

      toast({
        title: "All Subscriptions Cancelled",
        description: data.message || "All OfferX subscriptions have been cancelled.",
      });

      // Update subscription status
      setSubscriptionStatus({subscribed: false, active_locations: []});
      setActiveLocations(new Set());
      
    } catch (error) {
      console.error('Error cancelling all subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscriptions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalMonthlyCost = subscriptionStatus.active_locations.length * 10;

  return (
    <TooltipProvider>
      <AppLayout pageTitle="OfferX" pageIcon={<ShoppingBag className="h-6 w-6 text-primary" />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">OfferX</h1>
            <p className="text-muted-foreground">
              Build and run your own custom offers across your store locations
            </p>
          </div>

          {/* Pricing Info */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>OfferX Pricing</span>
                {subscriptionStatus.subscribed && (
                  <Badge variant="default" className="ml-2">Active Subscription</Badge>
                )}
              </CardTitle>
              <CardDescription>
                $10 per store per month - Each location is billed separately to your saved payment method in Settings &gt; Billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">
                  Current monthly cost: ${totalMonthlyCost}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {subscriptionStatus.active_locations.length} location{subscriptionStatus.active_locations.length !== 1 ? 's' : ''} active
                  </Badge>
                  {subscriptionStatus.subscribed && subscriptionStatus.active_locations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={cancelAllSubscriptions}>
                      Cancel All Subscriptions
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Any store running OfferX will not be able to cross-promote with other retailers on Offer Ave or accept ads on Media Street as you'll be showing your own in-store offers to your customers.
            </AlertDescription>
          </Alert>


          {/* Location Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Your Store Locations</CardTitle>
              <CardDescription>
                Activate OfferX to show your own offers on each store's POS, instead of cross-promotional offers from partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading your store locations...</div>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground mb-4">
                    No store locations found. You need to add your store locations first to use OfferX.
                  </div>
                  <Button onClick={() => navigate('/locations')}>
                    Add Store Locations
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map((location) => {
                     const isActive = subscriptionStatus.active_locations.includes(location.id);
                     const isProcessing = processingSubscription === location.id;
                     const cardContent = (
                       <Card key={location.id} className="p-4 relative overflow-hidden">
                         {/* Diagonal Corner Banner - Only for Connected */}
                         {location.posConnected && (
                           <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
                             <div className="absolute transform rotate-45 translate-x-8 translate-y-4 bg-green-500 text-white text-xs font-medium px-10 py-1 shadow-lg">
                               Connected
                             </div>
                           </div>
                         )}
                         
                         <div className="space-y-3">
                           <div className="flex items-start justify-between">
                             <div className="flex-1 pr-10">
                               <div className="flex items-center gap-2 mb-2">
                                 <MapPin className="h-4 w-4 text-muted-foreground" />
                                 <h4 className="font-medium">{location.name}</h4>
                               </div>
                               <p className="text-sm text-muted-foreground mb-2">{location.address}</p>
                             </div>
                           </div>
                          
                          {/* Total Redemptions */}
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="text-2xl font-bold text-primary">{location.total_redemptions || 0}</div>
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
                                <p className="text-sm text-muted-foreground mb-2">No active offer. 
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-0 h-auto ml-1"
                                    onClick={() => navigate('/offers')}
                                  >
                                    Add one!
                                  </Button>
                                </p>
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
                          
                          <Separator />
                          
                          {/* OfferX Toggle Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="text-sm font-medium">OfferX</div>
                                <div className="text-xs text-muted-foreground">
                                  $10/month
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleLocationOfferX(location.id, false)}
                                    className="text-destructive hover:text-destructive h-8"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={(checked) => handleOfferXToggle(location.id, checked)}
                                  disabled={processingSubscription === location.id}
                                />
                                {processingSubscription === location.id && (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                )}
                              </div>
                            </div>
                            
                            {isActive && (
                              <Badge variant="default" className="w-full justify-center bg-primary">
                                OfferX Active - Shows your offers only
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );

                    return location.posConnected ? (
                      <Tooltip key={location.id}>
                        <TooltipTrigger asChild>
                          {cardContent}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your point-of-sale at this store location is connected which means OfferX is available here!</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : cardContent;
                  })}
                </div>
              )}
              
              {activeLocations.size > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div>
                      <div className="font-medium">Total Monthly Subscription</div>
                      <div className="text-sm text-muted-foreground">
                        {activeLocations.size} location{activeLocations.size !== 1 ? 's' : ''} × $10/month
                      </div>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      ${totalMonthlyCost}/month
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* OfferX Activation Confirmation Dialog */}
          <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Activate OfferX?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Your payment method in{" "}
                    <button 
                      onClick={() => navigate('/billing')} 
                      className="text-primary hover:text-primary/80 underline font-medium"
                    >
                      Billing
                    </button>{" "}
                    will be charged <strong>$10 per month</strong> for running your offer on POS machines at this location, until cancelled.
                  </p>
                  <p>
                    You'll be able to see campaign results from your <strong>Partnerships & Offers</strong> tab on the dashboard.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelOfferXActivation}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmOfferXActivation}>
                  Activate OfferX
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DisplayOptionCheck
            open={showDisplayOptionCheck}
            onOpenChange={setShowDisplayOptionCheck}
            onConfirm={() => {
              if (pendingOfferXLocationId) {
                toggleLocationOfferX(pendingOfferXLocationId, true);
                setPendingOfferXLocationId(null);
              }
            }}
            title="Select Display Option"
            description="Before enrolling in OpenOffer, please select how you'll display partner offers."
          />
        </div>
      </AppLayout>
    </TooltipProvider>
  );
};

export default OfferX;