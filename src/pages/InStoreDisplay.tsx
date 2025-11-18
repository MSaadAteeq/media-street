import { useState, useEffect, useRef } from "react";
import { Monitor, Maximize, Minimize, Tablet } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// Supabase removed - will use Node.js API
import { shuffleArray } from "@/utils/distance";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

// Import campaign images
import posCoffeeImage from "@/assets/pos-campaign-coffee.jpg";
import posSalonImage from "@/assets/pos-campaign-salon.jpg";
import posFlowersImage from "@/assets/pos-campaign-flowers.jpg";
import posSubsImage from "@/assets/pos-campaign-subs.jpg";
import mediaStreetLogo from "@/assets/media-street-logo.png";

interface Location {
  id: string;
  name: string;
  address: string;
}

interface OfferAd {
  id: string;
  type: "offer" | "ad";
  title: string;
  description: string;
  image: string;
  partner?: string;
  validUntil?: string;
}

const InStoreDisplay = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [offersAds, setOffersAds] = useState<OfferAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTabletDialog, setShowTabletDialog] = useState(false);
  const [tabletRequestData, setTabletRequestData] = useState({
    locationId: "",
    transactionsPerDay: ""
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    if (carouselRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        carouselRef.current.requestFullscreen();
      }
    }
  };

  const handleTabletRequest = async () => {
    if (!tabletRequestData.locationId || !tabletRequestData.transactionsPerDay) {
      toast.error("Please fill in all required fields");
      return;
    }

    const selectedLocation = locations.find(loc => loc.id === tabletRequestData.locationId);
    if (!selectedLocation) {
      toast.error("Please select a valid location");
      return;
    }

    setSubmittingRequest(true);
    try {
      // TODO: Replace with Node.js API call
      // await post({ 
      //   end_point: 'tablet/request', 
      //   body: {
      //     storeName: selectedLocation.name,
      //     storeAddress: selectedLocation.address,
      //     transactionsPerDay: tabletRequestData.transactionsPerDay
      //   }
      // });

      setRequestSubmitted(true);
      toast.success("Request submitted successfully!");
    } catch (error) {
      console.error('Error submitting tablet request:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const resetTabletDialog = () => {
    setShowTabletDialog(false);
    setRequestSubmitted(false);
    setTabletRequestData({
      locationId: "",
      transactionsPerDay: ""
    });
  };

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    if (!api) {
      return;
    }

    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [api]);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadOffersAds(selectedLocationId);
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    // Mock locations data
    const mockLocations: Location[] = [
      {
        id: "1",
        name: "Sally's Salon",
        address: "Sally's Salon Street 7, New York"
      },
      {
        id: "2",
        name: "Sally's Salon",
        address: "Sangam Cinema, Hilton Park, New York"
      },
      {
        id: "3",
        name: "Sally's Salon",
        address: "Sally's Salon Street 56, New York"
      }
    ];

    setLocations(mockLocations);
    if (mockLocations.length > 0) {
      setSelectedLocationId(mockLocations[0].id);
    }
    setLoading(false);
  };

  const loadOffersAds = async (locationId: string) => {
    try {
      const { data: locationData } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .maybeSingle();

      if (!locationData) return;

      // Check for Open Offer subscription
      const { data: openOfferSub } = await supabase
        .from('offerx_subscriptions')
        .select('*')
        .eq('user_id', locationData.user_id)
        .eq('is_active', true)
        .maybeSingle();

      // Load partner offers
      const { data: partnerData } = await supabase
        .from('offers')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true);

      // Randomize partners
      const randomizedPartners = shuffleArray(partnerData || []);

      let nearbyOffers: any[] = [];

      // If Open Offer subscribed, load nearby offers
      if (openOfferSub) {
        const { data: openOfferSubs } = await supabase
          .from('offerx_subscriptions')
          .select('user_id')
          .eq('is_active', true)
          .neq('user_id', locationData.user_id)
          .limit(10);

        if (openOfferSubs) {
          const userIds = openOfferSubs.map(s => s.user_id);
          const { data: locations } = await supabase
            .from('locations')
            .select('id')
            .in('user_id', userIds);

          if (locations) {
            const { data: offers } = await supabase
              .from('offers')
              .select('*')
              .in('location_id', locations.map(l => l.id))
              .eq('is_active', true)
              .limit(10);

            nearbyOffers = offers || [];
          }
        }
      }

      // If no partner offers or open offers, load default advertiser campaigns
      let defaultCampaigns: any[] = [];
      if (randomizedPartners.length === 0 && nearbyOffers.length === 0) {
        const { data: campaignData } = await supabase
          .from('campaign_retailers' as any)
          .select(`
            campaigns (
              id,
              call_to_action,
              brand_logo_url,
              campaign_image_url,
              website,
              expiration_date
            )
          `)
          .eq('location_id', locationId)
          .eq('is_default_fallback', true);

        if (campaignData) {
          defaultCampaigns = campaignData
            .filter((cr: any) => cr.campaigns)
            .map((cr: any) => cr.campaigns);
        }
      }

      // Mock data for display - will be replaced with real data
      const mockOffersAds: OfferAd[] = [
        ...randomizedPartners.slice(0, 2).map((p, i) => ({
          id: p.id,
          type: "offer" as const,
          title: p.call_to_action,
          description: "Partner offer",
          image: i === 0 ? posSalonImage : posCoffeeImage,
          validUntil: "∞"
        })),
        ...nearbyOffers.slice(0, 2).map((o, i) => ({
          id: o.id,
          type: "offer" as const,
          title: o.call_to_action,
          description: "Nearby Open Offer",
          image: i === 0 ? posFlowersImage : posSubsImage,
          partner: o.business_name,
          validUntil: "7 days"
        })),
        ...defaultCampaigns.map((c: any) => ({
          id: c.id,
          type: "ad" as const,
          title: c.call_to_action,
          description: "Advertisement",
          image: c.campaign_image_url || posCoffeeImage,
          validUntil: c.expiration_date ? new Date(c.expiration_date).toLocaleDateString() : "∞"
        }))
      ];

      setOffersAds(mockOffersAds);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Partner Carousel" pageIcon={<Monitor className="h-6 w-6 text-primary" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Partner Carousel" pageIcon={<Monitor className="h-6 w-6 text-primary" />}>
      <div className="space-y-6">
        {/* Location Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Location:</label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold">In-Store Display Mode</h3>
                <p className="text-sm text-muted-foreground">
                  This carousel is designed to run on a tablet in your store. Offers and ads will automatically rotate every 10 seconds. Individual offers can be printed on your Partner Network page.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowTabletDialog(true)}
                  className="ml-4"
                >
                  <Tablet className="h-5 w-5 mr-2" />
                  Request a FREE Tablet
                </Button>
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={handleFullscreen}
                >
                  <Maximize className="h-5 w-5 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carousel Display */}
        {offersAds.length > 0 ? (
          <div ref={carouselRef} className="relative bg-background rounded-lg">
            {isFullscreen && (
              <Button
                variant="secondary"
                size="icon"
                onClick={handleFullscreen}
                className="absolute top-4 left-4 z-50 h-12 w-12"
              >
                <Minimize className="h-6 w-6" />
              </Button>
            )}
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {offersAds.map((item) => (
                  <CarouselItem key={item.id}>
                    <Card className="border-2">
                      <CardContent className="p-0">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {/* QR Code in top right corner */}
                          <div className="absolute top-12 right-12 bg-white p-4 rounded-lg shadow-lg">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://offerave.com/offer/${item.id}`)}`}
                              alt="QR Code"
                              className="w-38 h-38"
                            />
                          </div>
                          {/* Media Street logo in top left corner */}
                          <div className="absolute top-4 left-4 bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                            <img 
                              src={mediaStreetLogo}
                              alt="Media Street"
                              className="h-8"
                            />
                            <span className="text-sm font-semibold text-gray-800">Partner offers by Media Street</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-4">
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                  item.type === "ad" ? "bg-primary" : "bg-green-500"
                                }`}>
                                  {item.type === "ad" ? "Advertisement" : "Partner Offer"}
                                </span>
                                {item.partner && (
                                  <span className="text-sm opacity-90">from {item.partner}</span>
                                )}
                              </div>
                              <h2 className="text-5xl font-bold">{item.title}</h2>
                              <p className="text-2xl opacity-90">{item.description}</p>
                              {item.validUntil && (
                                <p className="text-lg opacity-75">Valid: {item.validUntil}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 h-16 w-16" />
              <CarouselNext className="right-4 h-16 w-16" />
            </Carousel>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No active offers or ads for this location</p>
            </CardContent>
          </Card>
        )}

        {/* Tablet Request Dialog */}
        <Dialog open={showTabletDialog} onOpenChange={setShowTabletDialog}>
          <DialogContent className="sm:max-w-[500px]">
            {!requestSubmitted ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tablet className="h-5 w-5" />
                    Request a FREE Tablet
                  </DialogTitle>
                  <DialogDescription>
                    Fill out the form below and we'll review your request for a free tablet to display Media Street partner offers in your store.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Store Location *</Label>
                    <Select
                      value={tabletRequestData.locationId}
                      onValueChange={(value) => setTabletRequestData({...tabletRequestData, locationId: value})}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select store location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} - {location.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transactions">Estimated Transactions/Day *</Label>
                    <Select
                      value={tabletRequestData.transactionsPerDay}
                      onValueChange={(value) => setTabletRequestData({...tabletRequestData, transactionsPerDay: value})}
                    >
                      <SelectTrigger id="transactions">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-10">0-10</SelectItem>
                        <SelectItem value="10-50">10-50</SelectItem>
                        <SelectItem value="51-100">51-100</SelectItem>
                        <SelectItem value="101-200">101-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTabletDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTabletRequest} disabled={submittingRequest}>
                    {submittingRequest ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <Tablet className="h-5 w-5" />
                    Request Submitted!
                  </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                  <p className="text-center text-muted-foreground">
                    Thanks! We will review your request and if approved you'll be notified that a free tablet is on the way from Media Street.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={resetTabletDialog}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default InStoreDisplay;
