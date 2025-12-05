import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, Handshake, Eye, ScanLine, TicketCheck, DollarSign, TrendingUp, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { get } from "@/services/apis";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";

interface Analytics {
  total_users: number;
  total_locations: number;
  total_partnerships: number;
  total_impressions: number;
  total_scans: number;
  total_redemptions: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  location_count: number;
  offer_count: number;
  redemption_count: number;
}

interface Location {
  id: string;
  name: string;
  user_email: string;
  created_at: string;
  offer_count: number;
  redemption_count: number;
}

interface RevenueData {
  month: string;
  offerx_revenue: number;
  partnerships_revenue: number;
  advertising_revenue: number;
  total_revenue: number;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  date_joined: string;
  location_count: number;
  total_revenue: number;
}

interface LocationDetail {
  id: string;
  store_name: string;
  store_address: string;
  affiliated_user: string;
  active_partnerships: number;
  subscribed_to_offerx: boolean;
  display_option: string;
}

interface PartnershipDetail {
  id: string;
  requesting_retailer: string;
  accepting_retailer: string;
  date_accepted: string;
  date_cancelled: string | null;
  requesting_impressions: number;
  accepting_impressions: number;
  requesting_scans: number;
  accepting_scans: number;
  requesting_conversions: number;
  accepting_conversions: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<Array<{
    month: string;
    users: number;
    locations: number;
    partnerships: number;
    revenue: number;
  }>>([]);
  const [userDetails, setUserDetails] = useState<UserDetail[]>([]);
  const [locationDetails, setLocationDetails] = useState<LocationDetail[]>([]);
  const [partnershipDetails, setPartnershipDetails] = useState<PartnershipDetail[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in to access admin panel");
        navigate('/login');
        return;
      }

      // Check user role via API
      const { get } = await import("@/services/apis");
      const response = await get({ 
        end_point: 'users/me',
        token: true
      });

      if (!response.success || !response.data) {
        toast.error("Error verifying access");
        navigate('/login');
        return;
      }

      const userRole = response.data.role?.toLowerCase() || 'retailer';
      
      if (userRole !== 'admin') {
        toast.error("Access denied: Admin privileges required");
        navigate('/dashboard');
        return;
      }

