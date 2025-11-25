import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, Clock, ExternalLink } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import posSalonImage from "@/assets/pos-campaign-salon.jpg";
import posCoffeeImage from "@/assets/pos-campaign-coffee.jpg";
import posFlowersImage from "@/assets/pos-campaign-flowers.jpg";
import { useToast } from "@/components/ui/use-toast";
import { calculateDistance, shuffleArray } from "@/utils/distance";

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

  useEffect(() => {
    if (locationId) {
      loadLocationAndOffers();
    }
  }, [locationId]);

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
              business_name: offer.user?.fullName || offer.userId?.fullName || null
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
              is_partner_offer: true,
              is_open_offer: false,
              is_owner_offer: false,
              offer_image_url: offer.offer_image || offer.offerImage || posCoffeeImage, // Use different image for partner offers
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              business_name: offer.user?.fullName || offer.userId?.fullName || null
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
          end_point: `offers/location/${selectedLocationId}/subscribed-open`,
          token: false // Public endpoint
        });
        
        if (response.success && response.data) {
          // Backend already filters for active, non-expired, subscribed open offers
          nearbyOpenOffers = response.data.map((offer: any) => ({
              id: offer._id?.toString() || offer.id?.toString() || '',
              call_to_action: offer.callToAction || offer.call_to_action || '',
              location_id: offer.locationIds?.[0]?._id?.toString() || offer.locationIds?.[0]?.toString() || offer.location_ids?.[0] || '',
              location_name: offer.locations?.[0]?.name || offer.locationIds?.[0]?.name || 'Unknown Location',
              is_partner_offer: false,
              is_open_offer: true,
              is_owner_offer: false,
              offer_image_url: offer.offer_image || offer.offerImage || posFlowersImage, // Use different image for open offers
              brand_logo_url: offer.brand_logo || offer.brandLogo || null,
              redemption_start_date: offer.created_at || offer.createdAt || new Date().toISOString(),
              redemption_end_date: offer.expires_at || offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              business_name: offer.user?.fullName || offer.userId?.fullName || null
            }));
        }
      } catch (error) {
        console.error('Error fetching open offers:', error);
        nearbyOpenOffers = [];
      }
      
      const defaultCampaigns: Offer[] = [];

      // Combine: Partner offers first, then open offers, then back to partner offers (rotation)
      // This creates a rotation: Partner -> Open -> Partner -> Open...
      const combinedOffers: Offer[] = [];
      
      // Interleave partner offers and open offers for rotation
      const maxLength = Math.max(partnerOffers.length, nearbyOpenOffers.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < partnerOffers.length) {
          combinedOffers.push(partnerOffers[i]);
        }
        if (i < nearbyOpenOffers.length) {
          combinedOffers.push(nearbyOpenOffers[i]);
        }
      }
      
      // If we have more of one type, add remaining at the end
      if (partnerOffers.length > nearbyOpenOffers.length) {
        combinedOffers.push(...partnerOffers.slice(nearbyOpenOffers.length));
      } else if (nearbyOpenOffers.length > partnerOffers.length) {
        combinedOffers.push(...nearbyOpenOffers.slice(partnerOffers.length));
      }

      setAllOffers(combinedOffers);
      setPartnerOffers(partnerOffers);

      // Auto-show first offer in full screen if available (partner offer first, then open offer)
      if (combinedOffers.length > 0) {
        setCurrentFullScreenIndex(0);
        setShowFullScreen(true);
      }

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

        {/* Offers Grid */}
        <div className="space-y-4">
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
            allOffers.map((offer) => {
              const isPartnerOffer = offer.location_id === locationId;
              return (
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
                        {isPartnerOffer ? 'Partner' : 'Open Offer'}
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
                  {!isPartnerOffer && offer.distance && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{offer.distance} miles away</span>
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
              );
            })
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
