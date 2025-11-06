import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles } from "lucide-react";

const FreeTrialCallout = () => {
  return (
    <section className="py-8 bg-gradient-to-r from-accent/20 to-primary/20 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/30">
              <Gift className="h-6 w-6 text-accent" />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Try for Free!
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg text-muted-foreground">
              Your first partnership campaign is
            </span>
            <Badge variant="default" className="text-lg px-4 py-2 bg-primary text-primary-foreground font-semibold">
              on us!
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeTrialCallout;