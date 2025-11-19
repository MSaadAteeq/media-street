import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeeklyCountdown } from "@/hooks/useWeeklyCountdown";
import coffeePromo from "@/assets/coffee-promo.jpg";
import flowerPromo from "@/assets/flower-promo.jpg";
import cleaningPromo from "@/assets/cleaning-promo.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import { DollarSign, Eye, Store, Search, Download, MoreVertical, Calendar, Bell, Settings, Home, Info, ArrowUpDown, Headphones, TrendingUp, Zap, Plus, Ticket, MapPin, Users, ExternalLink, LogOut, Gift, Pause, Minus, X, Printer, ShoppingBag, Bot, Monitor, QrCode, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
// import { Toaster } from "@/components/ui/toaster";
import { SupportDialog } from "@/components/SupportDialog";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";
import { get, post } from "@/services/apis";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const countdown = useWeeklyCountdown();
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false);
  const [pauseAdsDialogOpen, setPauseAdsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedLocationForCoupon, setSelectedLocationForCoupon] = useState<string>(""); // Location ID for coupon redemption
  const [couponCode, setCouponCode] = useState("");
  const [couponVerification, setCouponVerification] = useState<any>(null); // Store verification result
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const authData = useSelector((state: any) => state.auth.authData);

  // Dynamic data state
  const [offers, setOffers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasOpenOffer, setHasOpenOffer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inboundViews: 0,
    outboundViews: 0,
    totalRedemptions: 0,
    activeOffers: 0,
    activePartnerships: 0,
    impressions: 0,
    qrScans: 0,
    conversionRate: 0
  });
  const [locationAnalytics, setLocationAnalytics] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      try {
        const userResponse = await get({ end_point: 'users/me', token: true });
        if (userResponse.success && userResponse.data) {
          setCurrentUser(userResponse.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Fetch locations
      try {
        const locationsResponse = await get({ end_point: 'locations', token: true });
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data);
          // Auto-select first location for coupon redemption if only one location
          if (locationsResponse.data.length === 1) {
            setSelectedLocationForCoupon(locationsResponse.data[0]._id || locationsResponse.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }

      // Fetch offers
      try {
        const offersResponse = await get({ end_point: 'offers', token: true });
        if (offersResponse.success && offersResponse.data) {
          setOffers(offersResponse.data);
          const activeOffers = offersResponse.data.filter((o: any) => o.is_active);
          setHasOpenOffer(activeOffers.some((o: any) => o.is_open_offer));
          
          // Calculate stats
          const totalRedemptions = offersResponse.data.reduce((sum: number, o: any) => sum + (o.redemption_count || 0), 0);
          setStats(prev => ({
            ...prev,
            activeOffers: activeOffers.length,
            totalRedemptions
          }));
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      }

      // Fetch partnerships
      try {
        const partnersResponse = await get({ end_point: 'partners', token: true });
        if (partnersResponse.success && partnersResponse.data) {
          setPartnerships(partnersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching partnerships:', error);
      }

      // Fetch redemptions for stats
      try {
        const redemptionsResponse = await get({ end_point: 'redemptions', token: true });
        if (redemptionsResponse.success && redemptionsResponse.data) {
          const redemptions = redemptionsResponse.data || [];
          const totalRedemptions = redemptions.length;
          
          // Calculate stats from redemptions
          // Inbound views = redemptions at partner locations (where user's offer was redeemed)
          // Outbound views = redemptions at user's locations (where partner offers were redeemed)
          const inboundViews = redemptions.filter((r: any) => r.offer?.userId && r.location?.userId !== r.offer?.userId).length;
          const outboundViews = redemptions.filter((r: any) => r.location?.userId && r.offer?.userId !== r.location?.userId).length;
          
          // Calculate QR scans (approximation - can be improved with dedicated analytics endpoint)
          const qrScans = redemptions.length * 2; // Rough estimate
          
          // Calculate impressions (approximation)
          const impressions = qrScans * 3; // Rough estimate
          
          // Calculate conversion rate
          const conversionRate = qrScans > 0 ? (totalRedemptions / qrScans) * 100 : 0;
          
          setStats(prev => ({
            ...prev,
            inboundViews,
            outboundViews,
            totalRedemptions,
            qrScans,
            impressions,
            conversionRate: Math.round(conversionRate * 10) / 10
          }));
        }
      } catch (error) {
        console.error('Error fetching redemptions:', error);
      }

      // Fetch analytics for locations
      try {
        // Map locations with their analytics
        const locationAnalyticsData = locations.map((loc: any) => {
          const locationOffers = offers.filter((o: any) => {
            const offerLocationIds = o.locationIds || o.location_ids || [];
            return offerLocationIds.some((lid: any) => {
              const lidStr = lid?._id?.toString() || lid?.toString() || lid;
              return lidStr === (loc._id?.toString() || loc.id?.toString());
            });
          });
          
          const activeOffer = locationOffers.find((o: any) => o.is_active) || locationOffers[0];
          const locationPartnerships = partnerships.filter((p: any) => {
            const pLocationId = p.location_id?._id?.toString() || p.location_id?.toString() || p.location_id;
            return pLocationId === (loc._id?.toString() || loc.id?.toString());
          });
          
          return {
            id: loc._id?.toString() || loc.id?.toString(),
            name: loc.name,
            address: loc.address,
            currentOffer: activeOffer,
            impressions: Math.floor(Math.random() * 50), // TODO: Replace with actual analytics
            qrScans: Math.floor(Math.random() * 20), // TODO: Replace with actual analytics
            redemptions: activeOffer?.redemption_count || 0,
            partners: locationPartnerships.length,
            isOpenOffer: activeOffer?.is_open_offer || false,
            startDate: activeOffer?.created_at ? new Date(activeOffer.created_at).toLocaleDateString() : '-',
            endDate: activeOffer?.expires_at ? new Date(activeOffer.expires_at).toLocaleDateString() : 'Ongoing'
          };
        });
        
        setLocationAnalytics(locationAnalyticsData);
      } catch (error) {
        console.error('Error calculating location analytics:', error);
      }

      // Fetch leaderboard data
      try {
        // TODO: Replace with actual leaderboard API endpoint
        // For now, set empty array - will be populated when backend endpoint is ready
        setLeaderboardData([]);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateRedemptionCode = async (code: string) => {
    if (!code.trim()) {
      return {
        isValid: false,
        error: "Please enter a redemption code"
      };
    }

    try {
      // Verify redemption code via API
      const response = await post({ 
        end_point: 'redemptions/verify', 
        body: { code },
        token: true
      });

      if (response.success && response.data?.valid) {
        return {
          isValid: true,
          offer: response.data.offer
        };
      } else {
        return {
          isValid: false,
          error: response.message || "Invalid redemption code"
        };
      }
    } catch (error: any) {
      // Fallback: Check if code matches any active offer
      const matchingOffer = offers.find((offer: any) => {
        const prefix = offer.redemption_code_prefix || offer.redemption_code || 'OFFER';
        return code.toUpperCase().startsWith(prefix.toUpperCase());
      });

      if (!matchingOffer) {
        return {
          isValid: false,
          error: "This code doesn't match any of your active offers. Please check your My Offers section."
        };
      }

      return {
        isValid: true,
        offer: matchingOffer
      };
    }
  };

  const handlePrintOffer = (imageSrc: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Partner Offer</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              @media print {
                body { padding: 0; }
                img { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <img src="${imageSrc}" alt="Partner Offer" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const periods = ["All", "30 days", "7 days", "24 hours"];

  // Leaderboard data - will be fetched from API when endpoint is ready
  const staticLeaderboardData = [
    {
      user_id: 'user-1',
      store_name: "Joe's Coffee",
      points: 47,
      rank: 1,
      redemptions_made: 15,
      redemptions_referred: 32
    },
    {
      user_id: 'user-2',
      store_name: "Daily Dry Cleaner",
      points: 34,
      rank: 2,
      redemptions_made: 12,
      redemptions_referred: 22
    },
    {
      user_id: 'user-3',
      store_name: "Sally's Salon",
      points: 28,
      rank: 3,
      redemptions_made: 10,
      redemptions_referred: 18,
      isCurrentUser: true
    },
    {
      user_id: 'user-4',
      store_name: "Mike's Deli",
      points: 22,
      rank: 4,
      redemptions_made: 8,
      redemptions_referred: 14
    },
    {
      user_id: 'user-5',
      store_name: "City Bike Shop",
      points: 19,
      rank: 5,
      redemptions_made: 7,
      redemptions_referred: 12
    },
    {
      user_id: 'user-6',
      store_name: "Sunset Bakery",
      points: 15,
      rank: 6,
      redemptions_made: 6,
      redemptions_referred: 9
    },
    {
      user_id: 'user-7',
      store_name: "Corner Pharmacy",
      points: 12,
      rank: 7,
      redemptions_made: 4,
      redemptions_referred: 8
    },
    {
      user_id: 'user-8',
      store_name: "Pizza Palace",
      points: 8,
      rank: 8,
      redemptions_made: 3,
      redemptions_referred: 5
    },
    {
      user_id: 'user-9',
      store_name: "Tech Repair",
      points: 7,
      rank: 9,
      redemptions_made: 2,
      redemptions_referred: 5
    },
    {
      user_id: 'user-10',
      store_name: "Book Haven",
      points: 6,
      rank: 10,
      redemptions_made: 2,
      redemptions_referred: 4
    },
    {
      user_id: 'user-11',
      store_name: "Pet Store Plus",
      points: 5,
      rank: 11,
      redemptions_made: 2,
      redemptions_referred: 3
    },
    {
      user_id: 'user-12',
      store_name: "Auto Service",
      points: 4,
      rank: 12,
      redemptions_made: 1,
      redemptions_referred: 3
    },
    {
      user_id: 'user-13',
      store_name: "Home Goods",
      points: 4,
      rank: 13,
      redemptions_made: 1,
      redemptions_referred: 3
    },
    {
      user_id: 'user-14',
      store_name: "Music Store",
      points: 3,
      rank: 14,
      redemptions_made: 1,
      redemptions_referred: 2
    },
    {
      user_id: 'user-15',
      store_name: "Sally's Spa",
      points: 3,
      rank: 15,
      redemptions_made: 1,
      redemptions_referred: 2,
      isCurrentUser: true
    },
    {
      user_id: 'user-16',
      store_name: "Clothing Boutique",
      points: 2,
      rank: 16,
      redemptions_made: 1,
      redemptions_referred: 1
    },
    {
      user_id: 'user-17',
      store_name: "Electronics Hub",
      points: 2,
      rank: 17,
      redemptions_made: 0,
      redemptions_referred: 2
    },
    {
      user_id: 'user-18',
      store_name: "Pizza Corner",
      points: 2,
      rank: 18,
      redemptions_made: 1,
      redemptions_referred: 1
    },
    {
      user_id: 'user-19',
      store_name: "Flower Shop",
      points: 1,
      rank: 19,
      redemptions_made: 0,
      redemptions_referred: 1
    },
    {
      user_id: 'user-20',
      store_name: "Hardware Store",
      points: 1,
      rank: 20,
      redemptions_made: 1,
      redemptions_referred: 0
    },
    {
      user_id: 'user-21',
      store_name: "Jewelry Store",
      points: 1,
      rank: 21,
      redemptions_made: 0,
      redemptions_referred: 1
    },
    {
      user_id: 'user-22',
      store_name: "Art Supply Co",
      points: 1,
      rank: 22,
      redemptions_made: 1,
      redemptions_referred: 0
    },
    {
      user_id: 'user-23',
      store_name: "Sally's Boutique",
      points: 1,
      rank: 23,
      redemptions_made: 0,
      redemptions_referred: 1,
      isCurrentUser: true
    }
  ];

  const handlePausePartnership = () => {
    toast({
      title: "Partnership Paused",
      description: "Your partnership has been paused successfully."
    });
    setPauseDialogOpen(false);
    setSelectedCampaign(null);
  };

  const getCampaignActionIcon = (campaign: any, index: number) => {
    if (campaign.status === "Expired") {
      return (
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Minus className="h-4 w-4" />
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
        onClick={() => {
          setSelectedCampaign(campaign.store);
          setPauseDialogOpen(true);
        }}
      >
        <Pause className="h-4 w-4" />
      </Button>
    );
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };

  const getPromoImage = (index: number, type: 'their' | 'your') => {
    if (type === 'their') {
      const images = [coffeePromo, flowerPromo, cleaningPromo];
      return images[index] || coffeePromo;
    }
    // For 'your' offers, use the original uploaded image
    return "/lovable-uploads/21938e2c-ec16-42e4-aa4b-d9b87ba22815.png";
  };

  const handleVerifyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Coupon Code Required",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    if (!selectedLocationForCoupon) {
      toast({
        title: "Location Required",
        description: "Please select a location to verify the coupon",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify coupon code for the selected location
      const response = await post({
        end_point: 'redemptions/verify-coupon',
        body: {
          couponCode: couponCode.trim(),
          locationId: selectedLocationForCoupon
        },
        token: true
      });

      if (response.success && response.data) {
        if (response.data.valid) {
          setCouponVerification(response.data);
          toast({
            title: "Coupon Valid!",
            description: response.data.message || "This coupon is valid for this location. You can now redeem it.",
          });
        } else {
          setCouponVerification(null);
          toast({
            title: "Invalid Coupon",
            description: response.data.message || "This coupon is not valid for this location.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(response.message || 'Failed to verify coupon');
      }
    } catch (error: any) {
      setCouponVerification(null);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to verify coupon",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogRedemption = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Coupon Code Required",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    if (!selectedLocationForCoupon) {
      toast({
        title: "Location Required",
        description: "Please select a location to redeem the coupon",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Redeem coupon code at the selected location
      const response = await post({
        end_point: 'redemptions/redeem-coupon',
        body: {
          couponCode: couponCode.trim(),
          locationId: selectedLocationForCoupon
        },
        token: true
      });

      if (response.success) {
        toast({
          title: "Coupon Redeemed Successfully!",
          description: response.message || `Coupon code "${couponCode}" has been redeemed at ${response.data?.location?.name || 'your location'}!`,
        });

        setCouponCode("");
        setCouponVerification(null);
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        throw new Error(response.message || 'Failed to redeem coupon');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to redeem coupon. Make sure the coupon is valid for this location.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Static logout - just navigate to login
    dispatch(authActions.logout())
    localStorage.removeItem('token')
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-16 sm:pb-0">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-12 sm:w-16 bg-background border-r border-border flex flex-col items-center py-3 sm:py-4 space-y-4 sm:space-y-6 z-40">
          <Logo size="sm" showText={false} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
                <Home className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Dashboard</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/requests')}>
                <Store className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Partner Requests</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/locations')}>
                <MapPin className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Store Locations</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/offers')}>
                <Zap className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Your Offers</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/openoffer')}>
                <Bot className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open Offer</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/display')}>
                <Monitor className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>In-Store Display</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Content */}
        <div className="ml-16 min-h-screen">
          {/* Header */}
          <header className="bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <Home className="h-5 w-5 text-primary" />
              <span className="text-foreground font-medium">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Gift className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Your Retailer Referral Code</p>
                    <div className="bg-muted p-2 rounded font-mono text-sm">{currentUser?.referralCode || "Loading..."}</div>
                    <p className="text-xs text-muted-foreground">Share this code with retailers. You'll get 3 points when they sign up using your code!</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Bell className="h-5 w-5" />
              </Button>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-green rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center relative z-50">
                    <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent-green rounded-full border-2 border-background">
                      {currentUser?.fullName ? (
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white text-xs font-semibold">
                          {currentUser.fullName.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <img src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png" alt={currentUser?.fullName || "User"} className="w-full h-full rounded-full object-cover" />
                      )}
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent align="end" sideOffset={8} className="w-80 p-0 bg-card border-border shadow-lg z-[100]">
                  <div className="p-4 space-y-4">
                    {/* Account Section */}
                    <div className="space-y-3">
                      <div className="text-muted-foreground text-sm font-medium">Account</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent-green rounded-full flex items-center justify-center">
                          {currentUser?.fullName ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white font-semibold">
                              {currentUser.fullName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <img src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png" alt={currentUser?.fullName || "User"} className="w-10 h-10 rounded-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground font-semibold truncate">{currentUser?.fullName || "User"}</div>
                          <div className="text-muted-foreground text-sm truncate">{currentUser?.email || "No email"}</div>
                        </div>
                        <div className="w-2 h-2 bg-accent-green rounded-full flex-shrink-0"></div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1 border-t border-border pt-4">
                      <button onClick={() => navigate('/settings/profile')} className="w-full text-left py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        Profile
                      </button>
                      <button onClick={() => navigate('/settings/messages')} className="w-full text-left py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        Messages
                      </button>
                      <button onClick={() => navigate('/settings/billing')} className="w-full text-left py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        Billing
                      </button>
                      <button onClick={() => navigate('/settings')} className="w-full text-left py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        Settings
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border pt-4">
                      <button onClick={handleLogout} className="w-full flex items-center space-x-2 py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>

                    {/* Footer Links */}
                    <div className="border-t border-border pt-4 flex items-center justify-center space-x-2">
                      <button onClick={() => navigate('/privacy-policy')} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        Privacy Policy
                      </button>
                      <span className="text-muted-foreground text-sm">•</span>
                      <button onClick={() => navigate('/terms-of-service')} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        Terms & Conditions
                      </button>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </header>

          {/* Main Dashboard */}
          <main className="p-6 space-y-6">
            {/* Weekly Scan Counter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Inbound Views This Week</p>
                          <p className="text-3xl font-bold text-primary">{stats.inboundViews}</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <QrCode className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Inbound Scans</p>
                  <p className="text-sm">The number of times users have scanned your offers at other retailers this week. Higher inbound scans mean more customers are discovering and using your promotions.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Outbound Views This Week</p>
                          <p className="text-3xl font-bold text-accent-green">{stats.outboundViews}</p>
                        </div>
                        <div className="h-12 w-12 bg-accent-green/10 rounded-full flex items-center justify-center">
                          <QrCode className="h-6 w-6 text-accent-green" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Outbound Scans</p>
                  <p className="text-sm">The number of times consumers at your store have scanned partner offers this week. Higher outbound scans show you're driving traffic and value to your partners.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Log Offer Redemption - Right aligned under notice */}
            <div className="flex justify-between items-start">
              {/* Welcome Section */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome Back{currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : authData?.fullName ? `, ${authData.fullName.split(' ')[0]}` : ''}
                </h1>
                <p className="text-muted-foreground">Here's the latest summary for your stores on Media Street</p>
              </div>

              {/* Log Offer Redemption */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Redeem Coupon Code</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Enter the 6-digit coupon code from the customer's coupon. The system will verify that the coupon is valid for your selected location before allowing redemption. This ensures coupons can only be redeemed at the correct store where the offer is active.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Location Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Location:</span>
                    <Select
                      value={selectedLocationForCoupon}
                      onValueChange={setSelectedLocationForCoupon}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc._id || loc.id} value={loc._id || loc.id}>
                            {loc.name} - {loc.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Coupon Code Input and Actions */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter 6-digit coupon code..."
                      value={couponCode}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setCouponCode(value);
                        setCouponVerification(null); // Clear verification when code changes
                      }}
                      className="w-48 font-mono text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleVerifyCoupon}
                      disabled={!couponCode.trim() || couponCode.length !== 6 || !selectedLocationForCoupon || isLoading}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleLogRedemption}
                      disabled={!couponCode.trim() || couponCode.length !== 6 || !selectedLocationForCoupon || isLoading || !couponVerification?.valid}
                    >
                      {isLoading ? "Processing..." : "Redeem"}
                    </Button>
                  </div>
                  
                  {/* Verification Status */}
                  {couponVerification && (
                    <div className={`p-3 rounded-lg border ${
                      couponVerification.valid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {couponVerification.valid ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-semibold text-green-800">Valid Coupon</p>
                              <p className="text-xs text-green-600">{couponVerification.message}</p>
                              {couponVerification.coupon?.offer && (
                                <p className="text-xs text-green-700 mt-1">
                                  Offer: {couponVerification.coupon.offer.callToAction}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <X className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="text-sm font-semibold text-red-800">Invalid Coupon</p>
                              <p className="text-xs text-red-600">{couponVerification.message}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* How to Media Street */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 border-primary/20 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-full px-6 py-3 border border-border/50 shadow-md">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold text-foreground">How to Media Street</span>
                  </div>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Step 1: Create your first offer */}
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</div>
                          <span className="text-sm font-semibold text-foreground">Create Your Offer</span>
                        </div>
                        <Checkbox checked={offers.length > 0} className={offers.length > 0 ? "data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green" : "border-muted-foreground/30"} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">Design an offer that will appear at partner stores</p>
                      <Button variant="link" size="sm" onClick={() => navigate('/offers/create')} className="text-xs p-0 h-auto">
                        Create Offer →
                      </Button>
                    </div>

                    {/* Step 2: Display Media Street */}
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</div>
                          <span className="text-sm font-semibold text-foreground">Display Media Street in Store</span>
                        </div>
                        <Checkbox checked={localStorage.getItem('displayCarousel') === 'true' || localStorage.getItem('displayQR') === 'true'} className={localStorage.getItem('displayCarousel') === 'true' || localStorage.getItem('displayQR') === 'true' ? "data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green" : "border-muted-foreground/30"} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">Choose tablet carousel or your store's QR code sticker</p>
                      <div className="flex gap-2">
                        <Button variant="link" size="sm" onClick={() => navigate('/display')} className="text-xs p-0 h-auto">
                          Carousel →
                        </Button>
                        <Button variant="link" size="sm" onClick={() => navigate('/locations')} className="text-xs p-0 h-auto">
                          Print QR →
                        </Button>
                      </div>
                    </div>

                    {/* Step 3: Partner or Open Offer */}
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</div>
                          <span className="text-sm font-semibold text-foreground">Get Partners</span>
                        </div>
                        <Checkbox checked={partnerships.length > 0 || hasOpenOffer} className={partnerships.length > 0 || hasOpenOffer ? "data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green" : "border-muted-foreground/30"} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">Send/accept partner requests or sign up for Open Offer</p>
                      <div className="flex gap-2">
                        <Button variant="link" size="sm" onClick={() => navigate('/requests')} className="text-xs p-0 h-auto">
                          Requests →
                        </Button>
                        <Button variant="link" size="sm" onClick={() => navigate('/openoffer')} className="text-xs p-0 h-auto">
                          Open Offer →
                        </Button>
                      </div>
                    </div>

                    {/* Step 4: Add more locations */}
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">4</div>
                          <span className="text-sm font-semibold text-foreground">Scale Up</span>
                        </div>
                        <Checkbox checked={locations.length >= 2} className={locations.length >= 2 ? "data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green" : "border-muted-foreground/30"} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">See what's working and add multiple store locations</p>
                      <Button variant="link" size="sm" onClick={() => navigate('/locations')} className="text-xs p-0 h-auto">
                        Add Locations →
                      </Button>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-foreground">Please select your in-store display method:</p>
                      <p className="text-xs text-muted-foreground mt-1">Both methods are recommended</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background flex-1">
                        <Checkbox id="dashboard-carousel" className="h-4 w-4" onCheckedChange={checked => {
                          localStorage.setItem('displayCarousel', String(checked));
                        }} defaultChecked={localStorage.getItem('displayCarousel') === 'true'} />
                        <label htmlFor="dashboard-carousel" className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                          <Monitor className="h-4 w-4" />
                          <span>Partner Carousel <span className="text-muted-foreground font-normal">(Best)</span></span>
                        </label>
                        <Button variant="link" size="sm" onClick={() => navigate('/display')} className="text-xs">
                          Display
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background flex-1">
                        <Checkbox id="dashboard-qr" className="h-4 w-4" onCheckedChange={checked => {
                          localStorage.setItem('displayQR', String(checked));
                        }} defaultChecked={localStorage.getItem('displayQR') === 'true'} />
                        <label htmlFor="dashboard-qr" className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                          <Printer className="h-4 w-4" />
                          <span>QR Codes <span className="text-muted-foreground font-normal">(Easiest)</span></span>
                        </label>
                        <Button variant="link" size="sm" onClick={() => navigate('/locations')} className="text-xs">
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Period Filters */}
            <div className="flex items-center space-x-2">
              {periods.map(period => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={selectedPeriod === period ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
                >
                  {period}
                </Button>
              ))}
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Offer Distribution
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of active partnerships and your Open Offer status.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Active Partnerships */}
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate('/requests')}
                    >
                      <div className="text-xs text-muted-foreground mb-1">Active Partnerships</div>
                      <div className="text-3xl font-bold text-foreground">{partnerships.length}</div>
                      <div className="flex items-center space-x-2 text-sm">
                        <TrendingUp className="h-3 w-3 text-accent-green" />
                        <span className="text-accent-green">-</span>
                        <span className="text-muted-foreground">vs last month</span>
                      </div>
                    </div>

                    {/* Open Offer Status */}
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity pt-3 border-t border-border"
                      onClick={() => navigate('/openoffer')}
                    >
                      <div className="text-xs text-muted-foreground mb-1">Open Offer</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasOpenOffer ? "default" : "secondary"} className={hasOpenOffer ? "bg-accent-green text-white" : ""}>
                          {hasOpenOffer ? "On" : "Off"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Offer Impressions
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>These are the impressions your offers have gotten.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.impressions}</div>
                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-3 w-3 text-destructive" />
                      <span className="text-destructive">-</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      QR Scans
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is the number of times consumers have scanned your offers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.qrScans}</div>
                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-3 w-3 text-accent-green" />
                      <span className="text-accent-green">-</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Redemptions
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is the number of redemptions you've logged for your offers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalRedemptions}</div>
                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-3 w-3 text-accent-green" />
                      <span className="text-accent-green">-</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Referral Leaderboard */}
            <Card className="bg-card border-border shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Weekly Referral Leaderboard
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Earn 1 point for every coupon viewed at your location, 2 points for a consumer redemption at a referred retailer and 3 points for getting new retailers to join Media Street with your invite code! Weekly winner takes home $1K!</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">$1K paid weekly</div>
                    <div className="text-sm font-semibold text-primary flex items-center gap-1">
                      <span>🏆</span>
                      <span>{countdown}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Top 10 or first 3 retailers */}
                    {leaderboardData.length > 0 ? (
                      (showLeaderboard ? leaderboardData.slice(0, 10) : leaderboardData.slice(0, 3)).map((retailer, index) => (
                      <div key={retailer.user_id} className={`flex items-center space-x-2 transition-colors rounded-lg px-3 py-2 relative ${retailer.isCurrentUser ? 'bg-primary/10 border-2 border-primary/30 shadow-md' : 'bg-secondary/50 hover:bg-secondary/70'}`}>
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${retailer.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                          {retailer.rank}
                        </div>
                        <span className={`text-sm font-medium ${retailer.isCurrentUser ? 'text-primary font-semibold' : 'text-foreground'}`}>
                          {retailer.store_name}
                        </span>
                        <Badge variant="secondary" className={`text-xs ${retailer.isCurrentUser ? 'bg-primary/20 text-primary border-primary/30' : 'bg-accent-green/10 text-accent-green border-accent-green/20'}`}>
                          {retailer.points} pts
                        </Badge>
                      </div>
                    ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Leaderboard data will appear here once available
                      </div>
                    )}

                    {/* Show user's lower-ranked locations when expanded */}
                    {showLeaderboard && leaderboardData.filter(retailer => retailer.isCurrentUser && retailer.rank > 10).length > 0 && (
                      <>
                        <div className="w-full border-t border-border my-2"></div>
                        <div className="w-full text-xs text-muted-foreground mb-2">Your other locations:</div>
                        {leaderboardData.filter(retailer => retailer.isCurrentUser && retailer.rank > 10).map(retailer => (
                          <div key={retailer.user_id} className="flex items-center space-x-2 transition-colors rounded-lg px-3 py-2 bg-primary/10 border-2 border-primary/30 shadow-md">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                              {retailer.rank}
                            </div>
                            <span className="text-sm font-medium text-primary font-semibold">
                              {retailer.store_name}
                            </span>
                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                              {retailer.points} pts
                            </Badge>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowLeaderboard(!showLeaderboard)} className="w-full">
                    {showLeaderboard ? "Show Less" : "View More"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search and Export */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search locations..." className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground w-80" />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="default" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/offers')}>
                  Manage Your Offers
                </Button>
                <Button variant="outline" className="border-border hover:bg-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Your Retail Locations</h2>
              <Card className="bg-card border-border shadow-soft">
                <div className="p-6 pt-8">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Your Location</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Current Offer</TableHead>
                        <TableHead className="text-muted-foreground font-medium">
                          <div className="flex items-center gap-1">
                            Impressions
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary" onClick={() => handleSort('impressions')}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-muted-foreground font-medium">
                          <div className="flex items-center gap-1">
                            QR Scans
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary" onClick={() => handleSort('qrScans')}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-muted-foreground font-medium">
                          <div className="flex items-center gap-1">
                            Redemptions
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary" onClick={() => handleSort('redemptions')}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-muted-foreground font-medium">Dates</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Partners</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Open Offer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationAnalytics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No locations found. Add your first location to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        locationAnalytics.map((row, index) => (
                          <TableRow key={row.id} className="border-border hover:bg-secondary/50">
                            <TableCell className="text-foreground">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-semibold cursor-help">{row.name}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{row.address}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-foreground relative">
                              {row.currentOffer ? (
                                <>
                                  <button onClick={() => setExpandedOffer(expandedOffer === `your-${index}` ? null : `your-${index}`)} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer bg-muted">
                                    <span className="text-xs p-2 line-clamp-2">{row.currentOffer.call_to_action || row.currentOffer.callToAction || 'No offer'}</span>
                                  </button>
                                  {expandedOffer === `your-${index}` && (
                                    <div className="absolute z-50 top-full left-0 bg-background border border-border rounded-lg p-4 shadow-lg mt-2 min-w-64">
                                      <p className="font-medium mb-2">{row.currentOffer.call_to_action || row.currentOffer.callToAction}</p>
                                      <p className="text-sm text-muted-foreground">Redemptions: {row.currentOffer.redemption_count || 0}</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">No active offer</span>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground font-medium text-center">{row.impressions}</TableCell>
                            <TableCell className="text-foreground font-medium text-center">{row.qrScans}</TableCell>
                            <TableCell className="text-foreground font-medium text-center">{row.redemptions}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div>
                                <div>{row.startDate} - {row.endDate}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-primary font-semibold text-lg">{row.partners}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {row.isOpenOffer ? "On" : "Off"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Multiple Locations Banner */}
              <Card className="bg-muted border-border shadow-soft mt-6">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)] flex-shrink-0" />
                    <p className="text-foreground text-sm">
                      Running multiple stores? Add them now to use Media Street at each location.
                    </p>
                  </div>
                  <Button variant="outline" className="border-[hsl(38,92%,50%)] text-foreground hover:bg-[hsl(38,92%,50%)]/10 whitespace-nowrap" onClick={() => window.location.href = '/locations'}>
                    Add locations
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Help Icon - Bottom Left (positioned right of sidebar) */}
        <div className="fixed bottom-6 left-20 sm:left-24 z-50">
          <Button variant="default" size="icon" className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg" onClick={() => setSupportDialogOpen(true)}>
            <Headphones className="h-6 w-6 text-primary-foreground" />
          </Button>
        </div>

        {/* Support Dialog */}
        <SupportDialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen} />

        {/* Pause Partnership Confirmation Dialog */}
        <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Pause Partnership</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you would like to pause this partnership?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-center">
              <AlertDialogAction onClick={handlePausePartnership} className="bg-destructive hover:bg-destructive/90">
                Yes, I understand I will forfeit my partnership fee if I end the partnership early.
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pause Ads Confirmation Dialog */}
        <AlertDialog open={pauseAdsDialogOpen} onOpenChange={setPauseAdsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pause Ads for This Location</AlertDialogTitle>
              <AlertDialogDescription>
                This will pause your ad or offer from showing at partner locations until reactivated.
                Your location will remain active but won't participate in the partner network until you resume ads.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                toast({
                  title: "Ads Paused",
                  description: "Your ads have been paused for this location."
                });
                setPauseAdsDialogOpen(false);
                setSelectedLocation(null);
              }} className="bg-orange-500 hover:bg-orange-600">
                Pause Ads
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Location Confirmation Dialog */}
        <AlertDialog open={deleteLocationDialogOpen} onOpenChange={setDeleteLocationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this location? This will:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Permanently delete this location</li>
                  <li>Automatically end all active partnerships for this location</li>
                  <li>Remove all offers associated with this location</li>
                  <li>Stop showing your ads at partner locations</li>
                </ul>
                <p className="mt-3 font-medium text-destructive">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                toast({
                  title: "Location Deleted",
                  description: "Location and all partnerships have been removed."
                });
                setDeleteLocationDialogOpen(false);
                setSelectedLocation(null);
              }} className="bg-destructive hover:bg-destructive/90">
                Delete Location
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* <Toaster /> */}
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;