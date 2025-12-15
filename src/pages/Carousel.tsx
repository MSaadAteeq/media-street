import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import posSalonImage from "@/assets/pos-campaign-salon.jpg";
import posCoffeeImage from "@/assets/pos-campaign-coffee.jpg";
import posFlowersImage from "@/assets/pos-campaign-flowers.jpg";
import { useToast } from "@/components/ui/use-toast";
import { calculateDistance, shuffleArray } from "@/utils/distance";
import {
  Carousel as UICarousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface Offer {
  id: string;
  call_to_action: string;
  offer_image_url: string | null;
  brand_logo_url: string | null;
  redemption_start_date: string;
  redemption_end_date: string;
  location_id: string;
  location_name?: string; // Original offer location name
  location_address?: string; // Original offer location address
  business_name?: string;
  distance?: number;
  redemption_code?: string;
  coupon_code?: string;
  is_partner_offer?: boolean;
  is_open_offer?: boolean;
  is_owner_offer?: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  user_id?: string;
}

const Carousel = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFullScreenIndex, setCurrentFullScreenIndex] = useState<number | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [partnerOffers, setPartnerOffers] = useState<Offer[]>([]);
  const [ownerOffers, setOwnerOffers] = useState<Offer[]>([]);
  const [hasActiveOffer, setHasActiveOffer] = useState(false);
  const [couponCodes, setCouponCodes] = useState<{ [offerId: string]: string }>({});
  const [generatingCoupon, setGeneratingCoupon] = useState<{ [offerId: string]: boolean }>({});
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const trackedImpressions = useRef<Set<string>>(new Set()); // Track which offers have been viewed

  useEffect(() => {
    if (locationId) {
      loadLocationAndOffers();
    }
  }, [locationId]);

  // Track impressions when carousel slide changes
  const trackImpression = async (offer: Offer) => {
    if (!locationId || !offer.id || !offer.location_id) return;
    
    try {
      const { post } = await import("@/services/apis");
      await post({
        end_point: 'impressions',
        body: {
          offerId: offer.id,
          locationId: offer.location_id, // Original offer location
          displayLocationId: locationId, // Where it's being displayed
          impressionType: 'carousel'
        },
        token: false // Public endpoint
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Error tracking impression:', error);
    }
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    const currentIndex = api.selectedScrollSnap();
    setCurrent(currentIndex + 1);
    
    // Track impression for initial offer
    if (allOffers[currentIndex]) {
      trackImpression(allOffers[currentIndex]);
    }

    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex + 1);
      
      // Track impression when slide changes
      if (allOffers[newIndex]) {
        trackImpression(allOffers[newIndex]);
      }
    });
  }, [api, allOffers, locationId]);

  const loadLocationAndOffers = async () => {
    try {
      setLoading(true);

      // Fetch location from backend API (public endpoint for QR codes)
      const { get } = await import("@/services/apis");
      let locationData: Location | null = null;
      try {
        const locationResponse = await get({ 
          end_point: `locations/public/${locationId}`,
          token: false // Public endpoint for QR codes
        });
        
        if (locationResponse.success && locationResponse.data) {
          locationData = {
            id: locationResponse.data._id?.toString() || locationResponse.data.id?.toString() || locationId,
            name: locationResponse.data.name || 'Unknown Location',
            address: locationResponse.data.address || '',
            latitude: locationResponse.data.latitude,
            longitude: locationResponse.data.longitude,
            user_id: locationResponse.data.userId?.toString() || locationResponse.data.user_id?.toString()
          };
          setLocation(locationData);
        } else {
          throw new Error('Location not found');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocation(null);
        return;
      }
      
      // First, check if location owner has an active offer - carousel only active if owner has offer
      let ownerOffersData: Offer[] = [];
      let locationHasActiveOffer = false;
      try {
        const ownerResponse = await get({ 
          end_point: `offers/location/${locationId}/owner`,
          token: false // Public endpoint
        });
        
        if (ownerResponse.success && ownerResponse.data && ownerResponse.data.length > 0) {
          const now = new Date();
          ownerOffersData = ownerResponse.data
            .filter((offer: any) => {
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              return isActive && isNotExpired;
            })
            .map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              location_name: offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || 'Unknown Location',
              is_partner_offer: false,
              is_open_offer: false,
              is_owner_offer: true, // Mark as owner's own offer
              offer_image_url: offer.offer_image || offer.offerImage || posSalonImage, // Use different image for owner offers
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              business_name: offer.user?.fullName || offer.userId?.fullName || null,
              redemption_code: offer.redemptionCode || offer.redemption_code || null
            }));
          
          locationHasActiveOffer = ownerOffersData.length > 0;
        }
      } catch (error) {
        console.error('Error fetching location owner offers:', error);
      }
      
      // If location owner doesn't have an active offer, don't show carousel
      if (!locationHasActiveOffer) {
        setHasActiveOffer(false);
        setAllOffers([]);
        setPartnerOffers([]);
        setOwnerOffers([]);
        setLoading(false);
        return;
      }
      
      setHasActiveOffer(true);
      setOwnerOffers(ownerOffersData);
      
      // Load approved partner offers for this location (from retailers with approved partnerships)
      let partnerOffers: Offer[] = [];
      try {
        const partnerResponse = await get({ 
          end_point: `offers/location/${locationId}/partners`,
          token: false // Public endpoint
        });
        
        if (partnerResponse.success && partnerResponse.data) {
          // Filter: Only show active, non-expired offers
          const now = new Date();
          partnerOffers = partnerResponse.data
            .filter((offer: any) => {
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              return isActive && isNotExpired;
            })
            .map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              location_name: offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || 'Unknown Location',
              location_address: offer.locations?.[0]?.address || offer.locationIds?.[0]?.address || '',
              is_partner_offer: true,
              is_open_offer: false,
              is_owner_offer: false,
              offer_image_url: offer.offer_image || offer.offerImage || posCoffeeImage, // Use different image for partner offers
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              business_name: offer.user?.fullName || offer.userId?.fullName || null,
              redemption_code: offer.redemptionCode || offer.redemption_code || null
            }));
        }
      } catch (error) {
        console.error('Error fetching partner offers:', error);
        partnerOffers = [];
      }

      // Load subscribed open offers from backend API (only offers the location owner has subscribed to)
      let nearbyOpenOffers: Offer[] = [];
      try {
        const response = await get({ 
          end_point: `offers/location/${locationId}/subscribed-open`,
          token: false // Public endpoint
        });
        
        if (response.success && response.data) {
          // Backend already filters for active, non-expired, subscribed open offers
          nearbyOpenOffers = response.data.map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              location_name: offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || 'Unknown Location',
              location_address: offer.locations?.[0]?.address || offer.locationIds?.[0]?.address || '',
              is_partner_offer: false,
              is_open_offer: true,
              is_owner_offer: false,
              offer_image_url: offer.offer_image || offer.offerImage || posFlowersImage, // Use different image for open offers
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              business_name: offer.user?.fullName || offer.userId?.fullName || null,
              redemption_code: offer.redemptionCode || offer.redemption_code || null
            }));
        }
      } catch (error) {
        console.error('Error fetching open offers:', error);
        nearbyOpenOffers = [];
      }
      
      const defaultCampaigns: Offer[] = [];

      // Combine offers: Only partner offers and open offers (NOT owner's own offers)
      // Owner's own offers are for displaying on OTHER retailers, not for this location's carousel
      const combinedOffers: Offer[] = [
        ...partnerOffers,   // Partner offers
        ...nearbyOpenOffers // Open offers
      ];

      setAllOffers(combinedOffers);
      setPartnerOffers(partnerOffers);
      setOwnerOffers(ownerOffersData);

      // Auto-generate coupon codes for all offers on load
      combinedOffers.forEach((offer) => {
        if (offer.redemption_code && !couponCodes[offer.id]) {
          generateCouponCode(offer);
        }
      });

    } catch (error) {
      console.error('Error loading carousel data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle full screen navigation - navigate through all offers (partner + open)
  const handleNextFullScreen = () => {
    if (currentFullScreenIndex !== null && allOffers.length > 0) {
      const nextIndex = (currentFullScreenIndex + 1) % allOffers.length;
      setCurrentFullScreenIndex(nextIndex);
    }
  };

  const handlePrevFullScreen = () => {
    if (currentFullScreenIndex !== null && allOffers.length > 0) {
      const prevIndex = currentFullScreenIndex === 0 ? allOffers.length - 1 : currentFullScreenIndex - 1;
      setCurrentFullScreenIndex(prevIndex);
    }
  };

  const handleCloseFullScreen = () => {
    setShowFullScreen(false);
    setCurrentFullScreenIndex(null);
  };

  const handleRedeemOffer = (offerId: string) => {
    // Navigate to redemption flow
    window.location.href = `/redeem?offer=${offerId}`;
  };

  const generateCouponCode = async (offer: Offer) => {
    if (!offer.id || !offer.redemption_code) {
      toast({
        title: "Error",
        description: "Offer information is missing. Cannot generate coupon code.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingCoupon(prev => ({ ...prev, [offer.id]: true }));
    try {
      const { post } = await import("@/services/apis");
      const response = await post({
        end_point: 'redemptions/public',
        body: {
          offerId: offer.id,
          redemptionCode: offer.redemption_code
          // Don't send locationId - it's not needed for generating coupon codes
          // locationId is only needed when redeeming at the store
        },
        token: false // Public endpoint
      });

      if (response.success && response.data?.couponCode) {
        setCouponCodes(prev => ({
          ...prev,
          [offer.id]: response.data.couponCode
        }));
        toast({
          title: "Coupon Code Generated!",
          description: `Your unique coupon code: ${response.data.couponCode}`,
          duration: 5000
        });
      } else {
        throw new Error(response.message || 'Failed to generate coupon code');
      }
    } catch (error: any) {
      console.error('Error generating coupon code:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to generate coupon code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingCoupon(prev => ({ ...prev, [offer.id]: false }));
    }
  };

  const partnerCount = allOffers.filter(o => o.is_partner_offer).length;
  const openOfferCount = allOffers.filter(o => o.is_open_offer).length;

  // Get current full screen offer - from all offers (partner + open)
  const currentFullScreenOffer = currentFullScreenIndex !== null && allOffers.length > 0 
    ? allOffers[currentFullScreenIndex] 
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">Location Not Found</h2>
          <p className="text-muted-foreground">This QR code may be invalid or expired.</p>
        </Card>
      </div>
    );
  }

  // If location owner doesn't have an active offer, show message
  if (!hasActiveOffer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Active Offers</h2>
          <p className="text-muted-foreground">This location doesn't have any active offers yet. Please create an offer to display the carousel.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Full Screen Partner Offer Display */}
      {showFullScreen && currentFullScreenOffer && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseFullScreen}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {allOffers.length > 1 && (
              <>
                <button
                  onClick={handlePrevFullScreen}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextFullScreen}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Offer Type Badge */}
            <div className="absolute top-4 left-4 z-10">
              {currentFullScreenOffer.is_owner_offer && (
                <Badge className="bg-blue-500 text-white">Your Offer</Badge>
              )}
              {currentFullScreenOffer.is_partner_offer && (
                <Badge className="bg-green-500 text-white">Partner Offer</Badge>
              )}
              {currentFullScreenOffer.is_open_offer && (
                <Badge className="bg-purple-500 text-white">Open Offer</Badge>
              )}
            </div>

            {/* Offer Image */}
            {currentFullScreenOffer.offer_image_url ? (
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={currentFullScreenOffer.offer_image_url}
                  alt={currentFullScreenOffer.call_to_action}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white text-center px-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">{currentFullScreenOffer.call_to_action}</h2>
                  {currentFullScreenOffer.business_name && (
                    <p className="text-xl text-gray-300">{currentFullScreenOffer.business_name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Offer Info Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8 text-white">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-2">{currentFullScreenOffer.call_to_action}</h2>
                {currentFullScreenOffer.business_name && (
                  <p className="text-lg text-gray-300 mb-2">{currentFullScreenOffer.business_name}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Valid until {new Date(currentFullScreenOffer.redemption_end_date).toLocaleDateString()}</span>
                  </div>
                  {currentFullScreenOffer.is_partner_offer && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                      Partner Offer
                    </Badge>
                  )}
                  {currentFullScreenOffer.is_open_offer && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Open Offer
                    </Badge>
                  )}
                </div>
                 {allOffers.length > 1 && (
                   <div className="mt-4 text-sm text-gray-400">
                     {currentFullScreenIndex! + 1} of {allOffers.length}
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={mediaStreetLogo} 
              alt="Media Street" 
              className="h-10 w-auto"
            />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{location.name}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                <MapPin className="h-3 w-3" />
                {location.address.split(',')[1]?.trim() || location.address}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Offer Summary */}
      <div className="container mx-auto px-4 py-6">
        {allOffers.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-medium">{partnerCount} Partner Offers</span>
              </div>
              {openOfferCount > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{openOfferCount} Open Offer Deals</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Full-Screen Carousel - No Cards */}
        {allOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No offers available</p>
              <p className="text-sm">
                This location has not set up any offers yet. Check back soon!
              </p>
            </div>
          </Card>
        ) : (
          <div className="w-full max-w-6xl mx-auto">
            <UICarousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {allOffers.map((offer, index) => {
                  const couponCode = couponCodes[offer.id];
                  const isGenerating = generatingCoupon[offer.id] || false;
                  return (
                    <CarouselItem key={offer.id} className="pl-2 md:pl-4 basis-full">
                      <div className="relative w-full h-[70vh] md:h-[80vh] rounded-lg overflow-hidden bg-background border-2 border-border">
                        {/* Offer Image - Full Screen */}
                        {offer.offer_image_url ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={offer.offer_image_url} 
                              alt={offer.call_to_action}
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            
                            {/* Badge */}
                            <div className="absolute top-4 right-4 z-10">
                              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                {offer.is_partner_offer ? 'Partner Offer' : 'Open Offer'}
                              </Badge>
                            </div>

                            {/* Offer Counter */}
                            <div className="absolute top-4 left-4 z-10 text-white text-sm font-medium">
                              {index + 1} of {allOffers.length}
                            </div>

                            {/* Offer Info - Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 md:p-8 text-white">
                              {/* Business Name */}
                              {offer.business_name && (
                                <p className="text-lg md:text-xl font-semibold mb-2">{offer.business_name}</p>
                              )}
                              
                              {/* Call to Action */}
                              <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                                {offer.call_to_action}
                              </h2>

                              {/* Validity */}
                              <div className="flex items-center gap-2 text-sm md:text-base text-gray-300 mb-4">
                                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                                <span>Valid until {new Date(offer.redemption_end_date).toLocaleDateString()}</span>
                              </div>

                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
                            <div className="text-center">
                              <h2 className="text-3xl md:text-5xl font-bold mb-4">{offer.call_to_action}</h2>
                              {offer.business_name && (
                                <p className="text-xl md:text-2xl text-muted-foreground mb-6">{offer.business_name}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </UICarousel>
            
            {/* Carousel Indicator */}
            {allOffers.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                {allOffers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      current === index + 1
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Redemption Codes Section - Beneath Carousel */}
            {allOffers.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-center text-foreground mb-6">
                  Your Redemption Codes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allOffers.map((offer, index) => {
                    const couponCode = couponCodes[offer.id];
                    const isGenerating = generatingCoupon[offer.id] || false;
                    const isCurrentOffer = current === index + 1;
                    
                    return (
                      <Card 
                        key={offer.id}
                        className={`p-4 md:p-6 transition-all ${
                          isCurrentOffer 
                            ? 'border-2 border-primary shadow-lg bg-primary/5' 
                            : 'border border-border'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Offer Info */}
                          <div>
                            {offer.business_name && (
                              <p className="font-semibold text-foreground mb-1">{offer.business_name}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {offer.call_to_action}
                            </p>
                          </div>

                          {/* Redemption Code */}
                          {offer.redemption_code ? (
                            couponCode ? (
                              <div className={`rounded-lg p-4 text-center ${
                                isCurrentOffer
                                  ? 'bg-green-500/20 border-2 border-green-400'
                                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              }`}>
                                <p className="text-xs text-muted-foreground mb-2">Your Unique Coupon Code</p>
                                <p className={`text-2xl md:text-3xl font-bold tracking-wider ${
                                  isCurrentOffer ? 'text-green-300' : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {couponCode}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Redeem at {offer.location_name || offer.business_name || 'the store'}
                                </p>
                                {offer.location_address && (
                                  <p className="text-xs text-muted-foreground/70 mt-1">
                                    {offer.location_address}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button 
                                onClick={() => generateCouponCode(offer)}
                                disabled={isGenerating}
                                className="w-full"
                                variant={isCurrentOffer ? "default" : "outline"}
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    Generating...
                                  </>
                                ) : (
                                  'Get Coupon Code'
                                )}
                              </Button>
                            )
                          ) : (
                            <div className="text-center text-sm text-muted-foreground py-2">
                              No redemption code available
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Powered by <span className="font-semibold text-foreground">Media Street</span></p>
          <p className="text-xs">Connecting local businesses with their community</p>
        </div>
      </footer>
    </div>
  );
};

export default Carousel;