      setIsAuthenticated(true);
      setIsAdmin(true);
      await loadAdminData();
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast.error("Error verifying access");
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Fetch analytics
      const analyticsResponse = await get({ end_point: 'admin/analytics', token: true });
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }

      // Fetch users
      const usersResponse = await get({ end_point: 'admin/users', token: true });
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      }

      // Fetch locations
      const locationsResponse = await get({ end_point: 'admin/locations', token: true });
      if (locationsResponse.success && locationsResponse.data) {
        setLocations(locationsResponse.data);
      }

      // Fetch monthly trends
      const trendsResponse = await get({ end_point: 'admin/monthly-trends', token: true });
      if (trendsResponse.success && trendsResponse.data) {
        setMonthlyTrends(trendsResponse.data);
      }

      // Revenue data (placeholder - would need payment integration)
      setRevenueData([]);

      // Load detailed data
      await loadDetailedData();

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error(error.message || "Failed to load admin data");
    }
  };

  const loadDetailedData = async () => {
    try {
      // Fetch user details
      const userDetailsResponse = await get({ end_point: 'admin/user-details', token: true });
      if (userDetailsResponse.success && userDetailsResponse.data) {
        setUserDetails(userDetailsResponse.data);
      }

      // Fetch location details
      const locationDetailsResponse = await get({ end_point: 'admin/location-details', token: true });
      if (locationDetailsResponse.success && locationDetailsResponse.data) {
        setLocationDetails(locationDetailsResponse.data);
      }

      // Fetch partnership details
      const partnershipResponse = await get({ end_point: 'admin/partnerships', token: true });
      if (partnershipResponse.success && partnershipResponse.data) {
        setPartnershipDetails(partnershipResponse.data);
      }
    } catch (error: any) {
      console.error('Error loading detailed data:', error);
      toast.error("Failed to load detailed data");
    }
  };

  const handleLogout = () => {
    // Clear Redux state
    dispatch(authActions.logout());
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Navigate to login
    navigate('/login');
    
    toast.success("Logged out successfully");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const processMonthlyTrends = (usersData: any[], locationsData: any[], revenueData: any[]) => {
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthLabel = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      // Count cumulative users up to this month
      const users = usersData.filter(u => new Date(u.created_at) <= monthEnd).length;
      
      // Count cumulative locations up to this month
      const locations = locationsData.filter(l => new Date(l.created_at) <= monthEnd).length;
      
      // Get partnerships count from analytics (we'll need to track this in the analytics call)
      const partnerships = 0; // This would come from analytics data
      
      // Get revenue for this month
      const revenueMonth = revenueData.find(r => r.month === monthLabel);
      const revenue = revenueMonth ? revenueMonth.total_revenue : 0;
      
      trends.push({
        month: monthLabel,
        users,
        locations,
        partnerships,
        revenue
      });
    }
    
    setMonthlyTrends(trends);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  const currentMonthRevenue = revenueData[0] || { offerx_revenue: 0, partnerships_revenue: 0, advertising_revenue: 0, total_revenue: 0 };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => setSelectedMetric(selectedMetric === 'users' ? null : 'users')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_users || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'locations' ? null : 'locations')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Retail Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_locations || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'partnerships' ? null : 'partnerships')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                Partnerships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_partnerships || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'impressions' ? null : 'impressions')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_impressions || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'scans' ? null : 'scans')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_scans || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'redemptions' ? null : 'redemptions')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TicketCheck className="h-4 w-4" />
                Redemptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_redemptions || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'offerx' ? null : 'offerx')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Open Offer Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.offerx_revenue)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'partnerships_rev' ? null : 'partnerships_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Partnerships Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.partnerships_revenue)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'advertising_rev' ? null : 'advertising_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Advertising Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.advertising_revenue || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'total_rev' ? null : 'total_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Monthly Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(currentMonthRevenue.total_revenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        {selectedMetric && (selectedMetric === 'offerx' || selectedMetric === 'partnerships_rev' || selectedMetric === 'advertising_rev' || selectedMetric === 'total_rev') && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMetric === 'offerx' && 'Open Offer Revenue Over Time'}
                {selectedMetric === 'partnerships_rev' && 'Partnerships Revenue Over Time'}
                {selectedMetric === 'advertising_rev' && 'Advertising Revenue Over Time'}
                {selectedMetric === 'total_rev' && 'Total Revenue Over Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Revenue Charts */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  {selectedMetric === 'offerx' && <Bar dataKey="offerx_revenue" fill="#8884d8" name="Open Offer Revenue" />}
                  {selectedMetric === 'partnerships_rev' && <Bar dataKey="partnerships_revenue" fill="#82ca9d" name="Partnerships Revenue" />}
                  {selectedMetric === 'advertising_rev' && <Bar dataKey="advertising_revenue" fill="#ffc658" name="Advertising Revenue" />}
                  {selectedMetric === 'total_rev' && (
                    <>
                      <Bar dataKey="offerx_revenue" stackId="a" fill="#8884d8" name="Open Offer" />
                      <Bar dataKey="partnerships_revenue" stackId="a" fill="#82ca9d" name="Partnerships" />
                      <Bar dataKey="advertising_revenue" stackId="a" fill="#ffc658" name="Advertising" />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trends Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Monthly Active Users</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Active Users</CardTitle>
                <CardDescription>User growth over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} name="Total Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Stores</CardTitle>
                <CardDescription>Location growth over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="locations" stroke="#82ca9d" strokeWidth={2} name="Total Locations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partnerships">
            <Card>
              <CardHeader>
                <CardTitle>Partnerships</CardTitle>
                <CardDescription>Partnership growth over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="partnerships" stroke="#ffc658" strokeWidth={2} name="Total Partnerships" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Monthly revenue over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8dd1e1" name="Total Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detailed Data Tables */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Details</TabsTrigger>
            <TabsTrigger value="locations">Store Location Details</TabsTrigger>
            <TabsTrigger value="partnerships">Partnership Details</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>Comprehensive user data with revenue information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date Joined</TableHead>
                        <TableHead className="text-right"># of Store Locations</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No user data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        userDetails.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.date_joined)}</TableCell>
                            <TableCell className="text-right">{user.location_count}</TableCell>
                            <TableCell className="text-right">{formatCurrency(user.total_revenue)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Store Location Details</CardTitle>
                <CardDescription>Comprehensive location data with subscription and partnership information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Store Address</TableHead>
                        <TableHead>Affiliated User</TableHead>
                        <TableHead className="text-right"># Active Partnerships</TableHead>
                        <TableHead className="text-center">Open Offer Subscribed</TableHead>
                        <TableHead>Display Option</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No location data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        locationDetails.map((location) => (
                          <TableRow key={location.id}>
                            <TableCell className="font-medium">{location.store_name}</TableCell>
                            <TableCell>{location.store_address}</TableCell>
                            <TableCell>{location.affiliated_user}</TableCell>
                            <TableCell className="text-right">{location.active_partnerships}</TableCell>
                            <TableCell className="text-center">
                              {location.subscribed_to_offerx ? (
                                <span className="text-green-600 font-semibold">Yes</span>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell>{location.display_option}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partnerships">
            <Card>
              <CardHeader>
                <CardTitle>Partnership Details</CardTitle>
                <CardDescription>Comprehensive partnership data with metrics and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requesting Retailer</TableHead>
                        <TableHead>Accepting Retailer</TableHead>
                        <TableHead>Date Accepted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Req. Impressions</TableHead>
                        <TableHead className="text-right">Acc. Impressions</TableHead>
                        <TableHead className="text-right">Req. Scans</TableHead>
                        <TableHead className="text-right">Acc. Scans</TableHead>
                        <TableHead className="text-right">Req. Conversions</TableHead>
                        <TableHead className="text-right">Acc. Conversions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnershipDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            No partnership data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        partnershipDetails.map((partnership) => (
                          <TableRow key={partnership.id}>
                            <TableCell className="font-medium">{partnership.requesting_retailer}</TableCell>
                            <TableCell className="font-medium">{partnership.accepting_retailer}</TableCell>
                            <TableCell>{formatDate(partnership.date_accepted)}</TableCell>
                            <TableCell>
                              {partnership.date_cancelled ? (
                                <span className="text-muted-foreground">
                                  Cancelled {formatDate(partnership.date_cancelled)}
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">Active</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.requesting_impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.accepting_impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.requesting_scans)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.accepting_scans)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.requesting_conversions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.accepting_conversions)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
