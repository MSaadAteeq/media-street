import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authActions } from "@/store/auth/auth";
import type { AppDispatch } from "@/store";
import { get, patch } from "@/services/apis";
// Supabase removed - will use Node.js API
import {
  Home,
  Store,
  MapPin,
  Zap,
  Bell,
  Gift,
  LogOut,
  User,
  CreditCard,
  ShoppingBag,
  Bot,
  Monitor,
  MessageSquare,
  QrCode,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageIcon?: ReactNode;
}

interface Notification {
  _id: string;
  id?: string;
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

const AppLayout = ({ children, pageTitle, pageIcon }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // Fetch user profile and referral code
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const userResponse = await get({ end_point: 'users/me', token: true });
        if (userResponse.success && userResponse.data) {
          setCurrentUser(userResponse.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      try {
        // TODO: Replace with Node.js API call
        // const response = await get({ end_point: 'profile/referral-code' });
        // setReferralCode(response.data.referral_code);

        // Mock data for now
        setReferralCode("REF12345");
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await get({ end_point: 'notifications', token: true });
      if (response.success && response.data) {
        const formattedNotifications: Notification[] = response.data.map((notif: any) => ({
          _id: notif._id,
          id: notif._id,
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
        }));
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

  // Fetch notifications on mount and when location changes
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const markAsRead = async (notificationId: string) => {
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
  };

  const markAllAsRead = async () => {
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
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

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

  const navigationItems = [
    {
      icon: Home,
      tooltip: "Dashboard",
      path: "/dashboard",
      onClick: () => navigate('/dashboard')
    },
    {
      icon: MapPin,
      tooltip: "Store Locations",
      path: "/locations",
      onClick: () => navigate('/locations')
    },
    {
      icon: Zap,
      tooltip: "Your Offers",
      path: "/offers",
      onClick: () => navigate('/offers')
    },
    {
      icon: QrCode,
      tooltip: "QR Code Stickers",
      path: "/location-qr",
      onClick: () => navigate('/location-qr')
    },
    {
      icon: Store,
      tooltip: "Partners",
      path: "/requests",
      onClick: () => navigate('/requests')
    },
    {
      icon: Bot,
      tooltip: "Open Offer",
      path: "/openoffer",
      onClick: () => navigate('/openoffer')
    },
    {
      icon: Monitor,
      tooltip: "In-Store Display",
      path: "/display",
      onClick: () => navigate('/display')
    },
    {
      icon: TrendingUp,
      tooltip: "Insights",
      path: "/insights",
      onClick: () => navigate('/insights')
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/offers") {
      return location.pathname === "/offers" || location.pathname.startsWith("/offers/");
    }
    if (path === "/location-qr") {
      return location.pathname === "/location-qr" || location.pathname.startsWith("/location-qr/");
    }
    if (path === "/openoffer") {
      return location.pathname === "/openoffer" || location.pathname.startsWith("/openoffer/");
    }
    if (path === "/insights") {
      return location.pathname === "/insights" || location.pathname.startsWith("/insights/");
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Left Sidebar */}
      <div className="fixed top-0 left-0 z-50 w-12 sm:w-16 h-full bg-background border-r border-border flex flex-col items-center py-3 sm:py-4 space-y-4 sm:space-y-6">
        {/* Logo */}
        <div className="mb-2 sm:mb-4">
          <Logo showText={false} />
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col space-y-4 sm:space-y-6">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`hover:text-foreground hover:bg-secondary ${isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                      }`}
                    onClick={item.onClick}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

      </div>

      {/* Main Content */}
      <div className="ml-12 sm:ml-16 min-h-screen">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {pageIcon}
            <span className="text-foreground font-medium text-sm sm:text-base">{pageTitle}</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Referral Code Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" side="bottom" className="max-w-[280px] sm:max-w-sm">
                <div className="space-y-2">
                  <p className="font-medium text-xs sm:text-sm">Your Referral Code</p>
                  <div className="bg-muted p-2 rounded font-mono text-xs sm:text-sm">
                    {currentUser?.referralCode || referralCode || "Loading..."}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Share this code with other retailers. You'll get 3 points when they sign up!</p>
                </div>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
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

            {/* User Profile */}
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className="w-8 h-8 bg-gradient-to-r from-primary to-accent-green rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center relative z-50"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent-green rounded-full border-2 border-background">
                    {currentUser?.fullName ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center text-white text-xs font-semibold">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <img
                        src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png"
                        alt={currentUser?.fullName || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 p-0 bg-card border-border shadow-lg z-[100]"
              >
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
                          <img
                            src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png"
                            alt={currentUser?.fullName || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{currentUser?.fullName || "User"}</div>
                        <div className="text-sm text-muted-foreground truncate">{currentUser?.email || "No email"}</div>
                      </div>
                      <div className="w-2 h-2 bg-accent-green rounded-full flex-shrink-0"></div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9 text-sm"
                      onClick={() => navigate('/settings/profile')}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9 text-sm"
                      onClick={() => navigate('/settings/messages')}
                    >
                      <MessageSquare className="h-4 w-4 mr-3" />
                      Messages
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9 text-sm"
                      onClick={() => navigate('/settings/billing')}
                    >
                      <CreditCard className="h-4 w-4 mr-3" />
                      Billing
                    </Button>
                    <div className="border-t pt-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-9 text-sm text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            // TODO: Replace with Node.js API call
                            // await post({ end_point: 'auth/logout' });

                            // Clear Redux state first
                            dispatch(authActions.logout());

                            // Remove token from localStorage
                            localStorage.removeItem('token');

                            // Navigate to login page
                            navigate('/login', { replace: true });
                          } catch (error) {
                            console.error('Logout error:', error);
                            // Even if there's an error, clear state and redirect
                            dispatch(authActions.logout());
                            localStorage.removeItem('token');
                            navigate('/login', { replace: true });
                          }
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                        <button
                          onClick={() => navigate('/privacy-policy')}
                          className="hover:text-foreground transition-colors"
                        >
                          Privacy Policy
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => navigate('/terms-of-service')}
                          className="hover:text-foreground transition-colors"
                        >
                          Terms & Conditions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;