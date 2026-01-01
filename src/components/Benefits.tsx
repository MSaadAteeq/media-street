import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Users, BarChart3, MapPin, Zap, Trophy, ArrowRight } from "lucide-react";
import RequestInviteForm from "./RequestInviteForm";
const Benefits = () => {
  const benefits = [{
    icon: Target,
    title: "Cross-Promotional Reach",
    description: "Your offers appear at multiple partner locations, expanding your customer base beyond your physical store.",
    metric: "3x more exposure"
  }, {
    icon: Users,
    title: "Customer Acquisition",
    description: "Attract new customers from nearby businesses who discover your offers through strategic QR code placements.",
    metric: "85% new customers"
  }, {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track offer views, scan rates and conversion with real-time insights to see which partnerships are pulling their weight.",
    metric: "Real-time data"
  }, {
    icon: MapPin,
    title: "Local Network Effect",
    description: "Build relationships with nearby retailers and create a supportive local business ecosystem.",
    metric: "Community driven"
  }, {
    icon: Zap,
    title: "Easy Implementation",
    description: "Download the POS app, find partners and start driving traffic immediately.",
    metric: "5-minute setup"
  }, {
    icon: Trophy,
    title: "Weekly $1,000 Bonus",
    description: "Compete for the top spot each week and earn substantial bonuses for driving the most QR code engagement.",
    metric: "Every Monday"
  }];
  return <section id="benefits" className="py-12 sm:py-16 md:py-20 lg:py-24 qr-pattern">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center mb-10 sm:mb-12 md:mb-16 space-y-3 sm:space-y-4">
        <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
          Why Choose Media Street
        </Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">
          <span className="text-muted-foreground">Drive More Traffic,</span>
          <span className="gradient-hero bg-clip-text text-transparent"> Earn More Revenue</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
          Build an army of local business partners today
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
        {benefits.map((benefit, index) => <Card key={index} className="group hover:shadow-medium transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl gradient-primary group-hover:scale-110 transition-transform">
                <benefit.icon className="h-6 w-6 text-white" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-accent-green border-accent-green/30">
                {benefit.metric}
              </Badge>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          </CardContent>
        </Card>)}
      </div>

      {/* Weekly Bonus Highlight */}
      <div className="relative">
        <div className="absolute inset-0 gradient-hero rounded-2xl opacity-10"></div>
        <Card className="relative border-accent-green/30 shadow-strong">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent-green/10 border border-accent-green/30">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent-green" />
              <span className="text-sm sm:text-base text-accent-green font-semibold">Weekly Competition</span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground px-2">
                Win <span className="text-accent-green">$1,000</span> Every Week
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">The retailer driving the most offer redemptions from Monday to Sunday wins a $1,000 bonus every Monday. As more retailers join, the pot grows!</p>
            </div>
            <RequestInviteForm>

              <Button variant="cta" size="xl" className="group w-full sm:w-auto">
                Start Competing Today
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </RequestInviteForm>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>;
};
export default Benefits;