import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";

const RetailerCallout = () => {
  return (
    <section className="py-8 bg-accent/10 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <Store className="h-5 w-5 text-accent" />
            </div>
            <Badge variant="outline" className="text-sm font-medium">
              For Retailers
            </Badge>
          </div>
          <span className="text-lg text-foreground font-medium">
            Run your own post-purchase offer in your stores <span className="text-accent font-semibold">free</span> to keep customers shopping and coming back.
          </span>
        </div>
      </div>
    </section>
  );
};

export default RetailerCallout;