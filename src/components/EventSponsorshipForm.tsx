import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Calendar } from "lucide-react";

const formSchema = z.object({
  eventWebsite: z.string().url("Please enter a valid website URL"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface EventSponsorshipFormProps {
  children: React.ReactNode;
}

const EventSponsorshipForm = ({ children }: EventSponsorshipFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventWebsite: "",
      name: "",
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Event sponsorship application submitted:", values);
    
    setIsSubmitting(false);
    setOpen(false);
    form.reset();
    
    // Show success message
    toast.success("Application submitted! We'll review your event and get back to you soon.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-hero bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Event Sponsorship Application
          </DialogTitle>
          <DialogDescription>
            Promote event ticket sales and awareness across our OpenOffer network of local retailers near you completely free.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Website *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourevent.com" type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@event.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">What you'll get:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Free ticket promotion across local retail network</li>
                <li>✓ Increased visibility in your community</li>
                <li>✓ Drive more ticket sales and local awareness for your upcoming event</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="hero" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventSponsorshipForm;
