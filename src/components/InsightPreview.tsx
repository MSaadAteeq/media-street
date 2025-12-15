import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import RequestInviteForm from "./RequestInviteForm";
const InsightsPreview = () => {
    const trendingPhrases = [{
        phrase: '"Buy 2, get 1 free"',
        count: 45,
        trend: '+12%'
    }, {
        phrase: '"% off"',
        count: 38,
        trend: '+8%'
    }, {
        phrase: '"New client special"',
        count: 32,
        trend: '+15%'
    }, {
        phrase: '"Limited time"',
        count: 28,
        trend: '+5%'
    }];
    const keyInsights = ['Offers with urgency ("limited time", "today only") convert 23% better', '"Buy X, get Y free" messaging drives highest redemption rates', 'First-time customer specials attract 3x more new visitors'];
    return <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-muted/20 via-background to-muted/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-green/5 rounded-full blur-3xl animate-pulse" style={{
                animationDelay: '1s'
            }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-12 sm:mb-16 space-y-4">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 border-primary/20 hover:bg-primary/15 transition-colors">
                    <Sparkles className="h-4 w-4 mr-2 inline text-primary" />
                    Retail Marketing Insights
                </Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold px-2">
                    Learn What's <span className="gradient-hero bg-clip-text text-transparent">Working Best</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mx-auto px-4 whitespace-nowrap">Get insights from top-performing promotional offers across the Media Street Network</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Trending Phrases Preview */}
                <Card className="bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">Trending Call-to-Action Phrases</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">Most used phrases in successful offers this month</p>

                        <div className="grid grid-cols-2 gap-4">
                            {trendingPhrases.map((item, index) => <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/40 hover:from-primary/5 hover:to-muted/30 transition-all duration-300 group/card" style={{
                                animationDelay: `${index * 100}ms`
                            }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-foreground text-sm">{item.phrase}</span>
                                    <Badge variant="outline" className="text-xs text-accent-green border-accent-green/40 bg-accent-green/10">
                                        {item.trend}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used in <strong className="text-foreground">{item.count}</strong> offers
                                </p>
                            </div>)}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Insights Preview */}
                <Card className="bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm border-border/50 hover:border-accent-yellow/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent-yellow/5 group">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-accent-yellow/10 group-hover:bg-accent-yellow/15 transition-colors">
                                <Lightbulb className="h-5 w-5 text-accent-yellow" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">Key Insights</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">Data-driven learnings from top performers</p>

                        <ul className="space-y-4">
                            {keyInsights.map((insight, index) => <li key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-accent-yellow/30 transition-all duration-300">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>
                                <span className="text-sm text-muted-foreground leading-relaxed">{insight}</span>
                            </li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center mt-10">
                <RequestInviteForm>
                    <Button variant="outline" size="lg" className="group bg-background/50 hover:bg-primary/10 border-primary/30 hover:border-primary/50">
                        Explore All Insights
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </RequestInviteForm>
            </div>
        </div>
    </section>;
};
export default InsightsPreview;