import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import Logo from "@/components/Logo";
import { Megaphone, LogOut, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdvertiserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [metricObjective, setMetricObjective] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      // TODO: Replace with Node.js API call
      // const response = await get({ end_point: 'auth/me' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/advertiser/signup");
      } else {
        // Mock user object
        setUser({ id: 'user-id', email: 'user@example.com' } as any);
        
        // TODO: Fetch profile data
        // const profileResponse = await get({ end_point: 'profile' });
        // if (profileResponse.data?.first_name) {
        //   setFirstName(profileResponse.data.first_name);
        // }
      }
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    // TODO: Replace with Node.js API call
    // await post({ end_point: 'auth/logout' });
    localStorage.removeItem('token');
    navigate("/");
  };

  const handleMetricRequest = async () => {
    if (!metricObjective.trim()) {
      toast({
        title: "Error",
        description: "Please describe your advertising objective",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with Node.js API call
      // await post({ 
      //   end_point: 'advertiser/request-custom-metric', 
      //   body: {
      //     objective: metricObjective,
      //     userName: firstName || user?.email,
      //     userEmail: user?.email,
      //   }
      // });

      toast({
        title: "Request submitted",
        description: "We'll contact you shortly to set up your custom metric.",
      });
      setMetricObjective("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting metric request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" showText />
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Advertiser Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {firstName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Create Campaign</CardTitle>
                  <CardDescription>Launch your advertising campaign</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/advertiser/campaign/create')}>Get Started</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>View and manage your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">campaigns running</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Campaign Results</CardTitle>
              <CardDescription>Track your campaign performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-8 mb-6">
                <div>
                  <p className="text-4xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Stores</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">In-Store Impressions</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Scans</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Set-up a new metric
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Custom Campaign</DialogTitle>
                    <DialogDescription>
                      Describe your advertising idea or objective in our retail stores and we'll help you set up a campaign to achieve it. Don't be afraid to get creative as we have access to thousands of retailers on our platform and can do virtually anything.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="objective">Advertising Idea</Label>
                      <Textarea
                        id="objective"
                        placeholder="Tell us about your retail advertising idea or objective."
                        value={metricObjective}
                        onChange={(e) => setMetricObjective(e.target.value)}
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMetricRequest} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Campaign Breakdown</CardTitle>
              <CardDescription>Individual campaign performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead className="text-right">Stores</TableHead>
                    <TableHead className="text-right">In-Store Impressions</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Scan Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No campaigns yet. Create your first campaign to see results here.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Scans by Campaign</CardTitle>
              <CardDescription>Visual breakdown of scan performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer
                  config={{
                    scans: {
                      label: "Scans",
                      color: "hsl(var(--primary))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="campaign" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  No campaign data to display yet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
