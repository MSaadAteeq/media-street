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
import { useNavigate } from "react-router-dom";
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

// Image mapping:
// posSalonImage - Location owner's own offers
// posCoffeeImage - Partner offers
// posFlowersImage - Open offers (subscribed)

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
  const navigate = useNavigate();
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
    try {
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response.success && response.data) {
        const formattedLocations = response.data
          .filter((loc: any) => loc && (loc._id || loc.id))
          .map((loc: any) => ({
            id: loc._id?.toString() || loc.id?.toString(),
            name: loc.name || 'Unnamed Location',
            address: loc.address || ''
          }));
        setLocations(formattedLocations);
        if (formattedLocations.length > 0) {
          setSelectedLocationId(formattedLocations[0].id);
        }
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOffersAds = async (locationId: string) => {
    try {
      const { get } = await import("@/services/apis");
      
      // Check if displayCarousel is selected
      const displayCarousel = localStorage.getItem('displayCarousel') === 'true';
      
      if (!displayCarousel) {
        // If carousel not selected, show empty state or message
        setOffersAds([]);
        return;
      }

      // First, check if location owner has an active offer - carousel only active if owner has offer
      let locationHasActiveOffer = false;
      try {
        const ownerResponse = await get({ 
          end_point: `offers/location/${locationId}/owner`,
          token: false
        });
        
        if (ownerResponse.success && ownerResponse.data && ownerResponse.data.length > 0) {
          const now = new Date();
          const activeOwnerOffers = ownerResponse.data.filter((offer: any) => {
            const isActive = offer.is_active !== false && offer.isActive !== false;
            const isNotExpired = !offer.expires_at && !offer.expiresAt || 
              (offer.expires_at && new Date(offer.expires_at) > now) ||
              (offer.expiresAt && new Date(offer.expiresAt) > now);
            return isActive && isNotExpired;
          });
          locationHasActiveOffer = activeOwnerOffers.length > 0;
        }
      } catch (error) {
        console.error('Error fetching location owner offers:', error);
      }
      
      // If location owner doesn't have an active offer, don't show carousel
      if (!locationHasActiveOffer) {
        setOffersAds([]);
        return;
      }

      // Load approved partner offers for this location (from retailers with approved partnerships)
      let partnerOffersData: any[] = [];
      try {
        const partnerResponse = await get({ 
          end_point: `offers/location/${locationId}/partners`,
          token: false
        });
        
        if (partnerResponse.success && partnerResponse.data) {
          // Filter: Only show active, non-expired offers from approved partnerships
          const now = new Date();
          partnerOffersData = partnerResponse.data
            .filter((offer: any) => {
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              return isActive && isNotExpired;
            })
            .map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              type: "offer" as const,
              title: offer.callToAction || offer.call_to_action || '',
              description: "Partner Offer",
              image: offer.offer_image || offer.offerImage || posCoffeeImage, // Use different image for partner offers
              partner: offer.user?.fullName || offer.userId?.fullName || null,
              validUntil: offer.expires_at || offer.expiresAt || "∞"
            }));
        }
      } catch (error) {
        console.error('Error fetching partner offers:', error);
      }

      // Load open offers from backend API (available to all retailers)
      let nearbyOpenOffers: any[] = [];
      try {
        const response = await get({ 
          end_point: 'offers/open',
          token: false
        });
        
        if (response.success && response.data) {
          // Filter: Only show active, non-expired open offers
          const now = new Date();
          nearbyOpenOffers = response.data
            .filter((offer: any) => {
              const isOpenOffer = offer.is_open_offer || offer.isOpenOffer;
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              return isOpenOffer && isActive && isNotExpired;
            })
            .map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              type: "offer" as const,
              title: offer.callToAction || offer.call_to_action || '',
              description: "Open Offer",
              image: offer.offer_image || offer.offerImage || posFlowersImage, // Use different image for open offers
              partner: offer.user?.fullName || offer.userId?.fullName || null,
              validUntil: offer.expires_at || offer.expiresAt || "7 days"
            }));
        }
      } catch (error) {
        console.error('Error fetching open offers:', error);
      }
      
      // Combine: Partner offers first, then open offers, then back to partner offers (rotation)
      // This creates a rotation: Partner -> Open -> Partner -> Open...
      const allOffersAds: OfferAd[] = [];
      
      // Interleave partner offers and open offers for rotation
      const maxLength = Math.max(partnerOffersData.length, nearbyOpenOffers.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < partnerOffersData.length) {
          allOffersAds.push(partnerOffersData[i]);
        }
        if (i < nearbyOpenOffers.length) {
          allOffersAds.push(nearbyOpenOffers[i]);
        }
      }
      
      // If we have more of one type, add remaining at the end
      if (partnerOffersData.length > nearbyOpenOffers.length) {
        allOffersAds.push(...partnerOffersData.slice(nearbyOpenOffers.length));
      } else if (nearbyOpenOffers.length > partnerOffersData.length) {
        allOffersAds.push(...nearbyOpenOffers.slice(partnerOffersData.length));
      }

      setOffersAds(allOffersAds);
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffersAds([]);
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
        {localStorage.getItem('displayCarousel') === 'true' ? (
          offersAds.length > 0 ? (
            <div ref={carouselRef} className={`relative bg-background rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
              {isFullscreen && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleFullscreen}
                  className="absolute top-4 right-4 z-50 h-12 w-12 bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                className={`w-full ${isFullscreen ? 'h-screen' : ''}`}
              >
              <CarouselContent className={isFullscreen ? 'h-screen' : ''}>
                {offersAds.map((item) => (
                  <CarouselItem key={item.id} className={isFullscreen ? 'h-screen' : ''}>
                    <Card className={`border-2 ${isFullscreen ? 'h-full border-0 rounded-none' : ''}`}>
                      <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
                        <div className={`relative ${isFullscreen ? 'w-full h-full' : 'aspect-video w-full'} overflow-hidden ${isFullscreen ? '' : 'rounded-lg'}`}>
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {/* QR Code in top right corner */}
                          <div className="absolute top-12 right-12 bg-white p-4 rounded-lg shadow-lg">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/redeem/${item.id}`)}`}
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
              <CarouselPrevious className={`left-4 h-16 w-16 ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : ''}`} />
              <CarouselNext className={`right-4 h-16 w-16 ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : ''}`} />
            </Carousel>
          </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active partner offers for this location. Partner offers will appear here once you have approved partnerships.</p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Please select "Display Partner Carousel" in the display options to view partner offers.</p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
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
