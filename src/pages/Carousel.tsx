import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, Clock, ExternalLink } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import { useToast } from "@/hooks/use-toast";
import { shuffleArray } from "@/utils/distance";
import { get } from "@/services/apis";

interface Offer {
  id: string;
  call_to_action: string;
  offer_image_url: string | null;
  brand_logo_url: string | null;
  redemption_start_date: string;
  redemption_end_date: string;
  location_id: string;
  business_name?: string;
  distance?: number;
  offerType: 'partner' | 'open_offer';
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

  useEffect(() => {
    if (locationId) {
      loadLocationAndOffers();
    }
  }, [locationId]);

  const loadLocationAndOffers = async () => {
    try {
      setLoading(true);

      // Fetch location from backend API (public endpoint for QR codes)
      let locationData: Location | null = null;
      try {
        const locationResponse = await get({ 
          end_point: `locations/public/${locationId}`,
          token: false // Public endpoint for QR codes
        });
        
        if (locationResponse.success && locationResponse.data) {
          locationData = {
            id: locationResponse.data._id?.toString() || locationResponse.data.id?.toString() || locationId || '',
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
        toast({
          title: "Error",
          description: "Could not find this location",
          variant: "destructive",
        });
        setLocation(null);
        return;
      }

      if (!locationData || !locationData.user_id) {
        console.error('Location data or user_id is missing');
        return;
      }

      const currentUserId = locationData.user_id;
      let partnerOffers: Offer[] = [];
      let openOfferDeals: Offer[] = [];
      let ownerOpenOffers: Offer[] = [];

      // 1. FIRST: Fetch location owner's own offers (including open offers)
      // This is the MOST IMPORTANT - show the location's own open offers
      try {
        const ownerResponse = await get({ 
          end_point: `offers/location/${locationId}/owner`,
          token: false // Public endpoint
        });
        
        console.log('📦 Owner offers response:', ownerResponse);
        
        if (ownerResponse.success && ownerResponse.data && Array.isArray(ownerResponse.data)) {
          const now = new Date();
          const ownerOffers = ownerResponse.data
            .filter((offer: any) => {
              const isActive = offer.is_active !== false && offer.isActive !== false;
              const isNotExpired = !offer.expires_at && !offer.expiresAt || 
                (offer.expires_at && new Date(offer.expires_at) > now) ||
                (offer.expiresAt && new Date(offer.expiresAt) > now);
              
              // Check if it's an open offer
              const isOpenOffer = offer.is_open_offer === true || 
                                 offer.isOpenOffer === true || 
                                 offer.is_open_offer === 'true' ||
                                 offer.isOpenOffer === 'true';
              
              console.log(`  Offer ${offer._id || offer.id}:`, {
                isActive,
                isNotExpired,
                isOpenOfferFlag: isOpenOffer,
                callToAction: offer.callToAction || offer.call_to_action,
                is_open_offer: offer.is_open_offer,
                isOpenOffer: offer.isOpenOffer
              });
              
              // Include ALL active, non-expired offers (both open and regular)
              // But we'll mark open offers separately
              return isActive && isNotExpired;
            });

          // Separate owner's open offers - these MUST be shown
          ownerOpenOffers = ownerOffers
            .filter((offer: any) => {
              const isOpenOffer = offer.is_open_offer === true || 
                                 offer.isOpenOffer === true || 
                                 offer.is_open_offer === 'true' ||
                                 offer.isOpenOffer === 'true';
              return isOpenOffer;
            })
            .map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              offer_image_url: offer.offer_image || offer.offerImage || null,
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              business_name: offer.user?.fullName || offer.userId?.fullName || offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || null,
              distance: undefined,
              offerType: 'open_offer' as const
            }));

          console.log('📦 Owner offers total:', ownerOffers.length);
          console.log('📦 Owner open offers found:', ownerOpenOffers.length);
          console.log('📦 Owner open offers details:', ownerOpenOffers.map(o => ({
            id: o.id,
            call_to_action: o.call_to_action,
            offerType: o.offerType
          })));
        } else {
          console.log('⚠️ No owner offers found or invalid response:', ownerResponse);
        }
      } catch (error) {
        console.error('❌ Error fetching owner offers:', error);
      }

      // 2. SECOND: Fetch active partner offers for this location
      try {
        const partnerResponse = await get({ 
          end_point: `offers/location/${locationId}/partners`,
          token: false // Public endpoint
        });
        
        if (partnerResponse.success && partnerResponse.data) {
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
              offer_image_url: offer.offer_image || offer.offerImage || null,
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              business_name: offer.user?.fullName || offer.userId?.fullName || offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || null,
              distance: undefined,
              offerType: 'partner' as const
            }));
        }
      } catch (error) {
        console.error('Error fetching partner offers:', error);
        partnerOffers = [];
      }

      // 3. THIRD: Fetch subscribed open offers for this location (from other retailers)
      try {
        const openOffersResponse = await get({ 
          end_point: `offers/location/${locationId}/subscribed-open`,
          token: false // Public endpoint
        });
        
        console.log('🔍 Subscribed open offers response:', openOffersResponse);
        
        if (openOffersResponse.success && openOffersResponse.data) {
          const now = new Date();
          const subscribedOpenOffers = openOffersResponse.data
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
              offer_image_url: offer.offer_image || offer.offerImage || null,
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              business_name: offer.user?.fullName || offer.userId?.fullName || offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || null,
              distance: undefined,
              offerType: 'open_offer' as const
            }));

          console.log('🔍 Subscribed open offers found:', subscribedOpenOffers.length);
          openOfferDeals = subscribedOpenOffers;
        }
      } catch (error) {
        console.error('Error fetching subscribed open offers:', error);
        openOfferDeals = [];
      }

      // Randomize within each category
      const randomizedPartnerOffers = shuffleArray(partnerOffers);
      const randomizedSubscribedOpenOffers = shuffleArray(openOfferDeals);
      const randomizedOwnerOpenOffers = shuffleArray(ownerOpenOffers);

      // Combine: Partners first, then Owner's Open Offers, then Subscribed Open Offers
      // This ensures owner's own open offers are ALWAYS visible if they exist
      const combinedOffers: Offer[] = [
        ...randomizedPartnerOffers,
        ...randomizedOwnerOpenOffers,  // Owner's own open offers - MUST be shown
        ...randomizedSubscribedOpenOffers  // Subscribed open offers from other retailers
      ];

      console.log('📊 Carousel offers summary:', {
        partnerOffers: partnerOffers.length,
        ownerOpenOffers: ownerOpenOffers.length,
        subscribedOpenOffers: openOfferDeals.length,
        total: combinedOffers.length,
        ownerOpenOfferIds: ownerOpenOffers.map(o => o.id)
      });

      // If we have ANY offers (partner, owner open, or subscribed open), show them
      // Don't show "no offers" if we have any offers available
      if (combinedOffers.length > 0) {
        console.log('✅ Showing offers:', combinedOffers.length);
        setAllOffers(combinedOffers);
      } else {
        console.log('⚠️ No offers found - showing empty state');
        setAllOffers([]);
      }

    } catch (error) {
      console.error('Error loading carousel data:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemOffer = (offerId: string) => {
    // Navigate to redeem page with the offer ID and location ID as referrer
    window.location.href = `/redeem/${offerId}?ref=${encodeURIComponent(location?.name || 'Media Street')}&locationId=${locationId}`;
  };

  const partnerCount = allOffers.filter(o => o.offerType === 'partner').length;
  const openOfferCount = allOffers.filter(o => o.offerType === 'open_offer').length;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
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
              {partnerCount > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-medium">{partnerCount} Partner Offers</span>
                </div>
              )}
              {openOfferCount > 0 && (
                <>
                  {partnerCount > 0 && <div className="h-4 w-px bg-border" />}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{openOfferCount} Open Offer Deals</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Offers Grid */}
        <div className="space-y-4">
        {allOffers.length === 0 ? (
          <Card className="p-12 text-center max-w-2xl mx-auto bg-gradient-to-br from-background to-primary/5 border-2">
            <div className="space-y-6">
              {/* Cute emoji/icon */}
              <div className="text-6xl animate-bounce">
                🎁
              </div>
              
              {/* Main message */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Oops! The deal box is empty... for now! 🤷
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  Looks like we're between deals at the moment.
                </p>
                <p className="text-base text-muted-foreground/80">
                  But don't worry — new offers pop up all the time!
                </p>
              </div>

              {/* Call to action */}
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-lg font-semibold text-foreground mb-2">
                  💡 Pro tip:
                </p>
                <p className="text-base text-muted-foreground">
                  Scan this QR code next time you visit {location.name} to discover fresh deals and exclusive discounts!
                </p>
              </div>

              {/* Fun footer message */}
              <p className="text-sm text-muted-foreground/60 italic">
                Good things come to those who scan... again! 📱✨
              </p>
            </div>
          </Card>
          ) : (
            allOffers.map((offer) => (
              <Card 
                key={offer.id} 
                className="overflow-hidden hover:shadow-elegant transition-all duration-300 border-border"
              >
                {/* Offer Image */}
                {offer.offer_image_url && (
                  <div className="relative h-48 bg-secondary/20">
                    <img 
                      src={offer.offer_image_url} 
                      alt={offer.call_to_action}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                        {offer.offerType === 'partner' ? 'Partner' : 'Open Offer'}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Offer Content */}
                <div className="p-6 space-y-4">
                  {/* Brand Logo & Name */}
                  {offer.brand_logo_url && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={offer.brand_logo_url} 
                        alt="Brand logo"
                        className="h-12 w-12 object-contain rounded-lg border border-border p-1"
                      />
                      {offer.business_name && (
                        <p className="font-medium text-foreground">{offer.business_name}</p>
                      )}
                    </div>
                  )}

                  {/* Call to Action */}
                  <h3 className="text-xl font-bold text-foreground leading-tight">
                    {offer.call_to_action}
                  </h3>

                  {/* Validity Period */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Valid until {new Date(offer.redemption_end_date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Distance (for open offers) */}
                  {offer.offerType === 'open_offer' && offer.distance && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{offer.distance.toFixed(1)} miles</span>
                    </div>
                  )}

                  {/* Redeem Button */}
                  <Button 
                    onClick={() => handleRedeemOffer(offer.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Redeem Offer
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
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
