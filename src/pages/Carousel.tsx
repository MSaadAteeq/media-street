import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

      // Load location details
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .maybeSingle();

      if (locationError || !locationData) {
        console.error('Error loading location:', locationError);
        toast({
          title: "Error",
          description: "Could not find this location",
          variant: "destructive",
        });
        return;
      }

      setLocation(locationData);
      
      // Check if user has Open Offer subscription
      // Note: Once DB migration adds location_id to offerx_subscriptions, 
      // we'll check by location_id instead of user_id
      const { data: openOfferSub } = await supabase
        .from('offerx_subscriptions')
        .select('*')
        .eq('user_id', locationData.user_id)
        .eq('is_active', true)
        .maybeSingle();

      const isOpenOfferSubscribed = !!openOfferSub;

      // Load partner offers for this location
      const { data: partnerData } = await supabase
        .from('offers')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true);

      // Randomize partner offers for rotation
      const randomizedPartners = shuffleArray(partnerData || []);

      let nearbyOpenOffers: Offer[] = [];

      // If subscribed to Open Offer, fetch nearby Open Offer deals
      if (isOpenOfferSubscribed) {
        // Get all other locations with Open Offer subscriptions
        const { data: openOfferSubs } = await supabase
          .from('offerx_subscriptions')
          .select('user_id')
          .eq('is_active', true)
          .neq('user_id', locationData.user_id)
          .limit(10);

        if (openOfferSubs && openOfferSubs.length > 0) {
          const openOfferUserIds = openOfferSubs.map(sub => sub.user_id);

          // Get locations from these users
          const { data: nearbyLocations } = await supabase
            .from('locations')
            .select('id, name, user_id')
            .in('user_id', openOfferUserIds);

          if (nearbyLocations && nearbyLocations.length > 0) {
            const nearbyLocationIds = nearbyLocations.map(loc => loc.id);
            
            // Get offers from these locations (up to 10 offers)
            // Note: Once DB has lat/long, we'll filter by distance (within 10 miles)
            const { data: openOffersData } = await supabase
              .from('offers')
              .select('*')
              .in('location_id', nearbyLocationIds)
              .eq('is_active', true)
              .limit(10);

            if (openOffersData) {
              // Attach business name to each offer
              nearbyOpenOffers = openOffersData.map(offer => {
                const offerLocation = nearbyLocations.find(
                  loc => loc.id === offer.location_id
                );
                return {
                  ...offer,
                  business_name: offerLocation?.name,
                  // Distance will be calculated once lat/long are added to DB
                  distance: undefined
                };
              });
            }
          }
        }
      }

      // If no partner offers or open offers, load default advertiser campaigns
      let defaultCampaigns: any[] = [];
      if (randomizedPartners.length === 0 && nearbyOpenOffers.length === 0) {
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
            .map((cr: any) => ({
              id: cr.campaigns.id,
              call_to_action: cr.campaigns.call_to_action,
              offer_image_url: cr.campaigns.campaign_image_url,
              brand_logo_url: cr.campaigns.brand_logo_url,
              redemption_start_date: new Date().toISOString(),
              redemption_end_date: cr.campaigns.expiration_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              location_id: locationId,
              business_name: 'Advertiser'
            }));
        }
      }

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
