import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Megaphone, ArrowRight, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AdvertiserSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ensure signup tab is active when coming from advertise button
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab === 'signup' || !tab) {
      setActiveTab("signup");
    }
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
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

  useEffect(() => {
    // TODO: Replace with Node.js API call to check auth status
    const checkUserAndRedirect = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/advertiser/dashboard");
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  const onSignIn = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with Node.js API call
      // const response = await post({ end_point: 'advertisers/login', body: { email: data.email, password: data.password } });
      
      // Mock implementation for now
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      navigate("/advertiser/dashboard");
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with Node.js API call
      // const response = await post({ 
      //   end_point: 'advertisers/signup', 
      //   body: { 
      //     email: data.email, 
      //     password: data.password,
      //     fullName: data.fullName,
      //     userType: 'advertiser'
      //   } 
      // });
      
      // Mock implementation for now
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      // Redirect to advertiser dashboard
      navigate("/advertiser/dashboard");
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
        setActiveTab("signin");
        loginForm.setValue("email", data.email);
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" showText={false} />
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
                  Enter your credentials to access your advertiser dashboard
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
                  <div className="p-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Create Advertiser Account</CardTitle>
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
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
