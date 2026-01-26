import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Ticket, TrendingUp, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { get } from "@/services/apis";
import { toast } from "sonner";

interface PartnershipAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnership: {
    id: string;
    partnerStoreName: string;
    yourStoreName: string;
    createdAt: string;
  } | null;
}

interface AnalyticsData {
  last30Days: {
    partnerRedemptions: number;
    yourRedemptions: number;
  };
  allTime: {
    partnerRedemptions: number;
    yourRedemptions: number;
  };
  chartData: {
    week: string;
    partnerRedemptions: number;
    yourRedemptions: number;
  }[];
}

const PartnershipAnalyticsDialog = ({ open, onOpenChange, partnership }: PartnershipAnalyticsDialogProps) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    last30Days: { partnerRedemptions: 0, yourRedemptions: 0 },
    allTime: { partnerRedemptions: 0, yourRedemptions: 0 },
    chartData: []
  });

  useEffect(() => {
    if (open && partnership) {
      fetchAnalyticsData();
    }
  }, [open, partnership]);

  const fetchAnalyticsData = async () => {
    if (!partnership) return;
    
    setIsLoadingData(true);
    try {
      // Fetch redemptions for this partnership
      const redemptionsResponse = await get({
        end_point: 'redemptions',
        token: true
      });

      if (redemptionsResponse.success && redemptionsResponse.data) {
        const partnershipCreatedAt = new Date(partnership.createdAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const partnerName = partnership.partnerStoreName.toLowerCase();
        const yourName = partnership.yourStoreName.toLowerCase();

        let allTimePartnerRedemptions = 0;
        let allTimeYourRedemptions = 0;
        let last30DaysPartnerRedemptions = 0;
        let last30DaysYourRedemptions = 0;

        // Weekly data for chart (last 4 weeks)
        const weeklyData: { [key: string]: { partnerRedemptions: number; yourRedemptions: number } } = {
          'Week 1': { partnerRedemptions: 0, yourRedemptions: 0 },
          'Week 2': { partnerRedemptions: 0, yourRedemptions: 0 },
          'Week 3': { partnerRedemptions: 0, yourRedemptions: 0 },
          'Week 4': { partnerRedemptions: 0, yourRedemptions: 0 }
        };

        redemptionsResponse.data.forEach((redemption: any) => {
          const redeemedAt = new Date(redemption.redeemedAt || redemption.createdAt);
          if (redeemedAt < partnershipCreatedAt) return; // Only count redemptions after partnership started

          const daysAgo = Math.floor((now.getTime() - redeemedAt.getTime()) / (24 * 60 * 60 * 1000));
          const referrer = (redemption.metadata?.referringStore || '').toLowerCase().trim();

          const isPartnerReferrer = referrer === partnerName.trim() || 
            referrer.includes(partnerName.trim()) || 
            partnerName.trim().includes(referrer);
          const isYourReferrer = referrer === yourName.trim() || 
            referrer.includes(yourName.trim()) || 
            yourName.trim().includes(referrer);

          // Count redemptions based on referrer
          if (isPartnerReferrer) {
            allTimeYourRedemptions++;
            if (redeemedAt >= thirtyDaysAgo) {
              last30DaysYourRedemptions++;
            }
            // Assign to week buckets
            if (daysAgo <= 7) {
              weeklyData['Week 4'].yourRedemptions++;
            } else if (daysAgo <= 14) {
              weeklyData['Week 3'].yourRedemptions++;
            } else if (daysAgo <= 21) {
              weeklyData['Week 2'].yourRedemptions++;
            } else if (daysAgo <= 28) {
              weeklyData['Week 1'].yourRedemptions++;
            }
          }

          if (isYourReferrer) {
            allTimePartnerRedemptions++;
            if (redeemedAt >= thirtyDaysAgo) {
              last30DaysPartnerRedemptions++;
            }
            // Assign to week buckets
            if (daysAgo <= 7) {
              weeklyData['Week 4'].partnerRedemptions++;
            } else if (daysAgo <= 14) {
              weeklyData['Week 3'].partnerRedemptions++;
            } else if (daysAgo <= 21) {
              weeklyData['Week 2'].partnerRedemptions++;
            } else if (daysAgo <= 28) {
              weeklyData['Week 1'].partnerRedemptions++;
            }
          }
        });

        const chartData = [
          { week: 'Week 1', ...weeklyData['Week 1'] },
          { week: 'Week 2', ...weeklyData['Week 2'] },
          { week: 'Week 3', ...weeklyData['Week 3'] },
          { week: 'Week 4', ...weeklyData['Week 4'] }
        ];

        setAnalyticsData({
          last30Days: {
            partnerRedemptions: last30DaysPartnerRedemptions,
            yourRedemptions: last30DaysYourRedemptions
          },
          allTime: {
            partnerRedemptions: allTimePartnerRedemptions,
            yourRedemptions: allTimeYourRedemptions
          },
          chartData
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!partnership) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Partnership Analytics
          </DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading analytics...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Partner Redemptions</p>
                      <p className="text-2xl font-bold">{analyticsData.last30Days.partnerRedemptions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Your Redemptions</p>
                      <p className="text-2xl font-bold text-primary">{analyticsData.last30Days.yourRedemptions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">All Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Partner Redemptions</p>
                      <p className="text-2xl font-bold">{analyticsData.allTime.partnerRedemptions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Your Redemptions</p>
                      <p className="text-2xl font-bold text-primary">{analyticsData.allTime.yourRedemptions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {analyticsData.chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Redemptions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="partnerRedemptions" stroke="#8884d8" name="Partner Redemptions" />
                      <Line type="monotone" dataKey="yourRedemptions" stroke="#82ca9d" name="Your Redemptions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Partnership Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Partnership Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Partner:</span>
                    <span className="font-medium">{partnership.partnerStoreName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Store:</span>
                    <span className="font-medium">{partnership.yourStoreName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">{new Date(partnership.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartnershipAnalyticsDialog;
