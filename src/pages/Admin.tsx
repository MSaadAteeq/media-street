import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { get, post, deleteApi } from "@/services/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, Handshake, Eye, ScanLine, TicketCheck, DollarSign, TrendingUp, UserPlus, Store, Megaphone, Trophy, Calendar, Save, Gift, Coins, Trash2, Tag, AlertTriangle, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface Analytics {
  total_users: number;
  total_locations: number;
  total_partnerships: number;
  total_impressions: number;
  total_scans: number;
  total_redemptions: number;
  total_referrals: number;
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
  openoffer_subscriptions: number;
  partnerships: number;
  advertising: number;
  total_revenue: number;
  active_partnerships: number;
}

interface UserDetail {
  id: string;
  user_id: string;
  name: string;
  email: string;
  date_joined: string;
  store_names: string;
  active_partnerships: number;
  subscribed_to_open_offer: boolean;
  card_last4: string | null;
}

interface LocationDetail {
  id: string;
  store_name: string;
  store_address: string;
  affiliated_user: string;
  user_id: string;
  active_partnerships: number;
  subscribed_to_offerx: boolean;
  display_option: string;
}

interface PartnershipDetail {
  id: string;
  requesting_retailer: string;
  accepting_retailer: string;
  requested_by: string;
  cancelled_by: string | null;
  date_accepted: string;
  date_cancelled: string | null;
  status: string;
  requesting_impressions: number;
  accepting_impressions: number;
  requesting_redemptions: number;
  accepting_redemptions: number;
}

interface LeaderboardHistoryEntry {
  id: string;
  week_ending: string;
  user_id: string;
  user_email: string;
  store_name: string;
  referral_code: string;
  points: number;
  rank: number;
}

