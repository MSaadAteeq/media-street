import { Button } from "@/components/ui/button";
import { Calendar, Ticket } from "lucide-react";
import EventSponsorshipForm from "@/components/EventSponsorshipForm";

const EventSponsorshipCallout = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-accent/10 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-primary/20 rounded-2xl p-8 md:p-12 shadow-strong">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Are you an event?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Apply for the Media Street event sponsorship program!
                </p>
                <p className="text-muted-foreground">
                  Promote ticket sales and event awareness in local retailers near you for free.
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <EventSponsorshipForm>
                  <Button 
                    size="lg" 
                    className="bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground"
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    Apply Now
                  </Button>
                </EventSponsorshipForm>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventSponsorshipCallout;
