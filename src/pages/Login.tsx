import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Supabase removed - will use Node.js API
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import smallBusinessPartnerships from "@/assets/small-business-partnerships.jpg";
import { post } from "@/services/apis";
import { useDispatch } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";
import LocationPicker from "@/components/LocationPicker";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

// const dispatch = useDispatch();

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  referralCode: z.string().optional().refine((val) => !val || val.length === 8, {
    message: "Referral code must be 8 characters",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [selectedLatitude, setSelectedLatitude] = useState<number | undefined>(undefined);
  const [selectedLongitude, setSelectedLongitude] = useState<number | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();

  // console.log(authActions);

  const dispatch = useDispatch<AppDispatch>();

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
      storeName: "",
      latitude: undefined,
      longitude: undefined,
      referralCode: "",
    },
  });

  const handleLocationSelect = (latitude: number, longitude: number, locationName?: string) => {
    setSelectedLatitude(latitude);
    setSelectedLongitude(longitude);
    signupForm.setValue("latitude", latitude);
    signupForm.setValue("longitude", longitude);
    if (locationName) {
      console.log('Selected location:', locationName);
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
        dispatch(authActions.login({ 
          email: response.data.user?.email || data.email, 
          fullName: response.data.user?.fullName || 'User' 
        }));
        dispatch(authActions.role({ role: response.data.user?.role || 'retailer' }));
        
        // Store token
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        toast({
          title: "Welcome!",
          description: response.message || "You've been signed in successfully",
        });
        navigate("/dashboard");
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
    try {
      const response = await post({
        end_point: `auth/signup`,
        body: {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          storeName: data.storeName,
          location_name: data.storeName, // Use storeName for location name
          latitude: data.latitude,
          longitude: data.longitude,
          referral_code: data.referralCode ? data.referralCode.toUpperCase().trim() : undefined
        }
      });

      if (response.success && response.data) {
        toast({
          title: "Account created!",
          description: response.message || "Your account has been created successfully.",
        });
        setActiveTab("signin");
        loginForm.setValue("email", data.email);
        
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      } else {
        toast({
          title: "Sign Up Failed",
          description: response.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error?.response?.data?.message || error?.message || "Please try again later.",
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

                            // TODO: Replace with Node.js API call
                            // Mock implementation for now
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
                      <CardDescription>
                        Enter your details to create your account
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="My Store" {...field} />
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
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABCD1234" 
                                {...field}
                                onChange={(e) => {
                                  // Convert to uppercase and limit to 8 characters
                                  const value = e.target.value.toUpperCase().slice(0, 8);
                                  field.onChange(value);
                                }}
                                maxLength={8}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Enter a referral code if you were referred by another retailer
                            </p>
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
                      <FormItem>
                        <FormLabel>Business Location *</FormLabel>
                        <LocationPicker
                          onLocationSelect={handleLocationSelect}
                          initialLatitude={selectedLatitude}
                          initialLongitude={selectedLongitude}
                          height="400px"
                        />
                        {(!selectedLatitude || !selectedLongitude) && (
                          <p className="text-sm text-destructive mt-1">
                            Please select your business location on the map
                          </p>
                        )}
                      </FormItem>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !selectedLatitude || !selectedLongitude}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
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