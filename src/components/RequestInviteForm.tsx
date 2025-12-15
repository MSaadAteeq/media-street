import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Zap, Globe, SkipForward, Check, AlertCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// import OfferPreviewCard from "@/components/OfferPreviewCard";
import OfferPreviewCard from "./OfferPreviewCard";
import { AddCardForm } from "./AddCardForm";
import { post, get } from "@/services/apis";
import { RETAIL_CHANNELS } from "@/constants/retailChannels";
import { useDispatch } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  retailChannel: z.string().min(1, "Please select a retail channel"),
  retailAddress: z.string().min(5, "Please enter a valid address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

const offerSchema = z.object({
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  callToAction: z.string().min(5, "Offer must be at least 5 characters").max(48, "Offer must be less than 48 characters"),
});

type FormValues = z.infer<typeof formSchema>;
type OfferFormValues = z.infer<typeof offerSchema>;

interface RequestInviteFormProps {
  children: React.ReactNode;
}

const RequestInviteForm = ({ children }: RequestInviteFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [offerCreated, setOfferCreated] = useState(false);
  const [generatedOfferData, setGeneratedOfferData] = useState<{
    businessName: string;
    offerImageUrl: string | null;
    brandLogoUrl: string | null;
    brandColors: { primary: string; secondary: string };
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean;
    storeName: string;
  } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      storeName: "",
      retailChannel: "",
      retailAddress: "",
      phone: "",
      email: "",
      password: "",
      referralCode: "",
    },
  });

  const offerForm = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      website: "",
      callToAction: "",
    },
  });

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation(null);
      return;
    }
    setIsValidatingReferral(true);
    try {
      // TODO: Implement referral code validation API endpoint
      // For now, skip validation - will be handled by backend during signup
      setReferralValidation({ isValid: true, storeName: '' });
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralValidation({ isValid: false, storeName: '' });
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Sign up the user using Node.js API
      const response = await post({
        end_point: 'auth/signup',
        body: {
          email: values.email,
          password: values.password,
          fullName: `${values.firstName} ${values.lastName}`,
          storeName: values.storeName,
          location_name: values.storeName,
          retail_channel: values.retailChannel,
          address: values.retailAddress,
          phone: values.phone,
          referral_code: values.referralCode ? values.referralCode.toUpperCase().trim() : undefined
        },
        token: false
      });

      if (!response.success) {
        if (response.message?.includes("already registered") || response.message?.includes("already exists")) {
          toast.error("This email is already registered. Please sign in instead.");
          setIsSubmitting(false);
          return;
        }
        throw new Error(response.message || "Failed to create account");
      }

      if (!response.data?.user) {
        throw new Error("Failed to create account");
      }

      const userData = response.data.user;
      setUserId(userData._id || userData.id);

      // Get location ID from response (should be created during signup)
      if (response.data.location?._id || response.data.location?.id) {
        setLocationId(response.data.location._id || response.data.location.id);
      } else if (response.data.locations && response.data.locations.length > 0) {
        setLocationId(response.data.locations[0]._id || response.data.locations[0].id);
      }

      // Store token and login user
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Dispatch auth actions
      dispatch(authActions.login({
        email: userData.email || values.email,
        fullName: userData.fullName || `${values.firstName} ${values.lastName}`
      }));

      const userRole = userData.role || 'retailer';
      dispatch(authActions.role({ role: userRole }));
      localStorage.setItem('userRole', userRole);

      if (values.referralCode && referralValidation?.isValid) {
        toast.success(`Thanks for using the referral code!`);
      }

      toast.success("Account created successfully!");

      // Move to step 2 (optional offer creation)
      setCurrentStep(2);

    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateOffer = async () => {
    const website = offerForm.getValues("website");
    if (!website) {
      toast.error("Please enter your website URL to generate an offer");
      return;
    }

    setIsGeneratingOffer(true);
    try {
      const response = await post({
        end_point: 'offers/generate-from-website',
        body: { website },
        token: false
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate offer');
      }

      const data = response.data;
      if (data?.callToAction) {
        offerForm.setValue("callToAction", data.callToAction);
        setGeneratedOfferData({
          businessName: data.businessName || form.getValues("storeName") || "Your Business",
          offerImageUrl: data.offerImageUrl || null,
          brandLogoUrl: data.brandLogoUrl || null,
          brandColors: data.brandColors || { primary: "#6366f1", secondary: "#4f46e5" },
        });
        setShowPreview(true);
        toast.success("Offer generated! Review your preview below.");
      }
    } catch (error: any) {
      console.error("Error generating offer:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to generate offer. Please enter one manually.");
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  const handleChangeOfferImage = async () => {
    const website = offerForm.getValues("website");
    if (!website) return;

    setIsGeneratingOffer(true);
    try {
      const response = await post({
        end_point: 'offers/generate-from-website',
        body: { website, regenerateImage: true },
        token: false
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to regenerate image');
      }

      const data = response.data;
      if (data?.offerImageUrl && generatedOfferData) {
        setGeneratedOfferData({
          ...generatedOfferData,
          offerImageUrl: data.offerImageUrl,
        });
        toast.success("Image updated!");
      }
    } catch (error: any) {
      console.error("Error regenerating image:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to change image. Please try again.");
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  const handleCreateOffer = async (values: OfferFormValues) => {
    if (!userId || !locationId) {
      toast.error("Session expired. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare location_images map for the offer
      const locationImages: { [key: string]: string } = {};
      if (generatedOfferData?.offerImageUrl) {
        locationImages[locationId] = generatedOfferData.offerImageUrl;
      }

      const response = await post({
        end_point: 'offers',
        body: {
          call_to_action: values.callToAction,
          location_ids: [locationId],
          offer_image: generatedOfferData?.offerImageUrl || null,
          brand_logo: generatedOfferData?.brandLogoUrl || null,
          location_images: Object.keys(locationImages).length > 0 ? locationImages : undefined,
          expiration_duration: 30, // Default 30 days
          available_for_partnership: true
        },
        token: true
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to create offer");
      }

      setOfferCreated(true);
      toast.success("Offer created successfully!");
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to create offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribeOpenOffer = async () => {
    if (!locationId) {
      toast.error("Session expired. Please try again.");
      return;
    }

    // If no payment method, show the card form
    if (!hasPaymentMethod) {
      setShowCardForm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Store Open Offer subscription in localStorage (matching Locations.tsx behavior)
      const stored = localStorage.getItem('openOfferLocations');
      const openOfferSet = new Set(stored ? JSON.parse(stored) : []);
      openOfferSet.add(locationId);
      localStorage.setItem('openOfferLocations', JSON.stringify([...openOfferSet]));

      toast.success("Open Offer subscription activated! Your offer will be distributed to local retailers.");

      // Navigate to dashboard
      setOpen(false);
      form.reset();
      offerForm.reset();
      setCurrentStep(1);
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Error subscribing to Open Offer:", error);
      toast.error("Failed to subscribe. Please try again from the dashboard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardAdded = () => {
    setHasPaymentMethod(true);
    setShowCardForm(false);
    toast.success("Card added successfully!");
  };

  const handleSkipToDashboard = () => {
    setOpen(false);
    form.reset();
    offerForm.reset();
    setCurrentStep(1);
    navigate("/dashboard");
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset to step 1 when closing
      setCurrentStep(1);
      form.reset();
      offerForm.reset();
      setOfferCreated(false);
      setReferralValidation(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            {currentStep === 1 && "Join Media Street"}
            {currentStep === 2 && "Create Your First Offer"}
            {currentStep === 3 && "Subscribe to Open Offer"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 && "Join the Media Street™ network as a retail location and start cross-promoting with nearby retailers today."}
            {currentStep === 2 && "Create an offer to attract new customers from partner retailers. (Optional)"}
            {currentStep === 3 && "Get your offer distributed to local retailers for maximum visibility."}
          </DialogDescription>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Account Creation */}
        {currentStep === 1 && (
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
                name="retailChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Channel *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select retail channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50">
                        {RETAIL_CHANNELS.map((channel) => (
                          <SelectItem key={channel.value} value={channel.value}>
                            {channel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <Input type="email" placeholder="john@store.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimum 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter referral code"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validateReferralCode(e.target.value);
                        }}
                      />
                    </FormControl>
                    {isValidatingReferral && (
                      <p className="text-xs text-muted-foreground">Validating...</p>
                    )}
                    {referralValidation && !isValidatingReferral && (
                      referralValidation.isValid ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Referred by {referralValidation.storeName}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Invalid referral code
                        </p>
                      )
                    )}
                    <p className="text-xs text-muted-foreground">Have a referral code? Enter it to reward the referring retailer.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>
        )}

        {/* Step 2: Create Offer (Optional) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Form {...offerForm}>
              <form onSubmit={offerForm.handleSubmit(handleCreateOffer)} className="space-y-4">
                <FormField
                  control={offerForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Website (Optional)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateOffer}
                          disabled={isGeneratingOffer || !field.value}
                        >
                          {isGeneratingOffer ? (
                            <span className="animate-spin">⚡</span>
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Enter your website to auto-generate an offer with AI</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Offer Preview */}
                {showPreview && generatedOfferData && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview</p>
                    <OfferPreviewCard
                      businessName={generatedOfferData.businessName}
                      callToAction={offerForm.watch("callToAction")}
                      offerImageUrl={generatedOfferData.offerImageUrl}
                      brandLogoUrl={generatedOfferData.brandLogoUrl}
                      brandColors={generatedOfferData.brandColors}
                      onChangeImage={handleChangeOfferImage}
                      isChangingImage={isGeneratingOffer}
                      showChangeImageButton={true}
                    />
                  </div>
                )}

                <FormField
                  control={offerForm.control}
                  name="callToAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Offer *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Get 10% off on your first visit!"
                          {...field}
                          maxLength={48}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {48 - (field.value?.length || 0)} characters left
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Offer"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleSkipToDashboard}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip and go to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You can create offers later from your dashboard
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Open Offer Subscription */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {showCardForm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CreditCard className="h-5 w-5" />
                  <h4 className="font-semibold">Add Payment Method</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add a card to subscribe to Open Offer. Your card will be charged $25/month.
                </p>
                <AddCardForm
                  onSuccess={handleCardAdded}
                  onCancel={() => setShowCardForm(false)}
                />
              </div>
            ) : (
              <>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Globe className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold">What is Open Offer?</h4>
                        <p className="text-sm text-muted-foreground">
                          Open Offer distributes your offer to non-competing local retailers in the Media Street network, giving you maximum visibility without needing to find partners individually.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-primary/10 pt-4">
                      <h4 className="font-semibold mb-2">Turning on Open Offer will:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Show your offer at other nearby OO retailers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Show non-competing OO retailer offers at yours</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Activate analytics on offer views and redemptions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Start a <strong>$25/month</strong> subscription for this location</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleSubscribeOpenOffer}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Joining..." : "Join Open Offer ($25/month)"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    I authorize Media Street to charge my card on file until cancelled.
                  </p>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={handleSkipToDashboard}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip and go to Dashboard
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You can subscribe to Open Offer later from Store Locations
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestInviteForm;
