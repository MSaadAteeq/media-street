import { Eye, Ticket, Store, TrendingUp, Coffee, Flower } from "lucide-react";
import { Card } from "@/components/ui/card";
const PartnershipAccountability = () => {
    return <section className="py-24 px-4 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    We bring the receipts to retailer partnerships
                </h2>
                <p className="text-xl text-muted-foreground">
                    Google Ads-style metrics and accountability for cross-promotions
                </p>
            </div>

            {/* Sample Partnership */}
            <div className="mb-8 flex items-center justify-center gap-6">
                <Card className="p-4 flex items-center gap-3 flex-1 max-w-[20vw]">
                    <Coffee className="w-8 h-8 text-primary" />
                    <div>
                        <div className="font-semibold">Downtown Coffee</div>
                        <div className="text-sm text-muted-foreground">Sent Bloom Flowers 12 new customers</div>
                    </div>
                </Card>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <div className="text-sm font-medium">Partnership</div>
                </div>
                <Card className="p-4 flex items-center gap-3 flex-1 max-w-[20vw]">
                    <Flower className="w-8 h-8 text-emerald-500" />
                    <div>
                        <div className="font-semibold">Bloom Flowers</div>
                        <div className="text-sm text-muted-foreground">Sent Downtown Coffee 32 new customers.</div>
                    </div>
                </Card>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-sm text-muted-foreground">Downtown Coffee Views This Month</div>
                        <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">83</div>
                    <div className="text-sm text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        20% vs last month
                    </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-sm text-muted-foreground">Downtown Coffee Redemptions This Month</div>
                        <Ticket className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">32</div>
                    <div className="text-sm text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        24% vs last month
                    </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-sm text-muted-foreground">Bloom Flowers Views This Month</div>
                        <Eye className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-4xl font-bold text-emerald-500 mb-2">56</div>
                    <div className="text-sm text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        11% vs last month
                    </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-sm text-muted-foreground">Bloom Flowers Redemptions This Month</div>
                        <Ticket className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-4xl font-bold text-emerald-500 mb-2">12</div>
                    <div className="text-sm text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        14% vs last month
                    </div>
                </Card>
            </div>

            {/* ROI Estimates with Connector */}
            <div className="mt-8 flex items-center gap-4 max-w-5xl mx-auto">
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <Store className="w-6 h-6 text-primary" />
                        <div>
                            <div className="font-semibold text-lg">Downtown Coffee</div>
                            <div className="text-sm text-muted-foreground">Partnership ROI This Month</div>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                        ${(32 * 8).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        32 new customers × $8.00 avg purchase
                    </div>
                </Card>

                {/* Connector with Total ROI */}
                <div className="flex flex-col items-center gap-2 px-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 border-2 border-primary/30 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium mb-1">Total Partnership ROI</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                            ${((32 * 8) + (12 * 45)).toFixed(2)}
                        </div>
                    </div>
                </div>

                <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <Store className="w-6 h-6 text-emerald-500" />
                        <div>
                            <div className="font-semibold text-lg">Bloom Flowers</div>
                            <div className="text-sm text-muted-foreground">Partnership ROI This Month</div>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-500 mb-1">
                        ${(12 * 45).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        12 new customers × $45.00 avg purchase
                    </div>
                </Card>
            </div>
        </div>
    </section>;
};
export default PartnershipAccountability;