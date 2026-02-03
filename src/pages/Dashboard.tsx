import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWeeklyCountdown } from "@/hooks/useWeeklyCountdown";
import coffeePromo from "@/assets/coffee-promo.jpg";
import flowerPromo from "@/assets/flower-promo.jpg";
import cleaningPromo from "@/assets/cleaning-promo.jpg";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { DollarSign, Eye, Store, Search, Download, MoreVertical, Calendar, Bell, Settings, Home, Info, ArrowUpDown, Headphones, TrendingUp, TrendingDown, Zap, Plus, Ticket, MapPin, Users, ExternalLink, LogOut, Gift, Pause, Minus, X, Printer, ShoppingBag, Bot, Monitor, QrCode, ChevronDown, ChevronUp, CheckCircle2, CheckCircle, User, Lightbulb, Handshake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
// import { Toaster } from "@/components/ui/toaster";
import { SupportDialog } from "@/components/SupportDialog";
import TabletOfferPreview from "@/components/TabletOfferPreview";
import { WelcomeCreditsDialog } from "@/components/WelcomeCreditsDialog";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";
import { get, post, patch } from "@/services/apis";
import * as XLSX from 'xlsx';
import socketManager from "@/utils/socket";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [couponCode, setCouponCode] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [creativeIdeas, setCreativeIdeas] = useState("");
  const [showCreativeSection, setShowCreativeSection] = useState(false);
  const [openOfferDialogOpen, setOpenOfferDialogOpen] = useState(false);
  const [selectedLocationForOO, setSelectedLocationForOO] = useState<any>(null);
  const [togglingOpenOffer, setTogglingOpenOffer] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [isCheckingPaymentMethod, setIsCheckingPaymentMethod] = useState(true);
  const [redemptionSuccessDialogOpen, setRedemptionSuccessDialogOpen] = useState(false);
  const [showWelcomeCreditsDialog, setShowWelcomeCreditsDialog] = useState(false);
  const [enlargedOffer, setEnlargedOffer] = useState<{
    businessName: string;
    callToAction: string;
    offerImageUrl: string | null;
    redemptionStoreName: string;
  } | null>(null);

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
  
  // Notification state
  interface Notification {
    _id: string;
    id?: string;
    userId?: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    read?: boolean;
    createdAt: string;
    timestamp?: Date;
    relatedEntityId?: string;
    relatedEntityType?: string;
    metadata?: any;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  
  // Display method state - default to "carousel" (Partner Carousel)
  const [displayMethod, setDisplayMethod] = useState<string>(() => {
    // Initialize from localStorage, default to "carousel" if not set
    const saved = localStorage.getItem('displayMethod');
    return saved || 'carousel';
  });
  
  // 30-day metrics state
  const [monthlyMetrics, setMonthlyMetrics] = useState({
    inboundViewsMonth: 0,
    inboundViewsLastMonth: 0,
    outboundViewsMonth: 0,
    outboundViewsLastMonth: 0,
    inboundRedemptionsMonth: 0,
    inboundRedemptionsLastMonth: 0,
    outboundRedemptionsMonth: 0,
    outboundRedemptionsLastMonth: 0,
  });

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Initialize display method from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('displayMethod');
    if (!saved) {
      // Set default to "carousel" if not set
      localStorage.setItem('displayMethod', 'carousel');
      setDisplayMethod('carousel');
    } else {
      setDisplayMethod(saved);
    }
    
    // Set displayCarousel to true by default if not set
    if (localStorage.getItem('displayCarousel') === null) {
      localStorage.setItem('displayCarousel', 'true');
    }
    
    // Load creative ideas if saved
    const savedCreativeIdeas = localStorage.getItem('creativeIdeas');
    if (savedCreativeIdeas) {
      setCreativeIdeas(savedCreativeIdeas);
    }
  }, []);

  // Update localStorage when display method changes
  const handleDisplayMethodChange = (value: string) => {
    setDisplayMethod(value);
    localStorage.setItem('displayMethod', value);
    // Also update the old localStorage keys for backward compatibility
    if (value === 'carousel') {
      localStorage.setItem('displayCarousel', 'true');
      localStorage.setItem('displayQR', 'false');
    } else if (value === 'qr') {
      localStorage.setItem('displayCarousel', 'false');
      localStorage.setItem('displayQR', 'true');
    }
  };

  // Export location analytics data to Excel
  const handleExportToExcel = () => {
    if (!locationAnalytics || locationAnalytics.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There is no location data available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for Excel export
      const excelData = locationAnalytics.map((location: any) => {
        const totalImpressions = (location.inboundImpressions || 0) + (location.outboundImpressions || 0);
        const totalRedemptions = (location.inboundRedemptions || 0) + (location.outboundRedemptions || 0);
        
        // Format dates
        let offerDates = '-';
        if (location.currentOffer?.createdAt && location.currentOffer?.expiresAt) {
          const startDate = new Date(location.currentOffer.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const endDate = new Date(location.currentOffer.expiresAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          offerDates = `${startDate} - ${endDate}`;
        } else if (location.currentOffer?.createdAt) {
          const startDate = new Date(location.currentOffer.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          offerDates = `${startDate} - N/A`;
        }

        return {
          'Location Name': location.name || '-',
          'Address': location.address || '-',
          'Current Offer': location.currentOffer ? 'Yes' : 'No',
          'Offer Start Date': location.currentOffer?.createdAt 
            ? new Date(location.currentOffer.createdAt).toLocaleDateString('en-US')
            : '-',
          'Offer End Date': location.currentOffer?.expiresAt 
            ? new Date(location.currentOffer.expiresAt).toLocaleDateString('en-US')
            : '-',
          'Offer Dates': offerDates,
          'Inbound Impressions': location.inboundImpressions || 0,
          'Inbound Redemptions': location.inboundRedemptions || 0,
          'Outbound Impressions': location.outboundImpressions || 0,
          'Outbound Redemptions': location.outboundRedemptions || 0,
          'Total Impressions': totalImpressions,
          'Total Redemptions': totalRedemptions,
          'Active Partners': location.partners || 0,
          'Open Offer': location.isOpenOffer ? 'Yes' : 'No',
          'Location Created': location.createdAt 
            ? new Date(location.createdAt).toLocaleDateString('en-US')
            : '-'
        };
      });

      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Location Name
        { wch: 40 }, // Address
        { wch: 15 }, // Current Offer
        { wch: 18 }, // Offer Start Date
        { wch: 18 }, // Offer End Date
        { wch: 25 }, // Offer Dates
        { wch: 20 }, // Inbound Impressions
        { wch: 20 }, // Inbound Redemptions
        { wch: 20 }, // Outbound Impressions
        { wch: 20 }, // Outbound Redemptions
        { wch: 18 }, // Total Impressions
        { wch: 18 }, // Total Redemptions
        { wch: 18 }, // Active Partners
        { wch: 12 }, // Open Offer
        { wch: 18 }  // Location Created
      ];
      ws['!cols'] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Location Analytics');

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `Media_Street_Location_Analytics_${dateStr}.xlsx`;

      // Write the file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Location analytics data has been exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Listen for location toggle events to update hasOpenOffer state
  useEffect(() => {
    const handleLocationToggle = () => {
      // Re-check if any location has open offer enabled
      const checkOpenOfferLocations = async () => {
        try {
          const response = await get({ end_point: 'locations', token: true });
          if (response.success && response.data) {
            const hasOpenOfferLocation = response.data.some((loc: any) => 
              loc.open_offer_only === true || loc.openOfferOnly === true
            );
            setHasOpenOffer(hasOpenOfferLocation);
          }
        } catch (error) {
          console.error('Error checking open offer locations:', error);
        }
      };
      checkOpenOfferLocations();
    };

    window.addEventListener('locationToggle', handleLocationToggle);
    return () => {
      window.removeEventListener('locationToggle', handleLocationToggle);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile first (needed for calculations)
      let currentUserId: string | null = null;
      try {
        const userResponse = await get({ end_point: 'users/me', token: true });
        if (userResponse.success && userResponse.data) {
          setCurrentUser(userResponse.data);
          currentUserId = userResponse.data._id?.toString() || userResponse.data.id?.toString() || null;
          
          // Check if this is a new signup redirect (show welcome dialog only once after signup)
          const shouldShowWelcome = sessionStorage.getItem('showWelcomeCreditsDialog');
          if (shouldShowWelcome === 'true') {
            // Clear the flag immediately so it only shows once
            sessionStorage.removeItem('showWelcomeCreditsDialog');
            // Mark as seen in localStorage so it never shows again
            localStorage.setItem('hasSeenWelcomeCreditsDialog', 'true');
            setShowWelcomeCreditsDialog(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Fetch all data in parallel for better performance
      const [locationsResponse, offersResponse, partnersResponse, redemptionsResponse] = await Promise.all([
        get({ end_point: 'locations', token: true }).catch(() => ({ success: false, data: [] })),
        get({ end_point: 'offers', token: true }).catch(() => ({ success: false, data: [] })),
        get({ end_point: 'partners', token: true }).catch(() => ({ success: false, data: [] })),
        get({ end_point: 'redemptions', token: true }).catch(() => ({ success: false, data: [] }))
      ]);

      // Set locations state
      const locationsData = locationsResponse.success && locationsResponse.data ? locationsResponse.data : [];
      setLocations(locationsData);
      
      // Check if any location has open offer enabled
      const hasOpenOfferLocation = locationsData.some((loc: any) => 
        loc.open_offer_only === true || loc.openOfferOnly === true
      );
      setHasOpenOffer(hasOpenOfferLocation);

      // Set offers state
      const offersData = offersResponse.success && offersResponse.data ? offersResponse.data : [];
      setOffers(offersData);
      const activeOffers = offersData.filter((o: any) => o.is_active);

      // Set partnerships state
      const partnershipsData = partnersResponse.success && partnersResponse.data ? partnersResponse.data : [];
      setPartnerships(partnershipsData);

      // Set redemptions data
      const redemptionsData = redemptionsResponse.success && redemptionsResponse.data ? redemptionsResponse.data : [];

      // Calculate stats from redemptions
      const totalRedemptions = redemptionsData.length;
      const inboundViews = redemptionsData.filter((r: any) => r.offer?.userId && r.location?.userId !== r.offer?.userId).length;
      const outboundViews = redemptionsData.filter((r: any) => r.location?.userId && r.offer?.userId !== r.location?.userId).length;
      const qrScans = redemptionsData.length * 2; // Rough estimate
      const impressions = qrScans * 3; // Rough estimate
      const conversionRate = qrScans > 0 ? (totalRedemptions / qrScans) * 100 : 0;

      setStats(prev => ({
        ...prev,
        inboundViews,
        outboundViews,
        totalRedemptions,
        activeOffers: activeOffers.length,
        qrScans,
        impressions,
        conversionRate: Math.round(conversionRate * 10) / 10
      }));

      // Calculate 30-day metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Fetch impressions data for all user locations
      let impressionsData: any[] = [];
      try {
        // Get impressions for all locations
        const impressionsPromises = locationsData.map(async (loc: any) => {
          const locId = loc._id?.toString() || loc.id?.toString();
          if (!locId) return { inbound: [], outbound: [] };
          
          try {
            const [inboundResponse, outboundResponse] = await Promise.all([
              get({ end_point: `impressions/inbound/${locId}`, token: true }).catch(() => ({ success: false, data: [] })),
              get({ end_point: `impressions/outbound/${locId}`, token: true }).catch(() => ({ success: false, data: [] }))
            ]);
            
            return {
              locationId: locId,
              inbound: inboundResponse.success ? inboundResponse.data : [],
              outbound: outboundResponse.success ? outboundResponse.data : []
            };
          } catch (error) {
            console.error(`Error fetching impressions for location ${locId}:`, error);
            return { locationId: locId, inbound: [], outbound: [] };
          }
        });
        
        impressionsData = await Promise.all(impressionsPromises);
      } catch (error) {
        console.error('Error fetching impressions:', error);
      }

      // Filter impressions for last 30 days and previous 30 days
      const allInboundImpressions = impressionsData.flatMap((imp: any) => imp.inbound || []);
      const allOutboundImpressions = impressionsData.flatMap((imp: any) => imp.outbound || []);

      const inboundImpressionsLast30Days = allInboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= thirtyDaysAgo;
      });

      const inboundImpressionsPrevious30Days = allInboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= sixtyDaysAgo && viewedAt < thirtyDaysAgo;
      });

      const outboundImpressionsLast30Days = allOutboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= thirtyDaysAgo;
      });

      const outboundImpressionsPrevious30Days = allOutboundImpressions.filter((imp: any) => {
        const viewedAt = new Date(imp.viewedAt || imp.createdAt || 0);
        return viewedAt >= sixtyDaysAgo && viewedAt < thirtyDaysAgo;
      });

      // Filter redemptions for last 30 days
      const redemptionsLast30Days = redemptionsData.filter((r: any) => {
        const redemptionDate = new Date(r.createdAt || r.created_at || r.redeemedAt || r.redeemed_at || 0);
        return redemptionDate >= thirtyDaysAgo;
      });

      // Filter redemptions for previous 30 days (30-60 days ago)
      const redemptionsPrevious30Days = redemptionsData.filter((r: any) => {
        const redemptionDate = new Date(r.createdAt || r.created_at || r.redeemedAt || r.redeemed_at || 0);
        return redemptionDate >= sixtyDaysAgo && redemptionDate < thirtyDaysAgo;
      });

      // Use real impressions data
      const inboundViewsMonth = inboundImpressionsLast30Days.length;
      const inboundViewsLastMonth = inboundImpressionsPrevious30Days.length;
      const outboundViewsMonth = outboundImpressionsLast30Days.length;
      const outboundViewsLastMonth = outboundImpressionsPrevious30Days.length;

      // Helper to extract user ID from populated/nested objects
      const getOfferUserId = (r: any): string | null => {
        const offer = r.offerId || r.offer;
        if (!offer) return null;
        const uid = offer.userId;
        if (!uid) return null;
        return uid._id?.toString?.() || uid.toString?.() || String(uid);
      };
      const getLocationUserId = (loc: any): string | null => {
        if (!loc) return null;
        const uid = loc.userId;
        if (!uid) return null;
        return uid._id?.toString?.() || uid.toString?.() || String(uid);
      };
      const getReferringLocationUserId = (r: any): string | null => {
        const loc = r.referringLocationId;
        return getLocationUserId(loc);
      };

      // Calculate redemptions (inbound and outbound)
      // Inbound: User's offers redeemed (your offers - redeemed at your store when customer presents coupon)
      // Outbound: Partner offers redeemed after customer saw them at your store (referring location = your store)
      const inboundRedemptionsMonth = currentUserId ? redemptionsLast30Days.filter((r: any) => {
        const offerUserId = getOfferUserId(r);
        return offerUserId && offerUserId === currentUserId;
      }).length : 0;

      const inboundRedemptionsLastMonth = currentUserId ? redemptionsPrevious30Days.filter((r: any) => {
        const offerUserId = getOfferUserId(r);
        return offerUserId && offerUserId === currentUserId;
      }).length : 0;

      // Outbound: Partner's offer redeemed where your store referred the customer (referringLocationId in user's locations)
      const outboundRedemptionsMonth = currentUserId ? redemptionsLast30Days.filter((r: any) => {
        const offerUserId = getOfferUserId(r);
        const referringUserId = getReferringLocationUserId(r);
        return offerUserId && referringUserId && referringUserId === currentUserId && offerUserId !== currentUserId;
      }).length : 0;

      const outboundRedemptionsLastMonth = currentUserId ? redemptionsPrevious30Days.filter((r: any) => {
        const offerUserId = getOfferUserId(r);
        const referringUserId = getReferringLocationUserId(r);
        return offerUserId && referringUserId && referringUserId === currentUserId && offerUserId !== currentUserId;
      }).length : 0;

      setMonthlyMetrics({
        inboundViewsMonth,
        inboundViewsLastMonth,
        outboundViewsMonth,
        outboundViewsLastMonth,
        inboundRedemptionsMonth,
        inboundRedemptionsLastMonth,
        outboundRedemptionsMonth,
        outboundRedemptionsLastMonth,
      });

      // Calculate location analytics using fetched data directly (not state)
      try {
        console.log('📍 Calculating location analytics...');
        console.log('📍 Locations count:', locationsData.length);
        console.log('📍 Offers count:', offersData.length);
        console.log('📍 Partnerships count:', partnershipsData.length);
        console.log('📍 Redemptions count:', redemptionsData.length);

        // Map locations with their analytics
        const locationAnalyticsData = locationsData.map((loc: any) => {
          const locationId = loc._id?.toString() || loc.id?.toString();
          
          // Filter offers that belong to THIS specific location
          // IMPORTANT: Each offer should only have ONE location in locationIds array (after our fix)
          const locationOffers = offersData.filter((o: any) => {
            const offerLocationIds = o.locationIds || o.location_ids || [];
            // Convert to array if it's not already
            const locationIdsArray = Array.isArray(offerLocationIds) ? offerLocationIds : [offerLocationIds];
            
            // Check if this location ID matches any of the offer's location IDs
            const matches = locationIdsArray.some((lid: any) => {
              // Handle both populated objects and plain IDs
              const lidStr = lid?._id?.toString() || lid?.toString() || lid;
              const locationIdStr = locationId.toString();
              return lidStr === locationIdStr;
            });
            
            return matches;
          });
          
          // Debug: Log offers for this location with detailed info
          console.log(`\n📍 ===== Location "${loc.name}" (${locationId}) =====`);
          console.log(`   Total offers in database: ${offersData.length}`);
          console.log(`   Offers filtered for this location: ${locationOffers.length}`);
          
          if (locationOffers.length > 0) {
            locationOffers.forEach((o: any, idx: number) => {
              const offerId = o._id || o.id;
              const offerLocationIds = o.locationIds || o.location_ids || [];
              const offerImage = o.offerImage || o.offer_image || null;
              const imagePreview = offerImage ? offerImage.substring(0, 50) + '...' : 'No image';
              const isActive = o.isActive !== false && o.is_active !== false;
              
              console.log(`   Offer ${idx + 1}:`);
              console.log(`     - ID: ${offerId}`);
              console.log(`     - Location IDs: ${JSON.stringify(offerLocationIds)}`);
              console.log(`     - Is Active: ${isActive}`);
              console.log(`     - Has Image: ${!!offerImage}`);
              if (offerImage) {
                console.log(`     - Image Preview: ${imagePreview}`);
                console.log(`     - Image Length: ${offerImage.length}`);
              }
            });
          } else {
            console.log(`   ⚠️ No offers found for this location`);
          }

          // Use partner_count from the location data (already calculated on backend)
          // The backend getLocations endpoint already calculates partner_count for each location
          const partnerCount = loc.partner_count || loc.partners || 0;
          
          console.log(`📍 Location ${loc.name} (${locationId}): partner_count=${partnerCount}`);

          // Calculate inbound metrics (offers from this location shown at partner locations)
          // Inbound Impressions = QR scans of this location's offers at partner locations
          // Inbound Redemptions = Redemptions of this location's offers at partner locations
          const inboundRedemptions = redemptionsData.filter((r: any) => {
            const redemptionLocationId = r.redeemedAtLocationId?._id?.toString() || r.redeemedAtLocationId?.toString() || r.redeemedAtLocationId;
            const offerLocationIds = r.offer?.locationIds || r.offer?.location_ids || [];
            const offerBelongsToLocation = offerLocationIds.some((lid: any) => {
              const lidStr = lid?._id?.toString() || lid?.toString() || lid;
              return lidStr === locationId;
            });
            // Redemption happened at a different location (partner location)
            return offerBelongsToLocation && redemptionLocationId && redemptionLocationId !== locationId;
          });
          
          const inboundRedemptionsCount = inboundRedemptions.length;
          // Estimate impressions (typically 3-5x redemptions)
          const inboundImpressions = inboundRedemptionsCount * 4;

          // Calculate outbound metrics (partner offers shown at this location)
          // Outbound Impressions = QR scans of partner offers at this location
          // Outbound Redemptions = Redemptions of partner offers at this location
          const outboundRedemptions = redemptionsData.filter((r: any) => {
            const redemptionLocationId = r.redeemedAtLocationId?._id?.toString() || r.redeemedAtLocationId?.toString() || r.redeemedAtLocationId;
            const offerLocationIds = r.offer?.locationIds || r.offer?.location_ids || [];
            const offerBelongsToLocation = offerLocationIds.some((lid: any) => {
              const lidStr = lid?._id?.toString() || lid?.toString() || lid;
              return lidStr === locationId;
            });
            // Redemption happened at this location but offer is from a different location (partner offer)
            return redemptionLocationId === locationId && !offerBelongsToLocation;
          });
          
          const outboundRedemptionsCount = outboundRedemptions.length;
          // Estimate impressions (typically 3-5x redemptions)
          const outboundImpressions = outboundRedemptionsCount * 4;

          // Get current offer for this location
          // IMPORTANT: Filter to only active offers for THIS specific location
          // Sort by creation date (newest first) to get the most recent active offer
          const activeOffersForLocation = locationOffers.filter((o: any) => {
            const isActive = o.isActive !== false && o.is_active !== false;
            // Also check if offer hasn't expired
            const now = new Date();
            const expiresAt = o.expiresAt || o.expires_at;
            const notExpired = !expiresAt || new Date(expiresAt) > now;
            return isActive && notExpired;
          });
          
          // Sort by creation date (newest first) and get the most recent one
          const sortedActiveOffers = activeOffersForLocation.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });
          
          // Only use active offers - don't fallback to expired offers
          const currentOffer = sortedActiveOffers[0] || null;
          
          // Extract offer image from various possible field names
          let offerImage = null;
          if (currentOffer) {
            offerImage = currentOffer.offerImage || 
                        currentOffer.offer_image || 
                        currentOffer.image ||
                        currentOffer.offerImageUrl ||
                        currentOffer.offer_image_url ||
                        null;
            
            // Debug logging with location and offer IDs for verification
            if (offerImage) {
              const offerId = currentOffer._id || currentOffer.id;
              const imagePreview = offerImage.substring(0, 50);
              console.log(`✅ Location "${loc.name}" (${locationId}) -> Offer ${offerId}:`, imagePreview + '...');
              console.log(`   - Total offers for this location: ${locationOffers.length}`);
              console.log(`   - Active offers: ${activeOffersForLocation.length}`);
              console.log(`   - Selected offer ID: ${offerId}`);
            } else {
              console.log(`⚠️ No offer image found for location ${loc.name}. Available fields:`, Object.keys(currentOffer));
            }
          } else {
            console.log(`⚠️ No offer found for location ${loc.name} (${locationId})`);
          }
          
          // Only set currentOffer if we have both an offer AND an image
          // If there's no image, treat it as no offer
          const validOffer = currentOffer && offerImage ? {
            image: offerImage,
            createdAt: currentOffer.createdAt || currentOffer.created_at,
            expiresAt: currentOffer.expiresAt || currentOffer.expires_at
          } : null;
          
          return {
            id: locationId,
            name: loc.name,
            address: loc.address,
            createdAt: loc.createdAt || loc.created_at,
            inboundImpressions,
            inboundRedemptions: inboundRedemptionsCount,
            outboundImpressions,
            outboundRedemptions: outboundRedemptionsCount,
            partners: partnerCount,
            isOpenOffer: loc.openOfferOnly || loc.open_offer_only || false,
            currentOffer: validOffer
          };
        });

        // Show all locations, even if they don't have offers
        console.log('📍 Total locations:', locationAnalyticsData.length);
        console.log('📍 Location analytics data:', locationAnalyticsData);
        console.log('📍 Setting locationAnalytics with', locationAnalyticsData.length, 'locations (all locations)');
        setLocationAnalytics(locationAnalyticsData);
      } catch (error) {
        console.error('Error calculating location analytics:', error);
        // Even if there's an error, set empty array to show "No locations" message
        setLocationAnalytics([]);
      }

      // Fetch leaderboard data
      try {
        const leaderboardResponse = await get({ end_point: 'leaderboard/referral', token: true });
        const data = leaderboardResponse?.success && Array.isArray(leaderboardResponse?.data)
          ? leaderboardResponse.data
          : [];
        // Use real data if any; otherwise show placeholder so the section is never empty
        setLeaderboardData(
          data.length > 0
            ? data
            : processLeaderboardData(staticLeaderboardData)
        );
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData(processLeaderboardData(staticLeaderboardData));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await get({ end_point: 'notifications', token: true });
      if (response.success && response.data) {
        const currentUserId = currentUser?._id || currentUser?.id;
        const formattedNotifications: Notification[] = response.data
          .map((notif: any) => ({
            _id: notif._id,
            id: notif._id,
            userId: notif.userId?.toString() || notif.userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            isRead: notif.isRead,
            read: notif.isRead,
            createdAt: notif.createdAt,
            timestamp: new Date(notif.createdAt),
            relatedEntityId: notif.relatedEntityId,
            relatedEntityType: notif.relatedEntityType,
            metadata: notif.metadata
          }))
          .filter((notif: Notification) => {
            // Only show notifications that belong to the current user
            if (!currentUserId) return false;
            const notifUserId = notif.userId?.toString();
            const userStr = currentUserId.toString();
            return notifUserId === userStr;
          });
        setNotifications(formattedNotifications);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await get({ end_point: 'notifications/unread-count', token: true });
      if (response.success) {
        setUnreadCount(response.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Initialize WebSocket connection for notifications
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token');
    if (token && !socketManager.isConnected()) {
      socketManager.connect(token);
    }

    const socket = socketManager.getSocket();
    if (socket) {
      // Listen for new notifications in real-time
      const handleNewNotification = (notification: Notification) => {
        const currentUserId = currentUser?._id || currentUser?.id;
        if (!currentUserId) return;
        
        const notifUserId = notification.userId?.toString() || (notification as any).userId?.toString();
        const userStr = currentUserId.toString();
        if (notifUserId !== userStr) return;
        
        setNotifications(prev => {
          const exists = prev.some(n => 
            n._id === notification._id || 
            n.id === notification.id ||
            (notification._id && n._id === notification._id)
          );
          if (exists) return prev;
          
          const formattedNotification: Notification = {
            _id: notification._id || notification.id || '',
            id: notification._id || notification.id || '',
            userId: notifUserId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead || false,
            read: notification.isRead || false,
            createdAt: notification.createdAt || new Date().toISOString(),
            timestamp: notification.timestamp || new Date(),
            relatedEntityId: notification.relatedEntityId,
            relatedEntityType: notification.relatedEntityType,
            metadata: notification.metadata
          };
          return [formattedNotification, ...prev];
        });
        
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      };

      const handleNotificationCount = (data: { count: number }) => {
        setUnreadCount(data.count || 0);
      };

      const handleNotificationsList = (data: { notifications: Notification[], unreadCount: number }) => {
        if (data.notifications) {
          const currentUserId = currentUser?._id || currentUser?.id;
          const formattedNotifications: Notification[] = data.notifications
            .map((notif: any) => ({
              _id: notif._id || notif.id || '',
              id: notif._id || notif.id || '',
              userId: notif.userId?.toString() || notif.userId,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              isRead: notif.isRead || false,
              read: notif.isRead || false,
              createdAt: notif.createdAt || new Date().toISOString(),
              timestamp: notif.timestamp || new Date(notif.createdAt),
              relatedEntityId: notif.relatedEntityId,
              relatedEntityType: notif.relatedEntityType,
              metadata: notif.metadata
            }))
            .filter((notif: Notification) => {
              if (!currentUserId) return false;
              const notifUserId = notif.userId?.toString();
              const userStr = currentUserId.toString();
              return notifUserId === userStr;
            });
          setNotifications(formattedNotifications);
        }
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      };

      socketManager.onNotification(handleNewNotification);
      socketManager.onNotificationCount(handleNotificationCount);
      socket.on('notifications:list', handleNotificationsList);

      if (socketManager.isConnected()) {
        socketManager.requestNotifications();
        socketManager.requestUnreadCount();
      } else {
        fetchNotifications();
        fetchUnreadCount();
      }

      return () => {
        socketManager.offNotification(handleNewNotification);
        socketManager.offNotificationCount(handleNotificationCount);
        socket.off('notifications:list', handleNotificationsList);
      };
    } else {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    if (socketManager.isConnected()) {
      socketManager.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      try {
        await patch({
          end_point: `notifications/${notificationId}/read`,
          token: true
        });
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    if (socketManager.isConnected()) {
      socketManager.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } else {
      try {
        await patch({
          end_point: 'notifications/read-all',
          token: true
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Don't mark as read on click - notifications persist until explicitly marked as read
    // Navigate based on notification type
    if (notification.relatedEntityType === 'partner' && notification.relatedEntityId) {
      navigate('/requests');
    } else if (notification.relatedEntityType === 'offer' && notification.relatedEntityId) {
      navigate('/offers');
    } else if (notification.relatedEntityType === 'subscription' && notification.relatedEntityId) {
      navigate('/openoffer');
    } else {
      navigate('/dashboard');
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

  const processLeaderboardData = (data: any[] = []) => {
    return [...data]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  };

  const handlePausePartnership = () => {
    toast({
      title: "Partnership Paused",
      description: "Your partnership has been paused successfully."
    });
    setPauseDialogOpen(false);
    setSelectedCampaign(null);
  };

  // Check payment method on mount
  useEffect(() => {
    const checkPaymentMethod = async () => {
      setIsCheckingPaymentMethod(true);
      try {
        const response = await get({ end_point: 'billing/cards', token: true });
        if (response.success && response.data) {
          const hasCard = Array.isArray(response.data) && response.data.length > 0;
          setHasPaymentMethod(hasCard);
        } else {
          setHasPaymentMethod(false);
        }
      } catch (error) {
        console.error('Error checking payment method:', error);
        setHasPaymentMethod(false);
      } finally {
        setIsCheckingPaymentMethod(false);
      }
    };
    checkPaymentMethod();
  }, []);

  // Fetch user credit balance
  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        const response = await get({ end_point: 'users/me', token: true });
        if (response.success && response.data) {
          setCreditBalance(response.data.credit || 0);
        }
      } catch (error) {
        console.error('Error fetching credit balance:', error);
      }
    };
    fetchCreditBalance();
  }, []);

  // Update Open Offer status
  const updateOpenOfferStatus = async (row: any, status: boolean) => {
    setTogglingOpenOffer(true);
    try {
      const locationId = row.id || row.locationId || row._id?.toString();
      if (!locationId) {
        toast({
          title: "Error",
          description: "Location ID not found",
          variant: "destructive"
        });
        return;
      }

      if (status) {
        // Subscribe to Open Offer
        const response = await post({
          end_point: 'partners/open-offer-subscription',
          body: { locationId },
          token: true
        });

        if (response.success) {
          toast({
            title: "Open Offer Activated",
            description: `Open Offer is now active for ${row.name || row.store || 'this location'}. You'll be billed $25/month after any available credits are deducted.`
          });
          setOpenOfferDialogOpen(false);
          // Refresh dashboard data
          fetchDashboardData();
        } else {
          throw new Error(response.message || "Failed to subscribe to Open Offer");
        }
      } else {
        // Cancel subscription
        const response = await post({
          end_point: 'partners/cancel-open-offer',
          body: { locationId },
          token: true
        });

        if (response.success) {
          toast({
            title: "Open Offer Cancelled",
            description: "Your Open Offer subscription has been cancelled."
          });
          // Refresh dashboard data
          fetchDashboardData();
        } else {
          throw new Error(response.message || "Failed to cancel Open Offer");
        }
      }
    } catch (error: any) {
      console.error('Error updating Open Offer status:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error.message || "Failed to update Open Offer status",
        variant: "destructive"
      });
    } finally {
      setTogglingOpenOffer(false);
    }
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
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key,
        direction: 'asc'
      };
    });

    // Sort locationAnalytics
    setLocationAnalytics((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const aValue = a[key as keyof typeof a] || 0;
        const bValue = b[key as keyof typeof b] || 0;
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? -1 : 1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction;
        }
        return String(aValue).localeCompare(String(bValue)) * direction;
      });
      return sorted;
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


  const handleLogRedemption = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Coupon Code Required",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    setIsRedeeming(true);
    try {
      // Log redemption - location will be automatically determined from the redemption record
      const response = await post({
        end_point: 'redemptions/redeem-coupon',
        body: {
          couponCode: couponCode.trim()
          // locationId is optional - backend will use location from redemption record
        },
        token: true
      });

      if (response.success) {
        toast({
          title: "Redemption Logged Successfully!",
          description: response.message || `Coupon code "${couponCode}" has been logged at ${response.data?.location?.name || 'your location'}!`,
        });

        setCouponCode("");
        // Refresh dashboard data to update redemption counts
        await fetchDashboardData();
      } else {
        throw new Error(response.message || 'Failed to log redemption');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to log redemption. Please check the coupon code and try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
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
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/location-qr')}>
                <QrCode className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>QR Code Stickers</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/requests')}>
                <Handshake className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Partners</p>
            </TooltipContent>
          </Tooltip>


          {hasOpenOffer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => navigate('/openoffer')}
                >
                  <Bot className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Open Offer</p>
              </TooltipContent>
            </Tooltip>
          )}

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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => navigate('/insights')}>
                <TrendingUp className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Insights</p>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Gift className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Your Retailer Referral Code</p>
                    <div className="bg-muted p-2 rounded font-mono text-sm">{currentUser?.referralCode || "Loading..."}</div>
                    <p className="text-xs text-muted-foreground">Share this code with retailers. You'll get 3 points when they sign up using your code!</p>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-96 p-0">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 hover:bg-secondary/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-secondary/30' : ''
                              }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.timestamp
                                ? notification.timestamp.toLocaleString()
                                : new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-green rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center relative z-50 overflow-hidden">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser?.fullName || "User"}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white text-xs font-semibold';
                            fallback.textContent = currentUser?.fullName?.charAt(0).toUpperCase() || 'U';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : currentUser?.fullName ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white text-xs font-semibold">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-80 p-0 bg-card border-border shadow-lg z-[100]">
                  <div className="p-4 space-y-4">
                    {/* Account Section */}
                    <div className="space-y-3">
                      <div className="text-muted-foreground text-sm font-medium">Account</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-primary to-accent-green flex items-center justify-center flex-shrink-0">
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser?.fullName || "User"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white font-semibold text-lg';
                                  fallback.textContent = currentUser?.fullName?.charAt(0).toUpperCase() || 'U';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : currentUser?.fullName ? (
                            <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white font-semibold text-lg">
                              {currentUser.fullName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <User className="h-6 w-6 text-white" />
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
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Main Dashboard */}
          <main className="p-6 space-y-6">
            {/* Monthly Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-9 w-12" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Inbound Views Last 30 Days</p>
                          <p className="text-3xl font-bold text-primary">{monthlyMetrics.inboundViewsMonth}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {calculatePercentageChange(monthlyMetrics.inboundViewsMonth, monthlyMetrics.inboundViewsLastMonth) >= 0 ? <TrendingUp className="h-3 w-3 text-accent-green" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                            <span className={calculatePercentageChange(monthlyMetrics.inboundViewsMonth, monthlyMetrics.inboundViewsLastMonth) >= 0 ? "text-accent-green" : "text-destructive"}>
                              {Math.abs(calculatePercentageChange(monthlyMetrics.inboundViewsMonth, monthlyMetrics.inboundViewsLastMonth))}%
                            </span>
                            <span className="text-muted-foreground">vs previous 30 days</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Eye className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Inbound Views</p>
                  <p className="text-sm">The number of times users have viewed your offers at other retailers in the last 30 days. Higher inbound views mean more customers are discovering your promotions and showing interest in your offer. This counts any time your offers load on an active partner carousel or are shown in mobile coupon format from a referring store's QR code.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Outbound Views Last 30 Days</p>
                          <p className="text-3xl font-bold text-accent-green">{monthlyMetrics.outboundViewsMonth}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {calculatePercentageChange(monthlyMetrics.outboundViewsMonth, monthlyMetrics.outboundViewsLastMonth) >= 0 ? <TrendingUp className="h-3 w-3 text-accent-green" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                            <span className={calculatePercentageChange(monthlyMetrics.outboundViewsMonth, monthlyMetrics.outboundViewsLastMonth) >= 0 ? "text-accent-green" : "text-destructive"}>
                              {Math.abs(calculatePercentageChange(monthlyMetrics.outboundViewsMonth, monthlyMetrics.outboundViewsLastMonth))}%
                            </span>
                            <span className="text-muted-foreground">vs previous 30 days</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 bg-accent-green/10 rounded-full flex items-center justify-center">
                          <Eye className="h-6 w-6 text-accent-green" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Outbound Views</p>
                  <p className="text-sm">The number of times consumers at your stores have viewed partner offers in the last 30 days. Higher outbound views show you're driving interest for partner offers. Driving outbound views means your own offer will be shown more at other retailers; in addition to earning free credits and rewards.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Inbound Redemptions Last 30 Days</p>
                          <p className="text-3xl font-bold text-primary">{monthlyMetrics.inboundRedemptionsMonth}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {calculatePercentageChange(monthlyMetrics.inboundRedemptionsMonth, monthlyMetrics.inboundRedemptionsLastMonth) >= 0 ? <TrendingUp className="h-3 w-3 text-accent-green" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                            <span className={calculatePercentageChange(monthlyMetrics.inboundRedemptionsMonth, monthlyMetrics.inboundRedemptionsLastMonth) >= 0 ? "text-accent-green" : "text-destructive"}>
                              {Math.abs(calculatePercentageChange(monthlyMetrics.inboundRedemptionsMonth, monthlyMetrics.inboundRedemptionsLastMonth))}%
                            </span>
                            <span className="text-muted-foreground">vs previous 30 days</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Inbound Redemptions</p>
                  <p className="text-sm">The number of times customers have redeemed your offers in the last 30 days. This includes redemptions logged at your store when customers present offers they discovered through partner stores or Open Offer.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Outbound Redemptions Last 30 Days</p>
                          <p className="text-3xl font-bold text-accent-green">{monthlyMetrics.outboundRedemptionsMonth}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {calculatePercentageChange(monthlyMetrics.outboundRedemptionsMonth, monthlyMetrics.outboundRedemptionsLastMonth) >= 0 ? <TrendingUp className="h-3 w-3 text-accent-green" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                            <span className={calculatePercentageChange(monthlyMetrics.outboundRedemptionsMonth, monthlyMetrics.outboundRedemptionsLastMonth) >= 0 ? "text-accent-green" : "text-destructive"}>
                              {Math.abs(calculatePercentageChange(monthlyMetrics.outboundRedemptionsMonth, monthlyMetrics.outboundRedemptionsLastMonth))}%
                            </span>
                            <span className="text-muted-foreground">vs previous 30 days</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 bg-accent-green/10 rounded-full flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-accent-green" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Outbound Redemptions</p>
                  <p className="text-sm">The number of times partner offers have been redeemed after being referred from your store in the last 30 days. This includes redemptions through individual partnerships or Open Offer when you're the referring store.</p>
                </TooltipContent>
              </Tooltip>
                </>
              )}
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
                  <span className="text-sm font-medium text-foreground">Log Offer Redemption</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Enter the coupon code from the customer's coupon to log the redemption.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code..."
                    value={couponCode}
                    onChange={e => {
                      const value = e.target.value.trim();
                      setCouponCode(value);
                    }}
                    className="w-48 font-mono text-lg"
                  />
                  <Button
                    size="sm"
                    onClick={handleLogRedemption}
                    disabled={!couponCode.trim() || isLoading || isRedeeming}
                  >
                    {isRedeeming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Logging...
                      </>
                    ) : "Log"}
                  </Button>
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
                      <p className="text-xs text-muted-foreground">
                        See what's working in{' '}
                        <Link to="/offers" className="text-primary hover:underline font-medium">
                          Your Offers
                        </Link>
                        {' '}and add multiple store locations
                      </p>
                      <Button variant="link" size="sm" onClick={() => navigate('/locations')} className="text-xs p-0 h-auto">
                        Add Locations →
                      </Button>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-foreground">Please select your in-store display method:</p>
                    </div>
                    <RadioGroup value={displayMethod} onValueChange={handleDisplayMethodChange} className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background flex-1">
                        <RadioGroupItem value="carousel" id="dashboard-carousel" className="h-4 w-4" />
                        <label htmlFor="dashboard-carousel" className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                          <Monitor className="h-4 w-4" />
                          <span>Tablet <span className="text-muted-foreground font-normal">(Most Effective)</span></span>
                        </label>
                        <Button variant="link" size="sm" onClick={() => navigate('/display')} className="text-xs">
                          Display
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background flex-1">
                        <RadioGroupItem value="qr" id="dashboard-qr" className="h-4 w-4" />
                        <label htmlFor="dashboard-qr" className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                          <Printer className="h-4 w-4" />
                          <span>QR Code <span className="text-muted-foreground font-normal">(Easiest to implement)</span></span>
                        </label>
                        <Button variant="link" size="sm" onClick={() => navigate('/locations')} className="text-xs">
                          Print
                        </Button>
                      </div>
                    </RadioGroup>

                    {/* Get Creative Section */}
                    <div className="border border-border rounded-lg mt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreativeSection(!showCreativeSection)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-foreground">Get Creative (Optional)</span>
                        </div>
                        {showCreativeSection ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {showCreativeSection && (
                        <div className="p-4 pt-0 space-y-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            List other ways you'd be open to promoting your partners by sharing your MS QR code on other marketing assets:
                          </p>
                          <Textarea
                            placeholder="e.g. include qr code on receipts, mention partner offer in newsletter, one social media post a week"
                            value={creativeIdeas}
                            onChange={(e) => {
                              setCreativeIdeas(e.target.value);
                              if (e.target.value.trim()) {
                                localStorage.setItem('creativeIdeas', e.target.value.trim());
                              } else {
                                localStorage.removeItem('creativeIdeas');
                              }
                            }}
                            className="min-h-[80px] text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Period Filters */}
            {/* <div className="flex items-center space-x-2">
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
            </div> */}

            
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            </div> */}

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
                      <TooltipContent className="max-w-md p-4 bg-card border-2 border-border shadow-lg rounded-lg">
                        <div className="space-y-2">
                          <p className="text-sm text-foreground leading-relaxed">
                            Earn 1 point for every mobile coupon view originating from your location, 1 point for logging an offer redemption at your store, 3 points for getting new retailers to join Media Street with your invite code and 5 points for a consumer redemption at a retailer you referred to! Weekly winner takes home $1K!
                          </p>
                        </div>
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
                    {/* Leaderboard skeleton when loading */}
                    {loading ? (
                      <>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-secondary/50 w-full max-w-[200px]">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 flex-1 max-w-[80px]" />
                            <Skeleton className="h-5 w-12 rounded-md" />
                          </div>
                        ))}
                      </>
                    ) : leaderboardData.length > 0 ? (
                      /* Top 10 or first 3 retailers */
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
                      <div className="text-center py-4 text-muted-foreground text-sm w-full">
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
                <Button 
                  variant="outline" 
                  className="border-border hover:bg-secondary"
                  onClick={handleExportToExcel}
                  disabled={!locationAnalytics || locationAnalytics.length === 0}
                >
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
                        <TableHead className="text-muted-foreground font-medium">Impressions</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Redemptions</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Dates</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Partners</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Open Offer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        /* Table skeleton when loading */
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} className="border-border">
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-20 w-20 rounded-md" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-10 rounded-full" /></TableCell>
                          </TableRow>
                        ))
                      ) : locationAnalytics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No locations found. Add a location to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        locationAnalytics.map((row, index) => {
                          // Get offer image from row data (already calculated)
                          // IMPORTANT: Each location should have its own unique offer image
                          const offerImage = row.currentOffer?.image || null;
                          
                          // Debug: Log which image is being used for which location
                          if (offerImage) {
                            const imagePreview = offerImage.substring(0, 50);
                            console.log(`🖼️ Dashboard Table - Location "${row.name}" (${row.id}):`, imagePreview + '...');
                          }
                          
                          // Calculate total impressions (inbound + outbound)
                          const totalImpressions = (row.inboundImpressions || 0) + (row.outboundImpressions || 0);
                          
                          // Calculate total redemptions (inbound + outbound)
                          const totalRedemptions = (row.inboundRedemptions || 0) + (row.outboundRedemptions || 0);
                          
                          // Format dates as "start date - end date" (only from offer, not location)
                          // Only show dates if we have a valid offer with an image
                          let offerDates = '-';
                          if (row.currentOffer && offerImage && row.currentOffer.createdAt && row.currentOffer.expiresAt) {
                            // Both start and end dates available
                            const startDate = new Date(row.currentOffer.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            });
                            const endDate = new Date(row.currentOffer.expiresAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            });
                            offerDates = `${startDate} - ${endDate}`;
                          } else if (row.currentOffer && offerImage && row.currentOffer.createdAt) {
                            // Only start date available
                            const startDate = new Date(row.currentOffer.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            });
                            offerDates = `${startDate} - N/A`;
                          }
                          // If no offer exists or no image, show "No offer" (don't use location createdAt)
                          
                          return (
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
                              <TableCell>
                                {offerImage ? (
                                  <img 
                                    src={offerImage} 
                                    alt="Current Offer" 
                                    className="w-20 h-20 object-cover rounded-md border border-border"
                                  />
                                ) : (
                                  <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-md border border-border">
                                    <span className="text-muted-foreground text-xs">No offer</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-foreground font-medium text-center">{totalImpressions}</TableCell>
                              <TableCell className="text-foreground font-medium text-center">{totalRedemptions}</TableCell>
                              <TableCell className="text-foreground text-sm whitespace-nowrap">{offerDates}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-primary font-semibold text-lg">{row.partners || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">
                                  {row.isOpenOffer ? "On" : "Off"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
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
                Yes, end this partnership
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

        {/* Open Offer Subscription Confirmation Dialog */}
        <AlertDialog open={openOfferDialogOpen} onOpenChange={setOpenOfferDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Subscribe to Open Offer</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>Turning on Open Offer for <strong>{selectedLocationForOO?.store || selectedLocationForOO?.name}</strong> will:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                    <li>Show your offer at other nearby retailers</li>
                    <li>Show non-competing retailer offers at yours</li>
                    <li>Activate analytics on offer views and redemptions</li>
                    <li>Start a <strong>$25/month</strong> subscription for this location</li>
                  </ul>
                  
                  {creditBalance >= 25 && <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>You have ${creditBalance.toFixed(2)} in promo credits.</strong> Your free credits will be used first.
                      </p>
                    </div>}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col items-stretch gap-2 sm:flex-col">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <AlertDialogCancel disabled={togglingOpenOffer}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  if (!hasPaymentMethod && !isCheckingPaymentMethod) {
                    toast({
                      title: "Payment method required",
                      description: "You must add a card on file before subscribing.",
                      variant: "destructive"
                    });
                    setOpenOfferDialogOpen(false);
                    navigate(`/settings/billing?showAddCard=true&pendingOO=${selectedLocationForOO}`);
                    return;
                  }
                  if (selectedLocationForOO) {
                    updateOpenOfferStatus(selectedLocationForOO, true);
                  }
                }} disabled={togglingOpenOffer || isCheckingPaymentMethod} className="bg-accent-green hover:bg-accent-green/90">
                  {togglingOpenOffer ? "Joining..." : "Join Open Offer ($25/month)"}
                </AlertDialogAction>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">I authorize Media Street to charge my card on file until cancelled. Promo credits will be used, if available, before charging your card on file.</p>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Redemption Success Dialog */}
        <Dialog open={redemptionSuccessDialogOpen} onOpenChange={setRedemptionSuccessDialogOpen}>
          <DialogContent className="sm:max-w-md" aria-describedby="redemption-success-description">
            <DialogHeader className="sr-only">
              <DialogTitle>Coupon Redeemed Successfully</DialogTitle>
            </DialogHeader>
            <DialogDescription id="redemption-success-description" className="sr-only">
              The coupon has been successfully logged in the system.
            </DialogDescription>
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <img src={mediaStreetLogo} alt="Media Street" className="h-12 object-contain" />
              </div>
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Coupon Redeemed</h2>
              <p className="text-muted-foreground">Successfully logged this redemption!</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setRedemptionSuccessDialogOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enlarged Offer Preview Dialog */}
        <Dialog open={!!enlargedOffer} onOpenChange={() => setEnlargedOffer(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Offer Preview</DialogTitle>
              <DialogDescription>
                This is how the offer appears in the partner carousel
              </DialogDescription>
            </DialogHeader>
            {enlargedOffer && (
              <TabletOfferPreview
                businessName={enlargedOffer.businessName}
                callToAction={enlargedOffer.callToAction}
                offerImageUrl={enlargedOffer.offerImageUrl}
                redemptionStoreName={enlargedOffer.redemptionStoreName}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Welcome Credits Dialog - Overlays on dashboard */}
        <WelcomeCreditsDialog
          open={showWelcomeCreditsDialog}
          onClose={() => {
            setShowWelcomeCreditsDialog(false);
            localStorage.setItem('hasSeenWelcomeCreditsDialog', 'true');
          }}
          creditAmount={currentUser?.credit || 50}
        />

        {/* <Toaster /> */}
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;