interface OfferDetail {
  id: string;
  call_to_action: string;
  store_name: string;
  user_email: string;
  user_id: string;
  location_id: string;
  created_at: string;
  is_active: boolean;
  offer_image_url: string | null;
  brand_logo_url: string | null;
  business_name: string | null;
  has_open_offer: boolean;
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
  const [selectedBottomMetric, setSelectedBottomMetric] = useState<string | null>(null);
  const [leaderboardHistory, setLeaderboardHistory] = useState<LeaderboardHistoryEntry[]>([]);
  const [currentWeekLeaderboard, setCurrentWeekLeaderboard] = useState<any[]>([]);
  const [savingLeaderboard, setSavingLeaderboard] = useState(false);
  const [metricTrends, setMetricTrends] = useState<Array<{
    month: string;
    clv: number;
    churn: number;
    conversion: number;
  }>>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<Array<{
    month: string;
    users: number;
    locations: number;
    partnerships: number;
    revenue: number;
  }>>([]);
  const [userDetails, setUserDetails] = useState<UserDetail[]>([]);
  const [userCardMap, setUserCardMap] = useState<Record<string, string>>({});
  const [locationDetails, setLocationDetails] = useState<LocationDetail[]>([]);
  const [partnershipDetails, setPartnershipDetails] = useState<PartnershipDetail[]>([]);
  const [userCredits, setUserCredits] = useState<Array<{ user_id: string; email: string; store_name: string; credit_balance: number }>>([]);
  const [creditSearchTerm, setCreditSearchTerm] = useState("");
  const [selectedCreditUser, setSelectedCreditUser] = useState<string | null>(null);
  const [creditAmountToAdd, setCreditAmountToAdd] = useState("");
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);
  const [emailSubscribers, setEmailSubscribers] = useState<Array<{ user_id: string; email: string; store_name: string; subscribed: boolean }>>([]);
  const [offerDetails, setOfferDetails] = useState<OfferDetail[]>([]);
  const [totalOffers, setTotalOffers] = useState(0);
  const [deletingLocation, setDeletingLocation] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; email: string } | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<OfferDetail | null>(null);
  const [upgradingToOpenOffer, setUpgradingToOpenOffer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToTabsAndSetActive = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      
      if (!token) {
        toast.error("Please log in to access admin panel");
        navigate('/login');
        return;
      }

      setIsAuthenticated(true);

      // Check if user has admin role
      if (userRole?.toLowerCase() !== 'admin') {
        toast.error("Access denied: Admin privileges required");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast.error("Error verifying access");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load analytics
      const analyticsResponse = await get({ end_point: 'admin/analytics', token: true });
      if (analyticsResponse?.success) {
        setAnalytics(analyticsResponse.data);
      }

      // Load users
      const usersResponse = await get({ end_point: 'admin/users', token: true });
      const usersData = usersResponse?.success ? usersResponse.data : [];

      // Load locations
      const locationsResponse = await get({ end_point: 'admin/locations', token: true });
      const locationsData = locationsResponse?.success ? locationsResponse.data : [];

      // Load partnerships
      const partnershipsResponse = await get({ end_point: 'admin/partnerships', token: true });
      const partnershipsData = partnershipsResponse?.success ? partnershipsResponse.data : [];

      // Load monthly trends
      const trendsResponse = await get({ end_point: 'admin/monthly-trends', token: true });
      const trendsData = trendsResponse?.success ? trendsResponse.data : [];

      // Load revenue analytics
      const revenueResponse = await get({ end_point: 'admin/revenue', token: true });
      const revenueDataResult = revenueResponse?.success ? revenueResponse.data : [];
      setRevenueData(revenueDataResult);

      // Load user details
      const userDetailsResponse = await get({ end_point: 'admin/user-details', token: true });
      const userDetailsData = userDetailsResponse?.success ? userDetailsResponse.data : [];
      setUserDetails(userDetailsData);

      // Load location details
      const locationDetailsResponse = await get({ end_point: 'admin/location-details', token: true });
      const locationDetailsData = locationDetailsResponse?.success ? locationDetailsResponse.data : [];
      setLocationDetails(locationDetailsData);

      // Load partnership details (already have partnerships, but format them)
      setPartnershipDetails(partnershipsData);

      // Load offers
      const offersResponse = await get({ end_point: 'admin/offers', token: true });
      const offersData = offersResponse?.success ? offersResponse.data : [];
      setOfferDetails(offersData);
      setTotalOffers(offersData.length);

      // Load subscriptions
      const subscriptionsResponse = await get({ end_point: 'admin/subscriptions', token: true });
      const subscriptionsData = subscriptionsResponse?.success ? subscriptionsResponse.data : [];

      // Load user credits
      const creditsResponse = await get({ end_point: 'admin/credits', token: true });
      const creditsData = creditsResponse?.success ? creditsResponse.data : [];
      setUserCredits(creditsData);

      // Format users for the users table
      const formattedUsers: User[] = usersData.map((user: any) => ({
        id: user.id || user._id,
        email: user.email || 'N/A',
        created_at: user.created_at,
        location_count: user.location_count || 0,
        offer_count: user.offer_count || 0,
        redemption_count: user.redemption_count || 0
      }));
      setUsers(formattedUsers);

      // Format locations for the locations table
      const formattedLocations: Location[] = locationsData.map((location: any) => ({
        id: location.id || location._id,
        name: location.name || 'N/A',
        user_email: location.user_email || 'N/A',
        created_at: location.created_at,
        offer_count: location.offer_count || 0,
        redemption_count: location.redemption_count || 0
      }));
      setLocations(formattedLocations);

      // Process monthly trends
      processMonthlyTrends(formattedUsers, formattedLocations, revenueDataResult);

      // Load leaderboard
      const leaderboardResponse = await get({ end_point: 'admin/leaderboard', token: true });
      const leaderboardData = leaderboardResponse?.success ? leaderboardResponse.data : [];
      setCurrentWeekLeaderboard(leaderboardData.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      })));

      // Email subscribers - would need a separate endpoint, for now empty
      setEmailSubscribers([]);

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error(error.message || "Failed to load admin data");
    }
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
    const metricData = [];
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
      const revenueMonth = revenueData.find((r: any) => r.month === monthLabel);
      const revenue = revenueMonth ? revenueMonth.total_revenue : 0;
      
      trends.push({
        month: monthLabel,
        users,
        locations,
        partnerships,
        revenue
      });

      // Calculate metrics for bottom cards
      const monthUsers = usersData.filter(u => new Date(u.created_at) <= monthEnd).length;
      const monthRevenue = revenueData
        .filter((r: any) => {
          const rDate = new Date(r.month);
          return rDate <= monthEnd;
        })
        .reduce((sum, r) => sum + r.total_revenue, 0);
      
      // Customer Lifetime Value (CLV) = Total Revenue / Total Users
      const clv = monthUsers > 0 ? monthRevenue / monthUsers : 0;
      
      // Open Offer Churn - would need subscription cancellation data
      const offerxLocations = locationDetails.filter(l => l.subscribed_to_offerx).length;
      const totalLocations = locations;
      const churn = totalLocations > 0 ? ((totalLocations - offerxLocations) / totalLocations) * 100 : 0;
      
      // Conversion Rate = Paid Users / Total Users
      const paidUsers = monthRevenue > 0 ? monthUsers * 0.3 : 0; // Placeholder estimate
      const conversion = monthUsers > 0 ? (paidUsers / monthUsers) * 100 : 0;
      
      metricData.push({
        month: monthLabel,
        clv,
        churn,
        conversion
      });
    }
    
    setMonthlyTrends(trends);
    setMetricTrends(metricData);
  };

  const grantCredits = async () => {
    if (!selectedCreditUser || !creditAmountToAdd) {
      toast.error("Please select a user and enter an amount");
      return;
    }

    const amount = parseFloat(creditAmountToAdd);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setIsGrantingCredits(true);
    try {
      const response = await post({
        end_point: 'admin/credits/grant',
        body: {
          user_id: selectedCreditUser,
          amount: amount
        },
        token: true
      });

      if (response?.success) {
        toast.success(response.message || `Successfully granted $${amount.toFixed(2)} in promo credits`);
        setSelectedCreditUser(null);
        setCreditAmountToAdd("");
        await loadAdminData();
      } else {
        throw new Error(response?.message || "Failed to grant credits");
      }
    } catch (error: any) {
      console.error('Error granting credits:', error);
      toast.error(error.message || "Failed to grant credits");
    } finally {
      setIsGrantingCredits(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    setIsDeleting(true);
    try {
      const response = await deleteApi({
        end_point: `locations/${locationId}`,
        token: true
      });

      if (response?.success) {
        toast.success('Location deleted successfully');
        setDeletingLocation(null);
        await loadAdminData();
      } else {
        throw new Error(response?.message || 'Failed to delete location');
      }
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error(error.message || 'Failed to delete location');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      // Note: User deletion endpoint may not exist, this would need to be implemented
      toast.error('User deletion not yet implemented');
      setDeletingUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    setIsDeleting(true);
    try {
      const response = await deleteApi({
        end_point: `offers/${offerId}`,
        token: true
      });

      if (response?.success) {
        toast.success('Offer deleted successfully');
        setDeletingOffer(null);
        await loadAdminData();
      } else {
        throw new Error(response?.message || 'Failed to delete offer');
      }
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      toast.error(error.message || 'Failed to delete offer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpgradeToOpenOffer = async (location: LocationDetail) => {
    setUpgradingToOpenOffer(location.id);
    try {
      const response = await post({
        end_point: 'admin/upgrade-open-offer',
        body: {
          location_id: location.id
        },
        token: true
      });

      if (response?.success) {
        toast.success(response.message || `Upgraded ${location.store_name} to Open Offer`);
        await loadAdminData();
      } else {
        throw new Error(response?.message || 'Failed to upgrade to Open Offer');
      }
    } catch (error: any) {
      console.error('Error upgrading to Open Offer:', error);
      toast.error(error.message || 'Failed to upgrade to Open Offer');
    } finally {
      setUpgradingToOpenOffer(null);
    }
  };

  const loadLeaderboardHistory = async () => {
    try {
      // Leaderboard history would need a separate endpoint
      // For now, set empty array
      setLeaderboardHistory([]);
    } catch (error) {
      console.error('Error loading leaderboard history:', error);
    }
  };

  const loadCurrentWeekLeaderboard = async () => {
    try {
      const response = await get({ end_point: 'admin/leaderboard', token: true });
      const leaderboardData = response?.success ? response.data : [];
      setCurrentWeekLeaderboard(leaderboardData.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      })));
    } catch (error) {
      console.error('Error loading current week leaderboard:', error);
    }
  };

  const saveCurrentWeekLeaderboard = async () => {
    setSavingLeaderboard(true);
    try {
      // Leaderboard saving would need a separate endpoint
      toast.error('Leaderboard saving not yet implemented');
    } catch (error: any) {
      console.error('Error saving leaderboard:', error);
      toast.error('Failed to save leaderboard: ' + error.message);
    } finally {
      setSavingLeaderboard(false);
    }
  };

  // Load leaderboard history and current week on mount
  useEffect(() => {
    if (isAdmin) {
      loadLeaderboardHistory();
      loadCurrentWeekLeaderboard();
    }
  }, [isAdmin]);

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

  const currentMonthRevenue = revenueData[revenueData.length - 1] || { 
    openoffer_subscriptions: 0, 
    partnerships: 0, 
    advertising: 0, 
    total_revenue: 0 
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => scrollToTabsAndSetActive('locations')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Users className="w-5 h-5 text-blue-500" /></span>
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_users || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('locations')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Store className="w-5 h-5 text-orange-500" /></span>
                Total Retail Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_locations || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('locations')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Megaphone className="w-5 h-5 text-green-500" /></span>
                Open Offer Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(locationDetails.filter(l => l.subscribed_to_offerx).length)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('partnerships')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Handshake className="w-5 h-5 text-purple-500" /></span>
                Active Partnerships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(partnershipDetails.filter(p => p.status === 'approved' || p.status === 'active').length)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('offers')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Eye className="w-5 h-5 text-cyan-500" /></span>
                Coupon Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_impressions || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/admin/redemptions')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><TicketCheck className="w-5 h-5 text-emerald-500" /></span>
                Redemptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_redemptions || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('leaderboard')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><UserPlus className="w-5 h-5 text-pink-500" /></span>
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.total_referrals || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => scrollToTabsAndSetActive('offers')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><Tag className="w-5 h-5 text-indigo-500" /></span>
                Total Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalOffers)}</div>
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
                <DollarSign size={16} className="text-green-500" />
                Open Offer Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.openoffer_subscriptions)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'partnerships_rev' ? null : 'partnerships_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign size={16} className="text-purple-500" />
                Partnerships Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.partnerships)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'advertising_rev' ? null : 'advertising_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign size={16} className="text-amber-500" />
                Advertising Revenue
              </CardTitle>
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue.advertising || 0)}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric(selectedMetric === 'total_rev' ? null : 'total_rev')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
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
                  {selectedMetric === 'offerx' && <Bar dataKey="openoffer_subscriptions" fill="#8884d8" name="Open Offer Revenue" />}
                  {selectedMetric === 'partnerships_rev' && <Bar dataKey="partnerships" fill="#82ca9d" name="Partnerships Revenue" />}
                  {selectedMetric === 'advertising_rev' && <Bar dataKey="advertising" fill="#ffc658" name="Advertising Revenue" />}
                  {selectedMetric === 'total_rev' && (
                    <>
                      <Bar dataKey="openoffer_subscriptions" stackId="a" fill="#8884d8" name="Open Offer" />
                      <Bar dataKey="partnerships" stackId="a" fill="#82ca9d" name="Partnerships" />
                      <Bar dataKey="advertising" stackId="a" fill="#ffc658" name="Advertising" />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trends Tabs */}
        <Tabs defaultValue="openoffer" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="openoffer">Open Offer Subscriptions</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="openoffer">
            <Card>
              <CardHeader>
                <CardTitle>Open Offer Subscriptions</CardTitle>
                <CardDescription>Total Open Offer subscription charges over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="openoffer_subscriptions" fill="#8dd1e1" name="Open Offer Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partnerships">
            <Card>
              <CardHeader>
                <CardTitle>Partnerships</CardTitle>
                <CardDescription>Total number of active partnerships over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active_partnerships" fill="#82d4bb" name="Active Partnerships" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advertising">
            <Card>
              <CardHeader>
                <CardTitle>Advertising</CardTitle>
                <CardDescription>Total advertising revenue charged to advertisers over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="advertising" fill="#f4a261" name="Advertising Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>Total revenue from all sources over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="openoffer_subscriptions" fill="#8dd1e1" name="Open Offer" stackId="a" />
                    <Bar dataKey="partnerships" fill="#82d4bb" name="Partnerships" stackId="a" />
                    <Bar dataKey="advertising" fill="#f4a261" name="Advertising" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Metric Detail Views */}
        {selectedMetric === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All registered users with account and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date Joined</TableHead>
                      <TableHead>Store Names</TableHead>
                      <TableHead className="text-right"># Active Partnerships</TableHead>
                      <TableHead className="text-center">Open Offer</TableHead>
                      <TableHead className="text-center">Card (Last 4)</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No user data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      userDetails.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{formatDate(user.date_joined)}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={user.store_names}>
                            {user.store_names}
                          </TableCell>
                          <TableCell className="text-right">{user.active_partnerships}</TableCell>
                          <TableCell className="text-center">
                            {user.subscribed_to_open_offer ? (
                              <span className="text-green-600 font-semibold">Y</span>
                            ) : (
                              <span className="text-muted-foreground">N</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {user.card_last4 ? (
                              <span className="font-mono">****{user.card_last4}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeletingUser({ id: user.user_id, email: user.email })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}


        {selectedMetric === 'openoffer' && (
          <Card>
            <CardHeader>
              <CardTitle>Open Offer Locations</CardTitle>
              <CardDescription>Locations subscribed to Open Offer with contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Store Address</TableHead>
                      <TableHead>Owner Contact Email</TableHead>
                      <TableHead className="text-right"># Active Partnerships</TableHead>
                      <TableHead>Display Option</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationDetails.filter(l => l.subscribed_to_offerx).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No Open Offer locations available
                        </TableCell>
                      </TableRow>
                    ) : (
                      locationDetails.filter(l => l.subscribed_to_offerx).map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.store_name}</TableCell>
                          <TableCell>{location.store_address}</TableCell>
                          <TableCell>{location.affiliated_user}</TableCell>
                          <TableCell className="text-right">{location.active_partnerships}</TableCell>
                          <TableCell>{location.display_option}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedBottomMetric(selectedBottomMetric === 'clv' ? null : 'clv')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                Customer Lifetime Value
              </CardTitle>
              <CardDescription>Average revenue per user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metricTrends.length > 0 ? metricTrends[metricTrends.length - 1].clv : 0)}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedBottomMetric(selectedBottomMetric === 'churn' ? null : 'churn')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp size={16} className="text-red-500" />
                Churn
              </CardTitle>
              <CardDescription>Percentage of Open Offer cancelled subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricTrends.length > 0 ? metricTrends[metricTrends.length - 1].churn.toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedBottomMetric(selectedBottomMetric === 'conversion' ? null : 'conversion')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users size={16} className="text-indigo-500" />
                Conversion Rate
              </CardTitle>
              <CardDescription>Paid users / Total users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricTrends.length > 0 ? metricTrends[metricTrends.length - 1].conversion.toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Metrics Chart */}
        {selectedBottomMetric && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedBottomMetric === 'clv' && 'Customer Lifetime Value Over Time'}
                {selectedBottomMetric === 'churn' && 'Open Offer Churn Over Time'}
                {selectedBottomMetric === 'conversion' && 'Conversion Rate Over Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metricTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => {
                      if (selectedBottomMetric === 'clv') return formatCurrency(Number(value));
                      return `${Number(value).toFixed(1)}%`;
                    }} 
                  />
                  <Legend />
                  {selectedBottomMetric === 'clv' && (
                    <Line type="monotone" dataKey="clv" stroke="#8884d8" name="CLV ($)" strokeWidth={2} />
                  )}
                  {selectedBottomMetric === 'churn' && (
                    <Line type="monotone" dataKey="churn" stroke="#ff7c7c" name="Churn (%)" strokeWidth={2} />
                  )}
                  {selectedBottomMetric === 'conversion' && (
                    <Line type="monotone" dataKey="conversion" stroke="#82ca9d" name="Conversion (%)" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Detailed Data Tables */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="locations">Store Locations</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="emails">Email Subscribers</TabsTrigger>
          </TabsList>

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
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1"
                                  disabled={upgradingToOpenOffer === location.id}
                                  onClick={() => handleUpgradeToOpenOffer(location)}
                                >
                                  <Zap className="h-3 w-3" />
                                  {upgradingToOpenOffer === location.id ? 'Upgrading...' : 'Upgrade'}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>{location.display_option}</TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeletingLocation(location.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  All Offers
                </CardTitle>
                <CardDescription>All offers created on the platform linked to stores and users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call to Action</TableHead>
                        <TableHead>Store Name</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offerDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No offers available
                          </TableCell>
                        </TableRow>
                      ) : (
                        offerDetails.map((offer) => (
                          <TableRow 
                            key={offer.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setPreviewOffer(offer)}
                          >
                            <TableCell className="font-medium max-w-xs truncate">{offer.call_to_action}</TableCell>
                            <TableCell>{offer.store_name}</TableCell>
                            <TableCell>{offer.user_email}</TableCell>
                            <TableCell>{formatDate(offer.created_at)}</TableCell>
                            <TableCell className="text-center">
                              {offer.is_active ? (
                                <span className="text-green-600 font-semibold">Yes</span>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewOffer(offer);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingOffer(offer.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Requesting Retailer</TableHead>
                        <TableHead>Accepting Retailer</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Cancelled By</TableHead>
                        <TableHead>Date Started</TableHead>
                        <TableHead>Date Cancelled</TableHead>
                        <TableHead className="text-right">Req. Impressions</TableHead>
                        <TableHead className="text-right">Acc. Impressions</TableHead>
                        <TableHead className="text-right">Req. Redemptions</TableHead>
                        <TableHead className="text-right">Acc. Redemptions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnershipDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center text-muted-foreground">
                            No partnership data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        partnershipDetails.map((partnership) => (
                          <TableRow key={partnership.id}>
                            <TableCell>
                              {partnership.status === 'active' || partnership.status === 'approved' ? (
                                <span className="text-green-600 font-semibold">Active</span>
                              ) : (
                                <span className="text-muted-foreground">Inactive</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{partnership.requesting_retailer}</TableCell>
                            <TableCell className="font-medium">{partnership.accepting_retailer}</TableCell>
                            <TableCell>{partnership.requested_by}</TableCell>
                            <TableCell>{partnership.cancelled_by || '-'}</TableCell>
                            <TableCell>{formatDate(partnership.date_accepted)}</TableCell>
                            <TableCell>
                              {partnership.date_cancelled ? formatDate(partnership.date_cancelled) : '-'}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.requesting_impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.accepting_impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.requesting_redemptions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(partnership.accepting_redemptions)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="space-y-6">
              {/* Current Week Section */}
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy size={20} className="text-amber-500" />
                        Current Week Leaderboard
                      </CardTitle>
                      <CardDescription>Live rankings for the current week (auto-archived every Monday at 12:00 AM)</CardDescription>
                    </div>
                    <Button 
                      onClick={saveCurrentWeekLeaderboard} 
                      disabled={savingLeaderboard}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {savingLeaderboard ? 'Saving...' : 'Manual Archive'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Rank</TableHead>
                          <TableHead>Store Name</TableHead>
                          <TableHead>User Email</TableHead>
                          <TableHead>Referral Code</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentWeekLeaderboard.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No leaderboard data for current week
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentWeekLeaderboard.map((entry, index) => (
                            <TableRow key={entry.user_id || index}>
                              <TableCell className="text-center">
                                {entry.rank <= 3 ? (
                                  <span className={`font-bold ${
                                    entry.rank === 1 ? 'text-amber-500' : 
                                    entry.rank === 2 ? 'text-gray-400' : 
                                    'text-amber-700'
                                  }`}>
                                    #{entry.rank}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">#{entry.rank}</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{entry.store_name}</TableCell>
                              <TableCell>{entry.user_email}</TableCell>
                              <TableCell className="font-mono text-sm">{entry.referral_code}</TableCell>
                              <TableCell className="text-right font-semibold">{entry.points}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Archives Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar size={20} className="text-muted-foreground" />
                    Historical Archives
                  </CardTitle>
                  <CardDescription>Past weekly leaderboard snapshots (week ending Sunday)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Week Ending</TableHead>
                          <TableHead className="text-center">Rank</TableHead>
                          <TableHead>Store Name</TableHead>
                          <TableHead>User Email</TableHead>
                          <TableHead>Referral Code</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No archived leaderboard history yet. Archives are created automatically every Monday at 12:00 AM.
                            </TableCell>
                          </TableRow>
                        ) : (
                          leaderboardHistory.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-muted-foreground" />
                                  {new Date(entry.week_ending).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {entry.rank <= 3 ? (
                                  <span className={`font-bold ${
                                    entry.rank === 1 ? 'text-amber-500' : 
                                    entry.rank === 2 ? 'text-gray-400' : 
                                    'text-amber-700'
                                  }`}>
                                    #{entry.rank}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">#{entry.rank}</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{entry.store_name}</TableCell>
                              <TableCell>{entry.user_email}</TableCell>
                              <TableCell className="font-mono text-sm">{entry.referral_code}</TableCell>
                              <TableCell className="text-right font-semibold">{entry.points}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Promo Credits Management
                </CardTitle>
                <CardDescription>View and grant promo credits to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grant Credits Form */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Grant Promo Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Search User by Email</label>
                        <Input
                          placeholder="Search by email..."
                          value={creditSearchTerm}
                          onChange={(e) => setCreditSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48 space-y-2">
                        <label className="text-sm font-medium">Amount ($)</label>
                        <Input
                          type="number"
                          placeholder="50.00"
                          value={creditAmountToAdd}
                          onChange={(e) => setCreditAmountToAdd(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={grantCredits}
                          disabled={!selectedCreditUser || !creditAmountToAdd || isGrantingCredits}
                          className="w-full sm:w-auto"
                        >
                          {isGrantingCredits ? "Granting..." : "Grant Credits"}
                        </Button>
                      </div>
                    </div>
                    {selectedCreditUser && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {userCredits.find(u => u.user_id === selectedCreditUser)?.email} 
                        (Current balance: ${userCredits.find(u => u.user_id === selectedCreditUser)?.credit_balance.toFixed(2)})
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Credits Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Select</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Store Name</TableHead>
                        <TableHead className="text-right">Credit Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCredits
                        .filter(u => 
                          creditSearchTerm === "" || 
                          u.email.toLowerCase().includes(creditSearchTerm.toLowerCase()) ||
                          u.store_name.toLowerCase().includes(creditSearchTerm.toLowerCase())
                        )
                        .sort((a, b) => b.credit_balance - a.credit_balance)
                        .map((user) => (
                          <TableRow 
                            key={user.user_id}
                            className={selectedCreditUser === user.user_id ? "bg-muted" : "cursor-pointer hover:bg-muted/50"}
                            onClick={() => setSelectedCreditUser(user.user_id)}
                          >
                            <TableCell>
                              <input
                                type="radio"
                                name="creditUser"
                                checked={selectedCreditUser === user.user_id}
                                onChange={() => setSelectedCreditUser(user.user_id)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.store_name}</TableCell>
                            <TableCell className="text-right">
                              <span className={user.credit_balance > 0 ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                                ${user.credit_balance.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Email Subscribers
                </CardTitle>
                <CardDescription>Users subscribed to partnership email notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailSubscribers.filter(s => s.subscribed).map((subscriber) => (
                        <TableRow key={subscriber.user_id}>
                          <TableCell className="font-medium">{subscriber.email}</TableCell>
                          <TableCell>{subscriber.store_name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Subscribed
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {emailSubscribers.filter(s => s.subscribed).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No email subscribers yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Total subscribed: {emailSubscribers.filter(s => s.subscribed).length} / {emailSubscribers.length} users
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Delete Location Confirmation */}
      <AlertDialog open={!!deletingLocation} onOpenChange={() => setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Store Location
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this store location and all associated offers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingLocation && handleDeleteLocation(deletingLocation)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Location'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deletingUser?.email}'s account, all their locations, offers, partnerships, and cancel any active billing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingUser && handleDeleteUser(deletingUser.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer Confirmation */}
      <AlertDialog open={!!deletingOffer} onOpenChange={() => setDeletingOffer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Offer
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this offer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingOffer && handleDeleteOffer(deletingOffer)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Offer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Offer Preview Dialog */}
      <Dialog open={!!previewOffer} onOpenChange={() => setPreviewOffer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Preview</DialogTitle>
            <DialogDescription>
              {previewOffer?.store_name} • {previewOffer?.user_email}
            </DialogDescription>
          </DialogHeader>
          {previewOffer && (
            <div className="space-y-4">
              {previewOffer.offer_image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={previewOffer.offer_image_url} 
                    alt="Offer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                {previewOffer.brand_logo_url && (
                  <img 
                    src={previewOffer.brand_logo_url} 
                    alt="Brand logo" 
                    className="h-10 object-contain"
                  />
                )}
                <h3 className="text-lg font-semibold">{previewOffer.business_name || previewOffer.store_name}</h3>
                <p className="text-xl font-bold text-primary">{previewOffer.call_to_action}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Created: {formatDate(previewOffer.created_at)}</span>
                  <span>•</span>
                  <span className={previewOffer.is_active ? 'text-green-600' : ''}>
                    {previewOffer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {previewOffer.has_open_offer && (
                  <div className="flex items-center gap-1 text-sm text-primary font-medium">
                    <Zap className="h-4 w-4" />
                    Open Offer Active
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
