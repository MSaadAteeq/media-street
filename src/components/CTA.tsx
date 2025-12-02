import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RequestInviteForm from "@/components/RequestInviteForm";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Store, 
  TrendingUp,
  Star,
  Footprints
} from "lucide-react";

const CTA = () => {
  const features = [
    "Free account setup and onboarding",
    "Real-time analytics dashboard",
    "Local retailer network access", 
    "Offer distribution to real live humans at hundreds of actual retailers",
    "Weekly prizes and incentives",
    "AI suggestions to improve offers and conversions"
  ];

  const stats = [
    { label: "Active Retailers", value: "100+", icon: Store },
    { label: "Weekly Scans", value: "25K+", icon: TrendingUp }, 
    { label: "Avg Rating", value: "4.8★", icon: Star },
    { label: "Setup Time", value: "5min", icon: Clock }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main CTA Card */}
        <Card className="relative max-w-4xl mx-auto shadow-strong border-primary/20">
          <div className="absolute inset-0 gradient-hero rounded-xl opacity-10"></div>
          <CardContent className="relative p-4 sm:p-6 md:p-8 lg:p-12 text-center space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                Request Access
              </Badge>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-2">
                  Start Driving
                  <span className="gradient-hero bg-clip-text text-transparent"> Foot Traffic Today</span>
                </h2>
                {/* Footprint icons */}
                <Footprints className="absolute -left-8 sm:-left-12 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 text-primary/50 hidden lg:block" />
                <Footprints className="absolute -right-8 sm:-right-12 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 text-primary/50 hidden lg:block rotate-180" />
                <Footprints className="absolute left-2 sm:left-4 -bottom-8 sm:-bottom-10 h-4 w-4 sm:h-6 sm:w-6 text-primary/40 rotate-45 hidden sm:block" />
                <Footprints className="absolute right-2 sm:right-4 -bottom-8 sm:-bottom-10 h-4 w-4 sm:h-6 sm:w-6 text-primary/40 -rotate-45 hidden sm:block" />
              </div>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Join retailers already benefiting from quick cross-promotional marketing. Set up takes less than 5 minutes and you can turn on new partnerships instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RequestInviteForm>
                <Button variant="hero" size="xl" className="group">
                  Join as Retailer
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </RequestInviteForm>
              <a 
                href="https://www.youtube.com/@media-street-ads" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="cta-outline" size="xl">
                  View Demo
                </Button>
              </a>
            </div>

            <div className="pt-6 sm:pt-8 border-t border-border/50">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                What's included in your free account:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-left max-w-2xl mx-auto">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-10 sm:mt-12 md:mt-16 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-1 sm:space-y-2">
                <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mx-auto" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTA;