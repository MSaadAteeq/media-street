import { useState, useEffect } from "react";
import { Bot, MapPin, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
interface Location {
  id: string;
  name: string;
  address: string;
  currentOffer?: string;
  offerXActive?: boolean;
  openOfferActive?: boolean;
  activePartnerships: number;
  maxPartnerships: number;
  posConnected?: boolean;
}
const OfferAI = () => {
  const {
    toast
  } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingLocationId, setPendingLocationId] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [authorized, setAuthorized] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Use the same mock locations as shown in the store locations page
        const mockLocations: Location[] = [{
          id: "1",
          name: "Sally's Salon",
          address: "Sally's Salon Street 7, New York",
          currentOffer: "20% off all hair services",
          offerXActive: false,
          openOfferActive: true,
          activePartnerships: 3,
          maxPartnerships: 5,
          posConnected: true
        }, {
          id: "2",
          name: "Sally's Salon",
          address: "Sangam Cinema, Hilton Park, New York",
          currentOffer: "15% off first visit",
          offerXActive: false,
          openOfferActive: false,
          activePartnerships: 5,
          maxPartnerships: 5,
          posConnected: true
        }, {
          id: "3",
          name: "Sally's Salon",
          address: "Sally's Salon Street 56, New York",
          currentOffer: "Free consultation with any service",
          offerXActive: false,
          openOfferActive: false,
          activePartnerships: 2,
          maxPartnerships: 5,
          posConnected: true
        }];
        console.log('Loading mock locations:', mockLocations);
        setLocations(mockLocations);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, []);
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
      // Directly turn OFF without confirmation
      setLocations(prev => prev.map(location => location.id === locationId ? {
        ...location,
        openOfferActive: false
      } : location));
    }
  };
  const handleConfirmOpenOffer = () => {
    setLocations(prev => prev.map(location => location.id === pendingLocationId ? {
      ...location,
      openOfferActive: true
    } : location));
    setShowConfirmDialog(false);
    setPendingLocationId("");
    setSelectedBudget("");
    setAuthorized(false);
  };
  const handleCancelOpenOffer = () => {
    setShowConfirmDialog(false);
    setPendingLocationId("");
    setSelectedBudget("");
    setAuthorized(false);
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
            <h1 className="text-3xl font-bold tracking-tight">Open Offer</h1>
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

                  {/* Open Offer Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-muted-foreground">Open Offer</div>
                      <Switch checked={location.openOfferActive} onCheckedChange={checked => handleOpenOfferToggle(location.id, checked)} />
                    </div>
                  </div>
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
        </div>

        {/* PartnerAI Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Subscribe to Open Offer</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <div className="text-sm">Media Street will display your store's offer across the Open Offer network. Your store's partner carousel will show offers from other retailers in the Open Offer network.</div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox id="authorize" checked={authorized} onCheckedChange={checked => setAuthorized(checked === true)} />
                    <label htmlFor="authorize" className="text-sm leading-none cursor-pointer">I authorize Media Street to charge my billing method on file the $20/month subscription fee for Open Offer until turned off on this same page. </label>
                  </div>

                  <div className="text-sm">
                    You'll be able to see campaign results from your Partnerships & Offers tab on the dashboard.
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelOpenOffer}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmOpenOffer} disabled={!authorized}>
                Subscribe
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </AppLayout>;
};
export default OfferAI;