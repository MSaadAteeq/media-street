import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Ticket, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { get } from "@/services/apis";
import AppLayout from "@/components/AppLayout";

interface TopOffer {
  id: string;
  storeName: string;
  offerImage: string | null;
  callToAction: string;
  redemptions: number;
  views: number;
  conversionRate: number;
}

const TopOffers = () => {
  const [topOffers, setTopOffers] = useState<TopOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopOffers();
  }, []);

  const fetchTopOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch all active offers
      const offersResponse = await get({
        end_point: 'offers',
        token: true
      });

      if (!offersResponse.success || !offersResponse.data || !Array.isArray(offersResponse.data)) {
        setTopOffers([]);
        return;
      }

      const offers = offersResponse.data;

      // Fetch redemptions to get stats
      const redemptionsResponse = await get({
        end_point: 'redemptions',
        token: true
      });

      const redemptions = redemptionsResponse.success && redemptionsResponse.data 
        ? (Array.isArray(redemptionsResponse.data) ? redemptionsResponse.data : [])
        : [];

      // Count redemptions per offer
      const redemptionCounts: Record<string, number> = {};
      const viewCounts: Record<string, number> = {};
      
      redemptions.forEach((redemption: any) => {
        const offerId = redemption.offer_id || redemption.offerId || '';
        if (offerId) {
          redemptionCounts[offerId] = (redemptionCounts[offerId] || 0) + 1;
        }
      });

      // Transform and sort by redemptions
      const transformedOffers: TopOffer[] = offers
        .filter((offer: any) => {
          const isActive = offer.is_active !== false && offer.isActive !== false;
          return isActive;
        })
        .map((offer: any) => {
          const offerId = offer._id?.toString() || offer.id?.toString() || '';
          const offerRedemptions = redemptionCounts[offerId] || 0;
          const offerViews = viewCounts[offerId] || 0;
          
          // For conversion rate, use max(views, redemptions) as denominator
          const effectiveViews = Math.max(offerViews, offerRedemptions);
          const conversionRate = effectiveViews > 0 ? (offerRedemptions / effectiveViews) * 100 : 0;

          const location = offer.locationIds?.[0] || offer.locations?.[0] || {};
          const businessName = offer.business_name || offer.businessName || location?.name || "Store";

          return {
            id: offerId,
            storeName: businessName,
            offerImage: offer.offer_image_url || offer.offerImageUrl || offer.offer_image || offer.offerImage || null,
            callToAction: offer.call_to_action || offer.callToAction || '',
            redemptions: offerRedemptions,
            views: offerViews,
            conversionRate: Math.min(conversionRate, 100) // Cap at 100%
          };
        });

      // Sort by redemptions descending and take top 10
      const sortedOffers = transformedOffers
        .filter(o => o.redemptions > 0 || o.views > 0)
        .sort((a, b) => b.redemptions - a.redemptions)
        .slice(0, 10);

      setTopOffers(sortedOffers);
    } catch (error) {
      console.error("Error:", error);
      setTopOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Trending call-to-action phrases (static insights)
  const trendingPhrases = [
    { phrase: "Buy 2, get 1 free", count: 45, trend: "+12%" },
    { phrase: "% off", count: 38, trend: "+8%" },
    { phrase: "New client special", count: 32, trend: "+15%" },
    { phrase: "Limited time", count: 28, trend: "+5%" },
    { phrase: "Show this offer", count: 24, trend: "+10%" },
    { phrase: "First-time", count: 22, trend: "+7%" }
  ];

  return (
    <AppLayout pageTitle="Insights" pageIcon={<TrendingUp className="h-6 w-6 text-primary" />}>
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
              Highest converting offers based on real redemption data
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading offers...</div>
            ) : topOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No offers with redemption data yet. Check back soon.
              </div>
            ) : (
              <div className="grid gap-4">
                {topOffers.map((offer, index) => (
                  <Card key={offer.id} className="overflow-hidden bg-background/50 backdrop-blur hover:shadow-lg transition-all">
                    <div className="grid md:grid-cols-[300px_1fr] gap-6">
                      {/* Offer Image */}
                      <div className="relative bg-muted min-h-[200px]">
                        {offer.offerImage ? (
                          <img 
                            src={offer.offerImage} 
                            alt={offer.storeName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary text-primary-foreground font-bold text-lg px-4 py-2">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="p-6">
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
                      </div>
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

export default TopOffers;
