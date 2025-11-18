import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, Clock, ExternalLink } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo.png";
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

  useEffect(() => {
    if (locationId) {
      loadLocationAndOffers();
    }
  }, [locationId]);

  const loadLocationAndOffers = async () => {
    try {
      setLoading(true);

      // TODO: Replace with Node.js API calls
      // const locationResponse = await get({ end_point: `locations/${locationId}` });
      // const offersResponse = await get({ end_point: `locations/${locationId}/offers` });
      // const openOffersResponse = await get({ end_point: `locations/${locationId}/open-offers` });
      // const campaignsResponse = await get({ end_point: `locations/${locationId}/campaigns` });
      
      // Mock data for now
      const locationData = {
        id: locationId,
        name: "Sample Location",
        address: "123 Main St",
        user_id: "user-1"
      };
      
      setLocation(locationData as Location);
      
      // Mock offers
      const randomizedPartners: Offer[] = [];
      
      // Load open offers from backend API (available to all retailers)
      let nearbyOpenOffers: Offer[] = [];
      try {
        const { get } = await import("@/services/apis");
        const response = await get({ 
          end_point: 'offers/open',
          token: false // Public endpoint
        });
        
        if (response.success && response.data) {
          nearbyOpenOffers = response.data
            .filter((offer: any) => offer.is_open_offer && offer.is_active)
            .map((offer: any) => ({
              id: offer.id,
              call_to_action: offer.call_to_action,
              location_id: offer.location_ids?.[0] || '',
              location_name: offer.locations?.[0]?.name || 'Unknown Location',
              is_partner_offer: false,
              is_open_offer: true
            }));
        }
      } catch (error) {
        console.error('Error fetching open offers:', error);
        // Fallback to localStorage if API fails
        const openOffers = JSON.parse(localStorage.getItem('mockOpenOffers') || '[]');
        nearbyOpenOffers = openOffers
          .filter((offer: any) => offer.is_open_offer && offer.is_active)
          .map((offer: any) => ({
            id: offer.id,
            call_to_action: offer.call_to_action,
            location_id: offer.location_ids?.[0] || '',
            location_name: offer.locations?.[0]?.name || 'Unknown Location',
            is_partner_offer: false,
            is_open_offer: true
          }));
      }
      
      const defaultCampaigns: Offer[] = [];

      // Combine: partner offers first (randomized), then nearby Open Offers, then default campaigns
      const combinedOffers: Offer[] = [
        ...randomizedPartners,
        ...nearbyOpenOffers,
        ...defaultCampaigns
      ];

      setAllOffers(combinedOffers);

    } catch (error) {
      console.error('Error loading carousel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemOffer = (offerId: string) => {
    // Navigate to redemption flow
    window.location.href = `/redeem?offer=${offerId}`;
  };

  const partnerCount = allOffers.filter(o => o.location_id === locationId).length;
  const openOfferCount = allOffers.length - partnerCount;

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
