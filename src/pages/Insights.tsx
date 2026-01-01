import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { get } from "@/services/apis";
import coffeeCampaign from "@/assets/pos-campaign-coffee.jpg";
import flowersCampaign from "@/assets/pos-campaign-flowers.jpg";
import salonCampaign from "@/assets/pos-campaign-salon.jpg";
import subsCampaign from "@/assets/pos-campaign-subs.jpg";

interface TopOffer {
  id: string;
  storeName: string;
  offerImage: string;
  callToAction: string;
  redemptions: number;
  views: number;
  conversionRate: number;
}

// Sample data for top offers (fallback)
const sampleTopOffers: TopOffer[] = [
  {
    id: "1",
    storeName: "Downtown Coffee",
    offerImage: coffeeCampaign,
    callToAction: "Get 20% off your morning coffee! Show this offer at checkout.",
    redemptions: 328,
    views: 1247,
    conversionRate: 26.3
  },
  {
    id: "2",
    storeName: "Bloom Flowers",
    offerImage: flowersCampaign,
    callToAction: "Fresh flowers for any occasion - Buy 2 bouquets, get 1 free!",
    redemptions: 256,
    views: 982,
    conversionRate: 26.1
  },
  {
    id: "3",
    storeName: "Luxe Hair Studio",
    offerImage: salonCampaign,
    callToAction: "New client special: $15 off your first haircut & style!",
    redemptions: 189,
    views: 876,
    conversionRate: 21.6
  },
  {
    id: "4",
    storeName: "Sub Station Deli",
    offerImage: subsCampaign,
    callToAction: "Lunch combo deal: Any sub + chips + drink for just $10!",
    redemptions: 147,
    views: 723,
    conversionRate: 20.3
  }
];

// Trending call-to-action phrases
const trendingPhrases = [
  { phrase: "Buy 2, get 1 free", count: 45, trend: "+12%" },
  { phrase: "% off", count: 38, trend: "+8%" },
  { phrase: "New client special", count: 32, trend: "+15%" },
  { phrase: "Limited time", count: 28, trend: "+5%" },
  { phrase: "Show this offer", count: 24, trend: "+10%" },
  { phrase: "First-time", count: 22, trend: "+7%" }
];

