import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, QrCode, TrendingUp, DollarSign } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: QrCode,
      step: "01",
      title: "Create Your Offer",
      description: "Sign up and create an attractive offer that will be shared by other Media Street locations to drive traffic to your store.",
      highlight: "Free to start"
    },
    {
      icon: Store,
      step: "02", 
      title: "Find Partners",
      description: "Search for other nearby retailers and send a partner request. When accepted, you'll begin running their offer and they'll begin running yours!",
      highlight: "Strategic placement"
    },
    {
      icon: TrendingUp,
      step: "03",
      title: "Track Performance", 
      description: "See how your offers are performing in real-time by views, scans and offer redemptions. Renew partnerships performing the best.",
      highlight: "Performance driven"
    },
    {
      icon: DollarSign,
      step: "04",
      title: "Win Weekly Bonuses",
      description: "Drive the most QR code scans each week (Monday-Sunday) and earn a $1,000 bonus every Monday for top performance.",
      highlight: "$1,000 reward"
    }
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 space-y-3 sm:space-y-4">
          <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
            How It Works
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-2">
            Simple Steps to
            <span className="gradient-hero bg-clip-text text-transparent"> Success</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-foreground max-w-3xl mx-auto px-4">
            Join hundreds of local retailers already benefiting from cross-promotional QR code marketing. Partner and <span className="gradient-hero bg-clip-text text-transparent font-semibold">grow together on Media Street!</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative group hover:shadow-medium transition-all duration-300 border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {step.step}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <Badge variant="default" className="bg-accent-green text-accent-green-foreground">
                    {step.highlight}
                  </Badge>
                </div>
              </CardContent>
              
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-border"></div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;