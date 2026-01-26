import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Zap, ArrowRight, SkipForward, Check, AlertCircle, CreditCard, Gift, DollarSign, Eye, EyeOff } from "lucide-react";
import { AddCardForm } from "@/components/AddCardForm";
import Logo from "@/components/Logo";
import OfferPreviewCard from "@/components/OfferPreviewCard";
import smallBusinessPartnerships from "@/assets/small-business-partnerships.jpg";
import { post, get } from "@/services/apis";
import { useDispatch } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";
import { RETAIL_CHANNELS } from "@/constants/retailChannels";
import LocationPicker from "@/components/LocationPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password doesn't match",
  path: ["confirmPassword"],
});

const storeDetailsSchema = z.object({
  storeLocation: z.string().min(10, "Please enter a complete address"),
  storeName: z.string().min(1, "Store name is required"),
  retailChannel: z.string().min(1, "Retail channel is required"),
});

const referralSchema = z.object({
  referralStore: z.string().optional(),
  referralCode: z.string().optional(),
});

const offerSchema = z.object({
  website: z.string()
    .refine((val) => {
      // Allow empty string (optional field)
      if (!val || val.trim() === "") return true;
      
      // Normalize the URL - add https:// if no protocol is present
      let urlToValidate = val.trim();
      if (!urlToValidate.match(/^https?:\/\//i)) {
        urlToValidate = `https://${urlToValidate}`;
      }
      
      // Validate as URL
      try {
        new URL(urlToValidate);
        return true;
      } catch {
        return false;
      }
    }, {
      message: "Please enter a valid URL"
    })
    .optional(),
  callToAction: z.string().min(5, "Offer must be at least 5 characters").max(48, "Offer must be less than 48 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type StoreDetailsFormData = z.infer<typeof storeDetailsSchema>;
type ReferralFormData = z.infer<typeof referralSchema>;
type OfferFormData = z.infer<typeof offerSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [signupStep, setSignupStep] = useState(1);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [offerCreated, setOfferCreated] = useState(false);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [generatedOfferData, setGeneratedOfferData] = useState<{
    businessName: string;
    offerImageUrl: string | null;
    brandLogoUrl: string | null;
    brandColors: { primary: string; secondary: string };
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showWelcomeCreditsDialog, setShowWelcomeCreditsDialog] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [selectedLatitude, setSelectedLatitude] = useState<number | undefined>(undefined);
  const [selectedLongitude, setSelectedLongitude] = useState<number | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [referralRetailerName, setReferralRetailerName] = useState<string | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  // Default location: 501 West 28th Street, New York, New York 10001, United States
  const DEFAULT_LATITUDE = 40.7505; // Coordinates for 501 W 28th St, New York, NY 10001
  const DEFAULT_LONGITUDE = -74.0014;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  const storeDetailsForm = useForm<StoreDetailsFormData>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      storeLocation: "",
      storeName: "",
      retailChannel: "",
    },
  });

  const referralForm = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralStore: "",
      referralCode: "",
    },
  });

  const offerForm = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      website: "",
      callToAction: "",
    },
  });

  // Get user's current location when signup tab is active
  useEffect(() => {
    if (activeTab === 'signup' && !isGettingLocation) {
      setIsGettingLocation(true);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setSelectedLatitude(lat);
            setSelectedLongitude(lng);
            setIsGettingLocation(false);
          },
          (error) => {
            setSelectedLatitude(DEFAULT_LATITUDE);
            setSelectedLongitude(DEFAULT_LONGITUDE);
            setIsGettingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      } else {
        setSelectedLatitude(DEFAULT_LATITUDE);
        setSelectedLongitude(DEFAULT_LONGITUDE);
        setIsGettingLocation(false);
      }
    }
  }, [activeTab]);

  const handleLocationSelect = (latitude: number, longitude: number, address?: string) => {
    setSelectedLatitude(latitude);
    setSelectedLongitude(longitude);
    if (address) {
      storeDetailsForm.setValue("storeLocation", address);
    }
  };

  const onSignIn = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await post({
        end_point: `auth/login`,
        body: {
          email: data.email,
          password: data.password
        }
      });

      if (response.success && response.data) {
        // Get role from response, fallback to token, then default to retailer
        let userRole = response.data.user?.role;
        
        // If role not in response, try to get it from token
        if (!userRole) {
          try {
            const token = response.data.token;
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              if (payload.role) {
                userRole = payload.role;
              }
            }
          } catch (e) {
            console.warn('Could not decode role from token:', e);
          }
        }
        
        // Default to retailer if still no role found
        userRole = userRole || 'retailer';
        
        // Log user info for debugging
        console.log('[FRONTEND LOGIN] User email:', response.data.user?.email);
        console.log('[FRONTEND LOGIN] User role from response:', response.data.user?.role);
        console.log('[FRONTEND LOGIN] Final userRole:', userRole);
        
        dispatch(authActions.login({ 
          email: response.data.user?.email || data.email, 
          fullName: response.data.user?.fullName || 'User' 
        }));
        dispatch(authActions.role({ role: userRole }));
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        localStorage.setItem('userRole', userRole);
        
        toast({
          title: "Welcome back!",
          description: response.message || "You've been signed in successfully.",
        });
        
        // Redirect based on role (case-insensitive check)
        const normalizedRole = String(userRole || '').toLowerCase().trim();
        console.log('[FRONTEND LOGIN] Normalized role for redirect:', normalizedRole);
        
        // Force redirect to admin if role is admin
        if (normalizedRole === 'admin') {
          console.log('[FRONTEND LOGIN] Redirecting to /admin');
          navigate("/admin", { replace: true });
        } else {
          console.log('[FRONTEND LOGIN] Redirecting to /dashboard');
          navigate("/dashboard", { replace: true });
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: response.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error?.response?.data?.message || error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignupFormData) => {
    setIsLoading(true);
    setIsSigningUp(true);
    try {
      const response = await post({
        end_point: `auth/signup`,
        body: {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          // retail_channel will be set in step 3 when creating location
        }
      });

      if (response.success && response.data) {
        let userRole = response.data.user?.role || 'retailer';
        
        if (response.data.token) {
          // Store token temporarily in sessionStorage during signup flow
          // This prevents PublicRoute from redirecting, but allows API calls
          sessionStorage.setItem('signup_token', response.data.token);
          try {
            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
            if (payload.role) {
              userRole = payload.role;
            }
          } catch (e) {
            console.warn('Could not decode role from token:', e);
          }
        }
        
        // Don't dispatch auth actions or set localStorage yet
        // Wait until signup flow is complete
        // This prevents PublicRoute from redirecting
        
        toast({
          title: "Account created!",
          description: "Now let's set up your store.",
        });
        setSignupStep(3); // Skip step 2 (Clover connection), go to store details
      } else {
        if (response.message?.includes('already registered') || response.message?.includes('already exists')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          setActiveTab("signin");
          loginForm.setValue("email", data.email);
          setIsSigningUp(false);
        } else {
          toast({
            title: "Sign Up Failed",
            description: response.message || "Please try again.",
            variant: "destructive",
          });
          setIsSigningUp(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error?.response?.data?.message || error?.message || "Please try again later.",
        variant: "destructive",
      });
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onStoreDetailsSubmit = async (data: StoreDetailsFormData) => {
    setIsLoading(true);
    try {
      if (!selectedLatitude || !selectedLongitude) {
        toast({
          title: "Location Required",
          description: "Please select your business location on the map.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await post({
        end_point: 'locations',
        body: {
          name: data.storeName,
          address: data.storeLocation,
          retail_channel: data.retailChannel,
          latitude: selectedLatitude,
          longitude: selectedLongitude,
        },
        token: true
      });

      if (response.success && response.data) {
        setLocationId(response.data._id || response.data.id);
        toast({
          title: "Location saved!",
          description: "Now let's add referral information.",
        });
        setSignupStep(4);
      } else {
        throw new Error(response.message || "Failed to save location");
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error?.response?.data?.message || error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onReferralSubmit = async (data: ReferralFormData) => {
    setIsLoading(true);
    try {
      if (data.referralCode && data.referralCode.trim()) {
        // Validate referral code if provided
        try {
          const validationResponse = await get({
            end_point: `users/referral-code/${data.referralCode.trim().toUpperCase()}`,
            token: true
          });
          
          if (!validationResponse.success) {
            toast({
              title: "Invalid Referral Code",
              description: "The referral code you entered is not valid.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error validating referral code:', error);
          // Continue anyway - referral is optional
        }
      }

      toast({
        title: "Profile saved!",
        description: "Now let's create your first offer.",
      });
      setSignupStep(5);
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error?.response?.data?.message || error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOffer = async () => {
    let website = offerForm.getValues("website");
    if (!website || !website.trim()) {
      toast({
        title: "Website Required",
        description: "Please enter your website URL to generate an offer with AI",
        variant: "destructive",
      });
      return;
    }

    // Normalize the URL - add https:// if no protocol is present
    website = website.trim();
    if (!website.match(/^https?:\/\//i)) {
      website = `https://${website}`;
      // Update the form field with the normalized URL
      offerForm.setValue("website", website);
    }

    setIsGeneratingOffer(true);
    try {
      const response = await post({
        end_point: 'offers/generate-from-website',
        body: { website },
        token: false
      });

      if (response.success && response.data) {
        const data = response.data;
        offerForm.setValue("callToAction", data.callToAction || data.call_to_action || "");
        setGeneratedOfferData({
          businessName: data.businessName || storeDetailsForm.getValues("storeName") || "Your Business",
          offerImageUrl: data.offerImageUrl || data.offer_image_url || null,
          brandLogoUrl: data.brandLogoUrl || data.brand_logo_url || null,
          brandColors: data.brandColors || data.colors || { primary: "#6366f1", secondary: "#4f46e5" },
        });
        setShowPreview(true);
        toast({
          title: "Success",
          description: "Offer generated with AI! Review your preview below.",
        });
      } else {
        throw new Error(response.message || 'Failed to generate offer');
      }
    } catch (error: any) {
      console.error("Error generating offer:", error);
      toast({
        title: "Error",
        description: "Failed to generate offer. Please enter one manually.",
        variant: "destructive",
      });
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

      if (response.success && response.data?.offerImageUrl && generatedOfferData) {
        setGeneratedOfferData({
          ...generatedOfferData,
          offerImageUrl: response.data.offerImageUrl || response.data.offer_image_url,
        });
        toast({
          title: "Success",
          description: "Image updated!",
        });
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({
        title: "Error",
        description: "Failed to change image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  const handleCreateOffer = async (values: OfferFormData) => {
    setIsLoading(true);
    
    try {
      // Check if locationId exists, if not try to fetch it
      let currentLocationId = locationId;
      
      if (!currentLocationId) {
        // Check if we have a token
        const token = sessionStorage.getItem('signup_token') || localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Session expired",
            description: "Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Fetch locations to get locationId if missing
        try {
          const locationsResponse = await get({ end_point: 'locations', token: true });
          if (locationsResponse.success && locationsResponse.data && locationsResponse.data.length > 0) {
            currentLocationId = locationsResponse.data[0]._id || locationsResponse.data[0].id;
            setLocationId(currentLocationId);
          } else {
            toast({
              title: "Location Required",
              description: "Please complete step 3 (Store Details) to add a location first, or skip this step.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('Error fetching locations:', error);
          toast({
            title: "Error",
            description: "Failed to fetch your location. Please complete step 3 (Store Details) first.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      
      if (!currentLocationId) {
        toast({
          title: "Location Required",
          description: "Please complete step 3 (Store Details) to add a location first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await post({
        end_point: "offers",
        body: {
          call_to_action: values.callToAction,
          location_ids: [currentLocationId],
          expiration_duration: "1week",
          is_open_offer: false,
          location_images: currentLocationId ? {
            [currentLocationId]: generatedOfferData?.offerImageUrl || null
          } : {}
        },
        token: true
      });

      if (response.success) {
        setOfferCreated(true);
        toast({
          title: "Offer created!",
          description: "Now subscribe to Open Offer for maximum visibility.",
        });
        setSignupStep(6);
      } else {
        throw new Error(response.message || "Failed to create offer");
      }
    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to create offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeOpenOffer = async () => {
    if (!locationId) {
      toast({
        title: "Session expired",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPaymentMethod) {
      setShowCardForm(true);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement Open Offer subscription API call
      toast({
        title: "Open Offer activated!",
        description: "Your offer will be distributed to local retailers.",
      });
      completeSignup();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error subscribing to Open Offer:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again from the dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardAdded = () => {
    setHasPaymentMethod(true);
    setShowCardForm(false);
    toast({
      title: "Card added successfully!",
      description: "You can now subscribe to Open Offer.",
    });
  };

  const completeSignup = () => {
    // Move token from sessionStorage to localStorage
    const signupToken = sessionStorage.getItem("signup_token");
    if (signupToken) {
      localStorage.setItem('token', signupToken);
      sessionStorage.removeItem("signup_token");
      
      // Decode role from token
      try {
        const payload = JSON.parse(atob(signupToken.split('.')[1]));
        const userRole = payload.role || 'retailer';
        localStorage.setItem('userRole', userRole);
        
        // Dispatch auth actions
        dispatch(authActions.login({ 
          email: signupForm.getValues("email"), 
          fullName: signupForm.getValues("fullName") 
        }));
        dispatch(authActions.role({ role: userRole }));
      } catch (e) {
        console.warn('Could not decode role from token:', e);
      }
    }
    
    setIsSigningUp(false);
  };

  const handleSkipToDashboard = async () => {
    if (signupStep === 6 && locationId) {
      setIsLoading(true);
      try {
        // Show welcome credits dialog
        setShowWelcomeCreditsDialog(true);
        return;
      } catch (err) {
        console.error('Error in welcome credits flow:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Mark that this is a new signup so dashboard shows welcome dialog
    sessionStorage.setItem('showWelcomeCreditsDialog', 'true');
    completeSignup();
    navigate("/dashboard");
  };

  const handleWelcomeDialogClose = () => {
    setShowWelcomeCreditsDialog(false);
    // Mark that this is a new signup so dashboard shows welcome dialog
    sessionStorage.setItem('showWelcomeCreditsDialog', 'true');
    completeSignup();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Content */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-dark to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-dark/95 to-accent/90" />
        
        {/* Small Business Overlay */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src={smallBusinessPartnerships} 
            alt="Small business partnership" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 p-12 flex flex-col h-full">
          <div className="pt-[25vh]">
            <Logo size="lg" showText className="text-white scale-125" />
          </div>
        </div>
      </div>

      {/* Right Side - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Media Street
            </h2>
            <p className="text-muted-foreground">
              Sign in to your Media Street account or create a new one
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl">Sign in to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your retailer dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Email *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Enter your password" 
                                  type={showLoginPassword ? "text" : "password"} 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                  {showLoginPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center justify-between">
                        <FormField
                          control={loginForm.control}
                          name="rememberMe"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Remember me
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                          type="button"
                          onClick={async () => {
                            const email = loginForm.getValues("email");
                            if (!email) {
                              toast({
                                title: "Email Required",
                                description: "Please enter your email address first.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // TODO: Implement password reset API call
                            toast({
                              title: "Password Reset Email Sent",
                              description: "Check your email for password reset instructions.",
                            });
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Create Retailer Account</CardTitle>
                    </div>
                  </div>
                  
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-sm text-muted-foreground">
                      Step {signupStep === 1 ? 1 : signupStep === 3 ? 2 : signupStep === 4 ? 3 : signupStep === 5 ? 4 : 5} of 5
                    </span>
                    <div className="flex gap-2">
                      <div className={`w-2 h-2 rounded-full ${signupStep >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${signupStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${signupStep >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${signupStep >= 5 ? 'bg-primary' : 'bg-muted'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${signupStep >= 6 ? 'bg-primary' : 'bg-muted'}`}></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {signupStep === 1 && (
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-4">
                        <FormField
                          control={signupForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your email" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Create a password" 
                                    type={showSignupPassword ? "text" : "password"} 
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                                  >
                                    {showSignupPassword ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Confirm your password" 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating account..." : "Create Account"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  )}

                  {signupStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <h3 className="text-2xl font-bold">
                          Let's <span className="text-primary">connect</span> your <span className="text-primary">Clover</span> account
                        </h3>
                        <p className="text-muted-foreground">
                          Sign in with your Clover Merchant account to link your first store location and start partnering.
                        </p>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-base"
                          onClick={() => {
                            toast({
                              title: "Clover Integration",
                              description: "Clover integration coming soon!",
                            });
                            setSignupStep(3);
                          }}
                        >
                          <img 
                            src="/lovable-uploads/a0ed7029-4b44-48ca-9afd-4e40c7f02b3e.png" 
                            alt="Clover" 
                            className="mr-2 h-5 w-5"
                          />
                          Link Your Store Location
                        </Button>
                      </div>
                      
                      {/* Non-Clover Option */}
                      <div className="text-center mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                          Don't have Clover?
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setSignupStep(3)}
                          className="w-full"
                        >
                          Create your retailer account without linking your point-of-sale system
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3 px-4">
                          <span className="text-amber-600">Note:</span> Not connecting your Clover POS system will limit access to some of our automated features and you will have to manually post cross-promotions.
                        </p>
                      </div>
                    </div>
                  )}

                  {signupStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">
                          Add Your <span className="text-primary">Retail Location</span>
                        </h3>
                        <p className="text-muted-foreground">Enter your store details to complete your account setup</p>
                      </div>
                     
                      <Form {...storeDetailsForm}>
                        <form onSubmit={storeDetailsForm.handleSubmit(onStoreDetailsSubmit)} className="space-y-4">
                          <FormField
                            control={storeDetailsForm.control}
                            name="storeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="My Store" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormItem>
                            <FormLabel>Store Address *</FormLabel>
                            {isGettingLocation ? (
                              <div className="flex items-center justify-center h-[300px] border rounded-md bg-muted/50">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                  <p className="text-sm text-muted-foreground">🔍 Detecting your location...</p>
                                </div>
                              </div>
                            ) : (
                              <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                initialLatitude={selectedLatitude || DEFAULT_LATITUDE}
                                initialLongitude={selectedLongitude || DEFAULT_LONGITUDE}
                                height="300px"
                              />
                            )}
                            <FormField
                              control={storeDetailsForm.control}
                              name="storeLocation"
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main St, New York, NY 10001" readOnly />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground mt-1">Select location on map above</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </FormItem>
                         
                          <FormField
                            control={storeDetailsForm.control}
                            name="retailChannel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Retail Channel</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select retail channel" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-background border z-50 max-h-[300px]">
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
                          
                          <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 text-white mt-6"
                            disabled={isLoading || !selectedLatitude || !selectedLongitude}
                          >
                            {isLoading ? "Saving..." : "Save & Continue"}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center mt-3">
                            You will be able to add your other retail locations once your Media Street account is created.
                          </p>
                        </form>
                      </Form>
                    </div>
                  )}

                  {signupStep === 4 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">
                          Who referred you?
                        </h3>
                        <p className="text-muted-foreground">
                          Did a retailer refer you to Media Street?
                        </p>
                      </div>
                      
                      <Form {...referralForm}>
                        <form onSubmit={referralForm.handleSubmit(onReferralSubmit)} className="space-y-4">
                          <FormField
                            control={referralForm.control}
                            name="referralCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referral Code (Optional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="Enter referral code (e.g., JOHSMI)"
                                    className="uppercase"
                                    onChange={async (e) => {
                                      const value = e.target.value.toUpperCase();
                                      field.onChange(value);
                                      
                                      // Validate referral code and show retailer name
                                      if (value.trim().length >= 8) {
                                        setIsValidatingReferral(true);
                                        setReferralRetailerName(null);
                                        try {
                                          const response = await get({
                                            end_point: `users/referral-code/${value.trim()}`,
                                            token: false
                                          });
                                          
                                          if (response.success && response.data?.retailerName) {
                                            setReferralRetailerName(response.data.retailerName);
                                          } else {
                                            setReferralRetailerName(null);
                                          }
                                        } catch (error) {
                                          console.error('Error validating referral code:', error);
                                          setReferralRetailerName(null);
                                        } finally {
                                          setIsValidatingReferral(false);
                                        }
                                      } else {
                                        setReferralRetailerName(null);
                                      }
                                    }}
                                  />
                                </FormControl>
                                {isValidatingReferral && (
                                  <p className="text-xs text-muted-foreground mt-1">Validating...</p>
                                )}
                                {referralRetailerName && !isValidatingReferral && (
                                  <p className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Referred by: <span className="font-semibold">{referralRetailerName}</span>
                                  </p>
                                )}
                                {!referralRetailerName && referralForm.watch("referralCode") && referralForm.watch("referralCode").trim().length >= 8 && !isValidatingReferral && (
                                  <p className="text-xs text-destructive mt-1">
                                    Invalid referral code
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         
                          <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save & Continue"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}

                  {signupStep === 5 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">
                          Create Your <span className="text-primary">First Offer</span>
                        </h3>
                        <p className="text-muted-foreground">
                          Create an offer to attract new customers from partner retailers.
                        </p>
                      </div>
                      
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
                                      <>
                                        <span className="animate-spin mr-2">⚡</span>
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="h-4 w-4 mr-2" />
                                        Generate
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Enter your website URL to generate an offer with AI</p>
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
                                redemptionStoreName={storeDetailsForm.getValues("storeName")}
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
                          {!locationId && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Note:</strong> You need to complete step 3 (Store Details) first to add a location before creating an offer. You can skip this step and add a location later.
                              </p>
                            </div>
                          )}
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                            disabled={isLoading || !locationId}
                          >
                            {isLoading ? "Creating..." : "Create Offer"}
                            <Check className="ml-2 h-4 w-4" />
                          </Button>
                          {!locationId && (
                            <p className="text-xs text-muted-foreground text-center">
                              Complete step 3 (Store Details) to add a location first, or skip to dashboard.
                            </p>
                          )}
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
                          You can create and edit your offers later from your dashboard
                        </p>
                      </div>
                    </div>
                  )}

                  {signupStep === 6 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
                          <Gift className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">
                          🎉 Congratulations! 🎉
                        </h3>
                        <p className="text-lg font-semibold text-primary">
                          You're getting $100 in credits to try Media Street!
                        </p>
                      </div>
                      
                      {showCardForm ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary">
                            <CreditCard className="h-5 w-5" />
                            <h4 className="font-semibold">Add Payment Method</h4>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <p className="text-sm text-green-700">
                              <strong>You won't be charged</strong> until your credits are used up. Cancel anytime before then to avoid charges.
                            </p>
                          </div>
                          <AddCardForm 
                            onSuccess={handleCardAdded}
                            onCancel={() => setShowCardForm(false)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="border rounded-lg p-4 bg-primary/5 space-y-4">
                            <div className="flex items-start gap-3">
                              <DollarSign className="h-6 w-6 text-green-500 mt-0.5" />
                              <div>
                                <h4 className="font-semibold">Your $100 Promo Credits</h4>
                                <p className="text-sm text-muted-foreground">
                                  Use your credits for Open Offer. Credits deplete monthly based on your subscription.
                                </p>
                              </div>
                            </div>
                            
                            <div className="border-t border-primary/10 pt-4">
                              <h4 className="font-semibold mb-2">What you get with Open Offer</h4>
                              <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>Show your offer at other nearby Open Offer retailers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>Show non-competing retailer offers at yours</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>Activate analytics on consumer views and redemptions</span>
                                </li>
                              </ul>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              <p className="text-xs text-green-700">
                                <strong>You won't be charged</strong> until your $100 credits are used up. Cancel before then to avoid any charges.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {hasPaymentMethod ? (
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                                onClick={handleSubscribeOpenOffer}
                                disabled={isLoading}
                              >
                                {isLoading ? "Activating..." : "Activate Open Offer with Credits"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                                onClick={() => setShowCardForm(true)}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Add Card to Get Started
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              className="w-full text-muted-foreground"
                              onClick={handleSkipToDashboard}
                            >
                              <SkipForward className="mr-2 h-4 w-4" />
                              Skip for now
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              You can activate later from Settings. Your $100 credits will still be waiting!
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors block"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Welcome Credits Dialog */}
      <Dialog open={showWelcomeCreditsDialog} onOpenChange={setShowWelcomeCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 mb-4">
                <Gift className="h-8 w-8 text-white" />
              </div>
              🎉 Welcome to Media Street! 🎉
            </DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <p className="text-lg font-semibold text-primary">
                You've received $100 in credits!
              </p>
              <p className="text-sm text-muted-foreground">
                Use your credits to create offers and grow your business. Your credits are ready to use right away.
              </p>
              <Button 
                onClick={handleWelcomeDialogClose}
                className="w-full mt-4"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
