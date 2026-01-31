import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Clock, Map, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import { shuffleArray, calculateDistance } from "@/utils/distance";
import { get, post } from "@/services/apis";

// Geocoding cache to avoid repeated API calls
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

// Geocode an address using Mapbox (simplified - you may need to add Mapbox token endpoint)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address) return null;
  
  // Check cache first
  if (geocodeCache[address] !== undefined) {
    return geocodeCache[address];
  }
  
  try {
    // For now, return null - you can add Mapbox geocoding if needed
    // const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`);
    geocodeCache[address] = null;
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    geocodeCache[address] = null;
    return null;
  }
};

interface CouponOffer {
  id: string;
  call_to_action: string;
  offer_image_url: string | null;
  brand_logo_url: string | null;
  redemption_end_date: string | null;
  expiry_duration: string | null;
  business_name: string;
  location_name: string;
  location_address: string;
  offerType: 'partner' | 'open_offer';
}

const MobileCoupons = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [offers, setOffers] = useState<CouponOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [referringStore, setReferringStore] = useState<string>("Media Street");
  const [isRedeemed, setIsRedeemed] = useState<Record<string, boolean>>({});
  const [viewedOffers, setViewedOffers] = useState<Set<string>>(new Set());
  const redemptionCodesRef = useRef<Record<string, string>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string>("");
  const referringLocationIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (locationId) {
      loadOffers();
    }
  }, [locationId]);

  // Log view when current offer changes (user swipes or first load)
  useEffect(() => {
    const logCurrentOfferView = async () => {
      if (offers.length === 0 || !referringLocationIdRef.current) return;
      
      const currentOffer = offers[currentIndex];
      if (!currentOffer || viewedOffers.has(currentOffer.id)) return;
      
      // Mark as viewed to prevent duplicate logging
      setViewedOffers(prev => new Set(prev).add(currentOffer.id));
      
      try {
        // Log impression (mobile coupon view) via Node.js API - awards 1 point
        // locationId = offer's location, displayLocationId = where it's being displayed (referring location)
        const offerLocationId = currentOffer.location_id || 
                               currentOffer.locationId || 
                               (Array.isArray(currentOffer.locationIds) && currentOffer.locationIds[0] ? 
                                 (currentOffer.locationIds[0]._id || currentOffer.locationIds[0].toString() || currentOffer.locationIds[0]) : 
                                 null);
        
        if (offerLocationId && referringLocationIdRef.current) {
          await post({
            end_point: 'impressions',
            body: {
              offerId: currentOffer.id,
              locationId: offerLocationId,
              displayLocationId: referringLocationIdRef.current,
              impressionType: 'carousel'
            },
            token: false // Public endpoint
          });
          console.log('✅ Logged impression for offer:', currentOffer.id, '- 1 point awarded');
        }
      } catch (viewError) {
        console.error('Error logging coupon view:', viewError);
        // Don't show error to user - impression logging is non-critical
      }
    };
    
    logCurrentOfferView();
  }, [currentIndex, offers, referringStore]);

  const loadOffers = async () => {
    try {
      setLoading(true);

      // Load the location to get the user_id
      const locationResponse = await get({
        end_point: `locations/public/${locationId}`,
        token: false
      });

      if (!locationResponse.success || !locationResponse.data) {
        toast({
          title: "Error",
          description: "Could not find this location",
          variant: "destructive",
        });
        return;
      }

      const locationData = locationResponse.data;
      setReferringStore(locationData.name || 'Media Street');
      const currentUserId = locationData.userId || locationData.user_id;
      
      let partnerOffers: CouponOffer[] = [];
      let openOfferDeals: CouponOffer[] = [];

      // 1. FIRST: Fetch active partner offers for this location
      try {
        const partnerResponse = await get({
          end_point: `offers/location/${locationId}/partners`,
          token: false
        });

        if (partnerResponse.success && partnerResponse.data && Array.isArray(partnerResponse.data)) {
          const now = new Date();
          partnerOffers = partnerResponse.data
            .filter((offer: any) => {
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              return isActive && isNotExpired;
            })
            .map((offer: any) => {
              const location = offer.locationIds?.[0] || offer.locations?.[0] || {};
              const locationId = location?._id?.toString() || location?.id?.toString() || location?.toString() || 
                                offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() ||
                                offer.locationId?.toString() || offer.location_id?.toString() || null;
              return {
                id: offer._id?.toString() || offer.id?.toString() || '',
                call_to_action: offer.callToAction || offer.call_to_action || '',
                offer_image_url: offer.offer_image || offer.offerImage || null,
                brand_logo_url: offer.brand_logo || offer.brandLogo || null,
                redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_duration: offer.expirationDuration || '1day',
                business_name: offer.user?.fullName || offer.userId?.fullName || location?.name || 'Partner Store',
                location_name: location?.name || 'Partner Store',
                location_address: location?.address || '',
                location_id: locationId,
                locationId: locationId,
                offerType: 'partner' as const
              };
            });
        }
      } catch (error) {
        console.error('Error fetching partner offers:', error);
      }

      // 2. SECOND: Fetch subscribed open offers for this location
      try {
        const openOffersResponse = await get({
          end_point: `offers/location/${locationId}/subscribed-open`,
          token: false
        });

        if (openOffersResponse.success && openOffersResponse.data && Array.isArray(openOffersResponse.data)) {
          const now = new Date();
          const currentRetailChannel = locationData.retailChannel || locationData.retail_channel;
          let myLat = locationData.latitude;
          let myLng = locationData.longitude;
          
          // Geocode if no coordinates stored
          if ((!myLat || !myLng) && locationData.address) {
            const coords = await geocodeAddress(locationData.address);
            if (coords) {
              myLat = coords.lat;
              myLng = coords.lng;
            }
          }

          // Filter and calculate distances for open offers
          const offersWithDistance: Array<{
            offer: any;
            location: any;
            distance: number;
          }> = [];

          for (const offer of openOffersResponse.data) {
            const isActive = offer.is_active !== false && offer.isActive !== false;
            const isNotExpired = !offer.expires_at && !offer.expiresAt || 
              (offer.expires_at && new Date(offer.expires_at) > now) ||
              (offer.expiresAt && new Date(offer.expiresAt) > now);
            
            if (!isActive || !isNotExpired) continue;

            const offerLocation = offer.locationIds?.[0] || offer.locations?.[0] || {};
            const offerRetailChannel = offerLocation.retailChannel || offerLocation.retail_channel;
            
            // Skip same retail channel (competing stores)
            if (currentRetailChannel && offerRetailChannel && 
                currentRetailChannel.toLowerCase() === offerRetailChannel.toLowerCase()) {
              continue;
            }

            // Calculate distance
            let locLat = offerLocation.latitude;
            let locLng = offerLocation.longitude;
            
            if ((!locLat || !locLng) && offerLocation.address) {
              const coords = await geocodeAddress(offerLocation.address);
              if (coords) {
                locLat = coords.lat;
                locLng = coords.lng;
              }
            }

            let distance = 999;
            if (myLat && myLng && locLat && locLng) {
              distance = calculateDistance(myLat, myLng, locLat, locLng);
            }

            // Only include stores within 3 miles
            if (distance <= 3) {
              offersWithDistance.push({ offer, location: offerLocation, distance });
            }
          }

          // Sort by distance (closest first)
          offersWithDistance.sort((a, b) => a.distance - b.distance);

          openOfferDeals = offersWithDistance.map(({ offer, location }) => {
            const locationId = location?._id?.toString() || location?.id?.toString() || location?.toString() || 
                              offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() ||
                              offer.locationId?.toString() || offer.location_id?.toString() || null;
            return {
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              offer_image_url: offer.offer_image || offer.offerImage || null,
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              expiry_duration: offer.expirationDuration || '1day',
              business_name: offer.user?.fullName || offer.userId?.fullName || location?.name || 'Partner Store',
              location_name: location?.name || 'Partner Store',
              location_address: location?.address || '',
              location_id: locationId,
              locationId: locationId,
              offerType: 'open_offer' as const
            };
          });
        }
      } catch (error) {
        console.error('Error fetching open offers:', error);
      }

      // Combine: Partners first (shuffled), then Open Offers (sorted by distance)
      const combinedOffers: CouponOffer[] = [
        ...shuffleArray(partnerOffers),
        ...openOfferDeals // Already sorted by distance
      ];

      setOffers(combinedOffers);
      
      // Store the referring location ID for per-view logging
      referringLocationIdRef.current = locationId || null;
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : offers.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < offers.length - 1 ? prev + 1 : 0));
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && offers.length > 1) {
      handleNext();
    } else if (isRightSwipe && offers.length > 1) {
      handlePrev();
    }
  };

  const formatExpirationDateTime = (expiryDuration: string | null) => {
    const now = new Date();
    let expiryDate: Date;
    
    switch (expiryDuration) {
      case '1hour':
        expiryDate = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '1week':
        expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '1day':
      default:
        expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
    }
    
    return expiryDate.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getExpirationDisplay = (offer: CouponOffer) => {
    if (offer.redemption_end_date) {
      try {
        const d = new Date(offer.redemption_end_date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (_) {}
    }
    return formatExpirationDateTime(offer.expiry_duration);
  };

  // Generate stable redemption code synchronously using ref for immediate consistency
  const generateRedemptionCode = async (offerId: string) => {
    // If we have a cached code, use it
    if (redemptionCodesRef.current[offerId]) {
      return redemptionCodesRef.current[offerId];
    }
    
    try {
      // Generate coupon code via API
      const response = await post({
        end_point: 'redemptions/public',
        body: {
          offerId: offerId,
          locationId: locationId,
          redemptionCode: 'SCAN'
        },
        token: false
      });

      if (response.success && response.data) {
        const code = response.data.couponCode || response.data.coupon_code || 
                     Math.random().toString(36).substr(2, 10).toUpperCase();
        redemptionCodesRef.current[offerId] = code;
        return code;
      }
    } catch (error) {
      console.error('Error generating coupon code:', error);
    }
    
    // Fallback: Generate a new code
    const code = Math.random().toString(36).substr(2, 10).toUpperCase();
    redemptionCodesRef.current[offerId] = code;
    return code;
  };

  const handleRedeem = async (offerId: string) => {
    if (isRedeemed[offerId]) return;

    try {
      const code = redemptionCodesRef.current[offerId];
      if (!code) {
        toast({
          title: "Error",
          description: "No redemption code available",
          variant: "destructive",
        });
        return;
      }

      // Use redeem-coupon endpoint which awards points correctly
      const response = await post({
        end_point: 'redemptions/redeem-coupon',
        body: {
          couponCode: code,
          locationId: locationId
        },
        token: true
      });

      if (response.success) {
        setIsRedeemed(prev => ({ ...prev, [offerId]: true }));
        toast({
          title: "Success!",
          description: "Coupon redeemed successfully!",
        });
      }
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: error?.response?.data?.message || "Failed to redeem coupon. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            No offers available right now
          </h2>
          <p className="text-gray-600 mb-4">
            Check back soon for new deals from {referringStore} and their partners!
          </p>
          <p className="text-sm text-gray-500">
            Powered by <span className="font-medium text-purple-600">Media Street</span>
          </p>
        </div>
      </div>
    );
  }

  const currentOffer = offers[currentIndex];
  
  // Load redemption code when offer changes
  useEffect(() => {
    if (currentOffer?.id) generateRedemptionCode(currentOffer.id).then(setRedemptionCode);
  }, [currentOffer?.id]);

  const isCurrentRedeemed = isRedeemed[currentOffer.id];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header: logo + page indicator only (match expected design) */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="https://mediastreet.ai" target="_blank" rel="noopener noreferrer">
              <img src={mediaStreetLogo} alt="Media Street" className="h-8 w-auto" />
            </a>
            <span className="text-sm font-medium text-purple-600">
              {currentIndex + 1} of {offers.length}
            </span>
          </div>
        </div>
      </header>

      {/* Coupon Card - clean centered layout per expected design */}
      <div 
        className="flex-1 flex items-start justify-center p-4 pb-8"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-4">
              {/* Partner Offer badge - centered, light green */}
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium ${
                    currentOffer.offerType === 'partner'
                      ? 'bg-green-200/80 text-green-800'
                      : 'bg-blue-200/80 text-blue-800'
                  }`}
                >
                  {currentOffer.offerType === 'partner' ? 'Partner Offer' : 'Open Offer'}
                </span>
              </div>

              {/* Business name - large, bold, black, centered */}
              <h2 className="text-2xl font-bold text-black text-center">
                {currentOffer.business_name || currentOffer.location_name}
              </h2>

              {/* Offer image - rounded, full width; placeholder when missing */}
              <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {currentOffer.offer_image_url ? (
                  <img
                    src={currentOffer.offer_image_url}
                    alt="Offer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-1">🎁</span>
                    <span className="text-xs font-medium">No image</span>
                  </div>
                )}
              </div>

              {/* Offer tagline - large, bold, black, centered */}
              <h3 className="text-xl font-bold text-black text-center leading-tight">
                {currentOffer.call_to_action}
              </h3>

              {/* Expiration - orange with clock icon */}
              <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Expires on {getExpirationDisplay(currentOffer)}</span>
              </div>

              {/* Directions link - blue with map icon */}
              {currentOffer.location_address && (
                <>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(currentOffer.location_address);
                        window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      <Map className="h-4 w-4" />
                      Directions
                    </button>
                  </div>
                  {/* Location breadcrumbs - light grey */}
                  <p className="text-center text-sm text-gray-500">
                    {referringStore} → {currentOffer.business_name || currentOffer.location_name}
                  </p>
                </>
              )}

              {/* For cashier to redeem - section header + grey box */}
              <div className="pt-4">
                <p className="text-center font-semibold text-gray-900 mb-3">
                  For cashier to redeem:
                </p>
                {isCurrentRedeemed ? (
                  <div className="bg-green-50 p-6 rounded-xl text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-gray-800">Coupon Redeemed</p>
                    <p className="text-sm text-green-600">Successfully logged this redemption.</p>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-5 rounded-xl text-center">
                    <p className="text-lg font-bold font-mono text-black mb-3 tracking-wider">
                      {redemptionCode || "------"}
                    </p>
                    <div className="bg-white p-3 rounded-lg inline-block mb-3">
                      <QRCodeSVG
                        value={`${window.location.origin}/redeem/${currentOffer.id}/confirm?code=${redemptionCode || 'SCAN'}&referrer=${encodeURIComponent(referringStore)}`}
                        size={120}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      Retailer: type code above or scan QR to log this redemption
                    </p>
                    <Button
                      onClick={() => handleRedeem(currentOffer.id)}
                      className="mt-4 w-full"
                      variant="default"
                      size="sm"
                    >
                      Log Redemption
                    </Button>
                  </div>
                )}

                {/* Terms */}
                <div className="text-center mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 leading-relaxed px-2">
                    *Limit one coupon per customer. Not valid with other offers. Valid and redeemable only when presented at a participating store location.
                  </p>
                </div>
              </div>

              {/* Powered by */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Powered by <span className="font-medium text-purple-600">mediastreet.ai</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - dots or prev/next when multiple offers */}
          {offers.length > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <Button
                onClick={handlePrev}
                variant="ghost"
                size="icon"
                className="text-purple-600 hover:bg-purple-50"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="flex gap-1.5">
                {offers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Offer ${idx + 1}`}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="text-purple-600 hover:bg-purple-50"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCoupons;
