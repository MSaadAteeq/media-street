import { Badge } from "@/components/ui/badge";
import { Gift, Users } from "lucide-react";

const ReferralOffer = () => {
  return (
    <section className="py-12 bg-gradient-to-r from-primary/10 to-accent/10 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-lg font-semibold text-foreground">
                Referral Program
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Refer retailers and get
            </span>
            <Badge variant="default" className="text-lg px-3 py-1 bg-accent text-accent-foreground">
              points toward prizes!
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReferralOffer;