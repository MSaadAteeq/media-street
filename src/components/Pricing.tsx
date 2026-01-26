import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Info } from "lucide-react";
import RequestInviteForm from "@/components/RequestInviteForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const Pricing = () => {
  return <section id="pricing" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 space-y-3 sm:space-y-4">
          <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
            The Network
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-2">
            Performance-based <span className="gradient-hero bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">Pay less (or nothing) for leads if you promote other businesses in your area</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Individual Partnerships Plan */}
          <Card className="relative border-primary/20 shadow-strong">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge variant="default" className="bg-accent-green text-accent-green-foreground px-4 py-2">
                <Star className="h-4 w-4 mr-1" />
                Individual Partnerships
              </Badge>
            </div>
            
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/30">
                  <span className="text-accent-green font-semibold">Profitable partnerships start here.</span>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Build your offer with AI</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Team up with other nearby retailers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Real-time partner performance tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Partner messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Estimated ROI calculation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Cancel partnerships any time</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <RequestInviteForm>
                  <Button variant="cta" size="xl" className="w-full">
                    Find Your First Partner for Free
                  </Button>
                </RequestInviteForm>
                <div className="text-sm text-muted-foreground mt-3 space-y-2">
                  <p className="font-medium text-foreground">$10/month per partnership</p>
                  <p>Minimal setup required • Cancel anytime • Free if you drive more conversions for your partner</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Offer Plan */}
          <Card className="relative border-primary/20 shadow-strong">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge variant="default" className="bg-accent-green text-accent-green-foreground px-4 py-2">
                <Star className="h-4 w-4 mr-1" />
                Open Offer
              </Badge>
            </div>
            
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/30">
                  <span className="text-accent-green font-semibold">Max reach for your offer, minimal effort</span>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Build your offer with AI</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground inline-flex items-center gap-1.5 cursor-help">
                            AI offer scheduling optimization
                            <Info className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Open Offer utilizes AI to continuously refine a delivery schedule for your offer that optimizes conversions based on criteria such as time of day, retailer compatibility, foot traffic and other factors</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Your offer in nearby retailers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Real-time performance tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">OO credit for referrals to other retailers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-green" />
                    <span className="text-muted-foreground">Cancel subscription any time</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <RequestInviteForm>
                  <Button variant="cta" size="xl" className="w-full">
                    Join Open Offer by Media Street
                  </Button>
                </RequestInviteForm>
                <div className="text-sm text-muted-foreground mt-3 space-y-2">
                  <p className="font-medium text-foreground">$25/month subscription</p>
                  <p></p>
                  <p className="text-sm">Automatic distribution • AI-powered • Cancel anytime • Discounts or free when you promote the network</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Questions about pricing?  Contact us <a href="mailto:hi@mediastreet.ai" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </section>;
};
export default Pricing;