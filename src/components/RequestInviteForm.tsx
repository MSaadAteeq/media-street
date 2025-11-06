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
import { ArrowRight, CheckCircle, Facebook, Twitter, Linkedin, Send } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  retailAddress: z.string().min(5, "Please enter a valid address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestInviteFormProps {
  children: React.ReactNode;
}

const RequestInviteForm = ({ children }: RequestInviteFormProps) => {
  const [open, setOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      storeName: "",
      retailAddress: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Form submitted:", values);
    
    setIsSubmitting(false);
    setOpen(false);
    form.reset();
    
    // Show success message
    toast.success("Request submitted! We'll be in touch soon.");
  };

  const shareUrl = "https://offerave.com";
  const shareText = "Check out Media Street - the smart way for local businesses to cross-promote with each other!";

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsSendingInvite(true);
    
    // Simulate sending invite email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail("");
    setIsSendingInvite(false);
  };

  const handleShare = (platform: string) => {
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            Request Access
          </DialogTitle>
          <DialogDescription>
            Join the Media Street™ network as a retail location and start cross-promoting with nearby retailers today.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Store Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
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
                    <FormLabel>Work Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="john@store.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="hero" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Share Dialog */}
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-hero bg-clip-text text-transparent flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Request Submitted!
          </DialogTitle>
          <DialogDescription className="text-base">
            Thank you! Your invite request has been submitted. We'll be in touch soon!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              Don't keep it a secret.
            </p>
            <p className="text-muted-foreground">
              Share Media Street now and we'll bump you up the wait list.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleShare("facebook")}
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px]"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleShare("twitter")}
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px]"
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleShare("linkedin")}
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px]"
              >
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Invite another retailer to Media Street:</p>
              <div className="flex gap-2">
                <Input 
                  type="email"
                  placeholder="Enter retailer's email..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendInvite();
                    }
                  }}
                />
                <Button
                  onClick={handleSendInvite}
                  variant="outline"
                  disabled={!inviteEmail.trim() || isSendingInvite}
                  className="shrink-0"
                >
                  {isSendingInvite ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default RequestInviteForm;