const Insights = () => {
  const [topOffers, setTopOffers] = useState<TopOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopOffers();
  }, []);

  const fetchTopOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch all offers from backend (already filtered to current user's offers)
      const offersResponse = await get({ 
        end_point: 'offers',
        token: true
      });

      if (offersResponse.success && offersResponse.data && Array.isArray(offersResponse.data)) {
        const userOffers = offersResponse.data;
        
        // The backend already includes metrics (views, redemptions, conversionRate)
        // Process all offers (not just top 10)
        const offersWithMetrics = await Promise.all(
          userOffers.map(async (offer: any) => {
            try {
              const offerId = offer._id?.toString() || offer.id?.toString();
              
              // Use metrics from backend if available, otherwise fetch separately
              let views = offer.views || offer.viewsCount || 0;
              let redemptionCount = offer.redemptions || offer.redemptionCount || offer.redemption_count || 0;
              
              // If metrics not in response, fetch them
              if (!offer.views && !offer.viewsCount) {
                const impressionsResponse = await get({
                  end_point: `impressions/offer/${offerId}`,
                  token: true
                }).catch(() => ({ success: false, data: [] }));
                views = impressionsResponse.success ? (impressionsResponse.data?.length || 0) : 0;
              }
              
              if (!offer.redemptions && !offer.redemptionCount && !offer.redemption_count) {
                const redemptionsResponse = await get({
                  end_point: 'redemptions',
                  token: true
                }).catch(() => ({ success: false, data: [] }));
                
                const allRedemptions = redemptionsResponse.success ? redemptionsResponse.data : [];
                redemptionCount = allRedemptions.filter((r: any) => {
                  const redemptionOfferId = r.offerId?.toString() || 
                                          r.offer?._id?.toString() || 
                                          r.offer?.id?.toString();
                  return redemptionOfferId === offerId;
                }).length;
              }

              const conversionRate = views > 0 ? (redemptionCount / views) * 100 : 0;

              // Get location name - handle both populated and non-populated locationIds
              let storeName = "Store";
              if (offer.locationIds && offer.locationIds.length > 0) {
                const locationId = offer.locationIds[0];
                if (typeof locationId === 'object' && locationId.name) {
                  // Location is populated
                  storeName = locationId.name;
                } else if (typeof locationId === 'object' && locationId._id) {
                  // Location object with _id but not populated
                  storeName = locationId.name || "Store";
                } else {
                  // Location ID string - fetch location details
                  try {
                    const locationIdStr = typeof locationId === 'string' ? locationId : locationId.toString();
                    const locationResponse = await get({
                      end_point: `locations/${locationIdStr}`,
                      token: true
                    }).catch(() => ({ success: false }));
                    if (locationResponse.success && locationResponse.data) {
                      storeName = locationResponse.data.name || "Store";
                    }
                  } catch (err) {
                    console.error('Error fetching location:', err);
                  }
                }
              }

              // Get offer image - handle base64 data URLs
              let offerImage = offer.offerImage || 
                              offer.offer_image || 
                              offer.offerImageUrl || 
                              offer.offer_image_url;
              
              // If image is base64, convert to data URL
              if (offerImage && !offerImage.startsWith('http') && !offerImage.startsWith('data:') && !offerImage.startsWith('/')) {
                // Check if it's base64 without data URL prefix
                if (offerImage.length > 100) {
                  offerImage = `data:image/png;base64,${offerImage}`;
                }
              }
              
              // Fallback to placeholder if no image
              if (!offerImage) {
                offerImage = [coffeeCampaign, flowersCampaign, salonCampaign, subsCampaign][
                  Math.floor(Math.random() * 4)
                ];
              }

              return {
                id: offerId,
                storeName,
                offerImage,
                callToAction: offer.callToAction || offer.call_to_action || '',
                redemptions: redemptionCount,
                views,
                conversionRate: conversionRate
              };
            } catch (error) {
              console.error('Error processing offer:', error);
              return null;
            }
          })
        );

        // Filter out null values and sort by conversion rate (descending), then by redemptions
        const validOffers = offersWithMetrics
          .filter((offer): offer is TopOffer => offer !== null)
          .sort((a, b) => {
            // First sort by conversion rate
            if (b.conversionRate !== a.conversionRate) {
              return b.conversionRate - a.conversionRate;
            }
            // Then by redemptions
            return b.redemptions - a.redemptions;
          });

        // Show all offers, not just top 10
        setTopOffers(validOffers);
      } else {
        // No offers found - show empty array instead of sample data
        setTopOffers([]);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      // Show empty array on error instead of sample data
      setTopOffers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout pageTitle="Insights" pageIcon={<TrendingUp className="h-5 w-5 text-primary" />}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <p className="text-muted-foreground mb-8">
          See what's working best this month and incorporate these insights into your own offers
        </p>

        {/* Top Offers Ranking Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              Top Performing Offers
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Highest converting offers this month
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading your offers...</p>
              </div>
            ) : topOffers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No offers found. Create an offer to see insights.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {topOffers.map((offer, index) => (
                  <Card key={offer.id} className="overflow-hidden bg-background/50 backdrop-blur hover:shadow-lg transition-all">
                    <div className="grid md:grid-cols-[300px_1fr] gap-6">
                      {/* Offer Image */}
                      <div className="relative">
                        <img 
                          src={offer.offerImage} 
                          alt={offer.storeName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary text-primary-foreground font-bold text-lg px-4 py-2">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>

                      {/* Offer Details */}
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{offer.storeName}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {offer.callToAction}
                            </p>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Ticket className="h-4 w-4" />
                                <span>Redemptions</span>
                              </div>
                              <div className="text-3xl font-bold text-primary">
                                {offer.redemptions}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span>Conversion Rate</span>
                              </div>
                              <div className="text-3xl font-bold text-emerald-500">
                                {offer.conversionRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending Call-to-Action Phrases */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              Trending Call-to-Action Phrases
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Most used phrases in successful offers this month
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingPhrases.map((item, index) => (
                <Card key={index} className="bg-background/50 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-lg">"{item.phrase}"</span>
                      <Badge variant="secondary" className="text-emerald-500 border-emerald-500/30">
                        {item.trend}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Used in <span className="font-semibold text-foreground">{item.count}</span> offers
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-background/80 rounded-lg border border-border/50">
              <h4 className="font-semibold mb-2">
                Key Insights
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Offers with urgency ("limited time", "today only") convert 23% better</li>
                <li>• "Buy X, get Y free" messaging drives highest redemption rates</li>
                <li>• First-time customer specials attract 3x more new visitors</li>
                <li>• Clear percentage discounts perform better than vague "save big" messaging</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Insights;

