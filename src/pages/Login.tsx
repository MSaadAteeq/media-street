import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Zap, ArrowRight, Clover } from "lucide-react";
import Logo from "@/components/Logo";
import smallBusinessPartnerships from "@/assets/small-business-partnerships.jpg";

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
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const storeDetailsSchema = z.object({
  storeLocation: z.string()
    .min(10, "Please enter a complete address")
    .regex(/^.+,.+,.+\s+\d{5}(-\d{4})?$/, "Please enter a valid address format: Street, City, State ZIP"),
  storeName: z.string().min(1, "Store name is required"),
  retailChannel: z.string().min(1, "Retail channel is required"),
});

const referralSchema = z.object({
  referralStore: z.string().optional(),
  referralCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type StoreDetailsFormData = z.infer<typeof storeDetailsSchema>;
type ReferralFormData = z.infer<typeof referralSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [signupStep, setSignupStep] = useState(1);
  const [storeOptions, setStoreOptions] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // useEffect(() => {
  //   const checkUserTypeAndRedirect = async (userId: string, isRecovery: boolean = false) => {
  //     if (isRecovery) {
  //       navigate("/reset-password");
  //       return;
  //     }

  //     try {
  //       // Simply navigate to dashboard
  //       navigate("/dashboard");
  //     } catch (error) {
  //       console.error('Error checking user type:', error);
  //       // Default to retailer dashboard on error
  //       navigate("/dashboard");
  //     }
  //   };

  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     (event, session) => {
  //       if (session?.user) {
  //         const isRecovery = event === 'PASSWORD_RECOVERY';
  //         // Use setTimeout to avoid auth callback deadlock
  //         setTimeout(() => {
  //           checkUserTypeAndRedirect(session.user.id, isRecovery);
  //         }, 0);
  //       }
  //     }
  //   );

  //   // Check for existing session
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     if (session?.user) {
  //       const urlParams = new URLSearchParams(window.location.search);
  //       const type = urlParams.get('type');
  //       const isRecovery = type === 'recovery';
        
  //       checkUserTypeAndRedirect(session.user.id, isRecovery);
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [navigate]);

  // const onSignIn = async (data: LoginFormData) => {
  //   setIsLoading(true);
  //   try {
  //     const { error } = await supabase.auth.signInWithPassword({
  //       email: data.email,
  //       password: data.password,
  //     });

  //     if (error) {
  //       toast({
  //         title: "Sign In Failed",
  //         description: error.message,
  //         variant: "destructive",
  //       });
  //     } else {
  //       toast({
  //         title: "Welcome back!",
  //         description: "You've been signed in successfully.",
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "An error occurred",
  //       description: "Please try again later.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const onSignUp = async (data: SignupFormData) => {
  //   setIsLoading(true);
  //   try {
  //     const redirectUrl = `${window.location.origin}/`;
      
  //     const { error } = await supabase.auth.signUp({
  //       email: data.email,
  //       password: data.password,
  //       options: {
  //         emailRedirectTo: redirectUrl,
  //         data: {
  //           full_name: data.fullName,
  //         },
  //       },
  //     });

  //     if (error) {
  //       if (error.message.includes('already registered')) {
  //         toast({
  //           title: "Account exists",
  //           description: "This email is already registered. Please sign in instead.",
  //           variant: "destructive",
  //         });
  //         setActiveTab("signin");
  //         loginForm.setValue("email", data.email);
  //       } else {
  //         toast({
  //           title: "Sign Up Failed",
  //           description: error.message,
  //           variant: "destructive",
  //         });
  //       }
  //     } else {
  //       toast({
  //         title: "Account created!",
  //         description: "Please check your email to verify your account.",
  //       });
  //       setSignupStep(3); // Skip step 2 (Clover connection)
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "An error occurred",
  //       description: "Please try again later.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const onStoreDetailsSubmit = async (data: StoreDetailsFormData) => {
    setIsLoading(true);
    try {
      // Save store details temporarily, will be saved to database in final step
      setSignupStep(4);
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const referralForm = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralStore: "",
    },
  });

  const searchStores = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setStoreOptions([]);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('get_store_names_for_autocomplete', {
        search_term: searchTerm
      });
      
      if (error) {
        console.error('Error searching stores:', error);
        return;
      }
      
      setStoreOptions(data?.map((item: any) => item.store_name) || []);
    } catch (error) {
      console.error('Error searching stores:', error);
    }
  };

  const onReferralSubmit = async (data: ReferralFormData) => {
    setIsLoading(true);
    try {
      // Get current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (userError || sessionError) {
        throw new Error('Authentication error. Please sign in again.');
      }
      
      if (!user || !session) {
        // User needs to sign in first
        toast({
          title: "Please sign in first",
          description: "You need to sign in to complete your profile setup.",
          variant: "destructive",
        });
        setActiveTab("signin");
        setSignupStep(1);
        return;
      }

      // Save complete profile with all signup data
      const storeData = storeDetailsForm.getValues();
      const signupData = signupForm.getValues();
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: signupData.fullName.split(' ')[0] || '',
          last_name: signupData.fullName.split(' ').slice(1).join(' ') || '',
          store_name: storeData.storeName,
          retail_address: storeData.storeLocation,
          phone: '', // Could be added to form if needed
          referral_store: data.referralStore || null,
        });

      if (error) throw error;

      // Award referral points if a referral code was used
      if (data.referralCode && data.referralCode.trim()) {
        try {
          const { error: referralError } = await supabase
            .rpc('award_referral_points', {
              referrer_code: data.referralCode.trim().toUpperCase()
            });
          
          if (referralError) {
            console.error('Error awarding referral points:', referralError);
            // Don't fail the signup process if referral points fail
          }
        } catch (referralError) {
          console.error('Error processing referral:', referralError);
          // Don't fail the signup process if referral points fail
        }
      }

      toast({
        title: "Welcome to Offer Ave!",
        description: "Your account setup is complete.",
      });
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error('Signup completion error:', error);
      toast({
        title: "An error occurred",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                    <form className="space-y-4"> 
                    {/* onSubmit={loginForm.handleSubmit(onSignIn)} */}
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your password" type="password" {...field} />
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
                          // onClick={async () => {
                          //   const email = loginForm.getValues("email");
                          //   if (!email) {
                          //     toast({
                          //       title: "Email Required",
                          //       description: "Please enter your email address first.",
                          //       variant: "destructive",
                          //     });
                          //     return;
                          //   }
                            
                          //   const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          //     redirectTo: `${window.location.protocol}//${window.location.host}/reset-password`,
                          //   });
                            
                          //   if (error) {
                          //     toast({
                          //       title: "Error",
                          //       description: error.message,
                          //       variant: "destructive",
                          //     });
                          //   } else {
                          //     toast({
                          //       title: "Password Reset Email Sent",
                          //       description: "Check your email for password reset instructions.",
                          //     });
                          //   }
                          // }}
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
                    {/* <div className="flex items-center justify-between mt-4 mb-2">
                     <span className="text-sm text-muted-foreground">Step {signupStep === 1 ? 1 : signupStep === 3 ? 2 : 3} of 3</span>
                     <div className="flex gap-2">
                       <div className={`w-2 h-2 rounded-full ${signupStep >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                       <div className={`w-2 h-2 rounded-full ${signupStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                       <div className={`w-2 h-2 rounded-full ${signupStep >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
                     </div>
                   </div> */}
                 </CardHeader>
                 <CardContent>
                   {signupStep === 1 && (
                     <Form {...signupForm}>
                       <form className="space-y-4">
                       {/* onSubmit={signupForm.handleSubmit(onSignUp)} */}
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
                                 <Input placeholder="Create a password" type="password" {...field} />
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
                                 <Input placeholder="Confirm your password" type="password" {...field} />
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
                                name="storeLocation"
                                render={({ field }) => (
                                  <FormItem>
                                     <FormLabel>Store Address *</FormLabel>
                                     <FormControl>
                                       <Input {...field} placeholder="123 Main St, New York, NY 10001" />
                                     </FormControl>
                                     <p className="text-xs text-muted-foreground mt-1">Include street, city, state, and ZIP code</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                             
                             <FormField
                               control={storeDetailsForm.control}
                               name="storeName"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Store Name</FormLabel>
                                   <FormControl>
                                     <Input {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             
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
                                     <SelectContent className="bg-background border z-50">
                                       <SelectItem value="coffee-shop">Coffee Shop</SelectItem>
                                       <SelectItem value="convenience-store">Convenience Store</SelectItem>
                                       <SelectItem value="dry-cleaner">Dry Cleaner</SelectItem>
                                       <SelectItem value="entertainment-venue">Entertainment Venue</SelectItem>
                                       <SelectItem value="fashion-retail">Fashion Retail</SelectItem>
                                       <SelectItem value="home-goods">Home Goods</SelectItem>
                                       <SelectItem value="hotel">Hotel</SelectItem>
                                       <SelectItem value="liquor-store">Liquor Store</SelectItem>
                                       <SelectItem value="pet-care-store">Pet Care / Store</SelectItem>
                                       <SelectItem value="restaurant-bar">Restaurant / Bar</SelectItem>
                                       <SelectItem value="salon-spa-barber">Salon / Spa / Barber Shop</SelectItem>
                                       <SelectItem value="spa">Spa</SelectItem>
                                       <SelectItem value="supermarket">Supermarket</SelectItem>
                                       <SelectItem value="other">Other (miscellaneous)</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             
                              <Button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-primary/90 text-white mt-6"
                                disabled={isLoading}
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
                             One more thing...
                           </h3>
                           <p className="text-muted-foreground">
                             Did a retailer refer you to Offer Ave?
                           </p>
                         </div>
                         
                          <Form {...referralForm}>
                            <form onSubmit={referralForm.handleSubmit(onReferralSubmit)} className="space-y-4">
                                 <FormField
                                 control={referralForm.control}
                                 name="referralStore"
                                 render={({ field }) => (
                                   <FormItem>
                                     <FormLabel>Referral Store (Optional)</FormLabel>
                                     <FormControl>
                                       <div className="relative">
                                         <Input 
                                           {...field}
                                           placeholder="Type store name to search or leave blank"
                                           onChange={(e) => {
                                             // Clear "None" if user starts typing
                                             if (field.value === "None" && e.target.value) {
                                               field.onChange("");
                                             } else {
                                               field.onChange(e);
                                             }
                                             searchStores(e.target.value);
                                           }}
                                           list="store-suggestions"
                                         />
                                         <datalist id="store-suggestions">
                                           {storeOptions.map((store, index) => (
                                             <option key={index} value={store} />
                                           ))}
                                         </datalist>
                                       </div>
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )}
                               />
                               
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
                                         onChange={(e) => {
                                           field.onChange(e.target.value.toUpperCase());
                                         }}
                                       />
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )}
                               />
                              
                              <Button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-primary/90 text-white"
                                disabled={isLoading}
                              >
                                {isLoading ? "Completing..." : "Complete Sign Up"}
                              </Button>
                           </form>
                         </Form>
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
    </div>
  );
}