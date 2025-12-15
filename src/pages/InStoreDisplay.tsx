import { useState, useEffect, useRef } from "react";
import { Monitor, Maximize, Minimize, Tablet } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  offerLocationId?: string; // Original offer location ID for impression tracking
}

const InStoreDisplay = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [offersAds, setOffersAds] = useState<OfferAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
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
  const trackedImpressions = useRef<Set<string>>(new Set()); // Track which offers have been viewed

  // Track impressions when carousel slide changes (only once per offer)
  const trackImpression = async (item: OfferAd) => {
    if (!selectedLocationId || !item.id || !item.offerLocationId) return;
    
    // Create unique key for this impression
    const impressionKey = `${item.id}-${selectedLocationId}`;
    
    // Skip if already tracked
    if (trackedImpressions.current.has(impressionKey)) {
      return;
    }
    
    // Mark as tracked
    trackedImpressions.current.add(impressionKey);
    
    try {
      const { post } = await import("@/services/apis");
      await post({
        end_point: 'impressions',
        body: {
          offerId: item.id,
          locationId: item.offerLocationId, // Original offer location
          displayLocationId: selectedLocationId, // Where it's being displayed
          impressionType: 'carousel'
        },
        token: false // Public endpoint
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Error tracking impression:', error);
      // Remove from tracked set on error so it can be retried
      trackedImpressions.current.delete(impressionKey);
    }
  };

  // Set up carousel API and track impressions
  useEffect(() => {
    if (!api) {
      return;
    }

    const currentIndex = api.selectedScrollSnap();
    
    // Track impression for initial offer
    if (offersAds[currentIndex]) {
      trackImpression(offersAds[currentIndex]);
    }

    api.on("select", () => {
      const selectedIndex = api.selectedScrollSnap();
      if (offersAds[selectedIndex]) {
        trackImpression(offersAds[selectedIndex]);
      }
    });
  }, [api, offersAds, selectedLocationId]);

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
        
        // Find the first location with active ads, or default to first location
        if (formattedLocations.length > 0) {
          let selectedId = formattedLocations[0].id; // Default to first
          
          // Check each location for active offers
          for (const location of formattedLocations) {
            try {
              const ownerResponse = await get({ 
                end_point: `offers/location/${location.id}/owner`,
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
                
                if (activeOwnerOffers.length > 0) {
                  // Check if this location has partner offers
                  try {
                    const partnerResponse = await get({ 
                      end_point: `offers/location/${location.id}/partners`,
                      token: false
                    });
                    
                    if (partnerResponse.success && partnerResponse.data && partnerResponse.data.length > 0) {
                      const now = new Date();
                      const activePartnerOffers = partnerResponse.data.filter((offer: any) => {
                        const isActive = offer.is_active !== false && offer.isActive !== false;
                        const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                          (offer.expires_at && new Date(offer.expires_at) > now) ||
                          (offer.expiresAt && new Date(offer.expiresAt) > now);
                        return isActive && isNotExpired;
                      });
                      
                      if (activePartnerOffers.length > 0) {
                        selectedId = location.id;
                        break; // Found location with ads, use it
                      }
                    }
                  } catch (e) {
                    // Continue checking other locations
                  }
                }
              }
            } catch (e) {
              // Continue checking other locations
            }
          }
          
          setSelectedLocationId(selectedId);
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
    if (!locationId) {
      setOffersAds([]);
      return;
    }
    
    setLoadingOffers(true);
    try {
      const { get } = await import("@/services/apis");
      
      // Check if displayCarousel is selected
      const displayCarousel = localStorage.getItem('displayCarousel') === 'true';
      
      if (!displayCarousel) {
        // If carousel not selected, show empty state or message
        setOffersAds([]);
        setLoadingOffers(false);
        return;
      }

      // First, check if location owner has an active offer - carousel only active if owner has offer
      let locationHasActiveOffer = false;
      try {
        console.log(`🔍 Checking owner offers for location: ${locationId}`);
        const ownerResponse = await get({ 
          end_point: `offers/location/${locationId}/owner`,
          token: false
        });
        
        console.log(`📦 Owner offers response:`, ownerResponse);
        
        if (ownerResponse.success && ownerResponse.data && ownerResponse.data.length > 0) {
          console.log(`📋 Raw owner offers data:`, ownerResponse.data);
          const now = new Date();
          const activeOwnerOffers = ownerResponse.data.filter((offer: any) => {
            const isActive = offer.is_active !== false && offer.isActive !== false;
            const isNotExpired = !offer.expires_at && !offer.expiresAt || 
              (offer.expires_at && new Date(offer.expires_at) > now) ||
              (offer.expiresAt && new Date(offer.expiresAt) > now);
            console.log(`  Offer ${offer._id || offer.id}: isActive=${isActive}, isNotExpired=${isNotExpired}, expiresAt=${offer.expires_at || offer.expiresAt}`);
            return isActive && isNotExpired;
          });
          locationHasActiveOffer = activeOwnerOffers.length > 0;
          console.log(`✅ Location has ${activeOwnerOffers.length} active owner offers (out of ${ownerResponse.data.length} total)`);
        } else {
          console.log(`⚠️ No owner offers found for location ${locationId}. Response:`, ownerResponse);
        }
      } catch (error) {
        console.error('❌ Error fetching location owner offers:', error);
      }
      
      // If location owner doesn't have an active offer, don't show carousel
      if (!locationHasActiveOffer) {
        console.log(`⚠️ Location owner doesn't have active offer, skipping carousel`);
        setOffersAds([]);
        setLoadingOffers(false);
        return;
      }

      // Load approved partner offers for this location (from retailers with approved partnerships)
      let partnerOffersData: any[] = [];
      try {
        console.log(`🔍 Fetching partner offers for location: ${locationId}`);
        const partnerResponse = await get({ 
          end_point: `offers/location/${locationId}/partners`,
          token: false
        });
        
        console.log(`📦 Partner offers API response:`, partnerResponse);
        
        if (partnerResponse.success && partnerResponse.data) {
          console.log(`✅ Found ${partnerResponse.data.length} partner offers`);
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
              validUntil: offer.expires_at || offer.expiresAt || "∞",
              offerLocationId: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || ''
            }));
          
          console.log(`✅ Processed ${partnerOffersData.length} active partner offers`);
        } else {
          console.log(`⚠️ No partner offers found in response`);
        }
      } catch (error) {
        console.error('❌ Error fetching partner offers:', error);
      }

      // Load subscribed open offers from backend API (only offers the location owner has subscribed to)
      let nearbyOpenOffers: any[] = [];
      try {
        const response = await get({ 
          end_point: `offers/location/${locationId}/subscribed-open`,
          token: false
        });
        
        if (response.success && response.data) {
          // Backend already filters for active, non-expired, subscribed open offers
          nearbyOpenOffers = response.data.map((offer: any) => ({
            id: offer._id?.toString() || offer.id?.toString() || '',
            type: "offer" as const,
            title: offer.callToAction || offer.call_to_action || '',
            description: "Open Offer",
            image: offer.offer_image || offer.offerImage || posFlowersImage, // Use different image for open offers
            partner: offer.user?.fullName || offer.userId?.fullName || null,
            validUntil: offer.expires_at || offer.expiresAt || "7 days",
            offerLocationId: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching subscribed open offers:', error);
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
    } finally {
      setLoadingOffers(false);
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

        {/* Location Selector */}
        {locations.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="location-select" className="text-sm font-medium whitespace-nowrap">
                  Select Location:
                </Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(value) => setSelectedLocationId(value)}
                >
                  <SelectTrigger id="location-select" className="w-full max-w-md">
                    <SelectValue placeholder="Select a location" />
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
        )}

        {/* Carousel Display */}
        {localStorage.getItem('displayCarousel') === 'true' ? (
          loadingOffers ? (
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video w-full relative overflow-hidden rounded-lg">
                  <Skeleton className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground">Loading offers for this location...</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : offersAds.length > 0 ? (
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
                          {/* QR Code in top right corner - points to location carousel */}
                          <div className="absolute top-12 right-12 bg-white p-4 rounded-lg shadow-lg">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/carousel/${selectedLocationId}`)}`}
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
