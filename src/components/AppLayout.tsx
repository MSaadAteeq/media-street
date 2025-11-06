import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home,
  Store, 
  MapPin,
  Zap,
  Settings,
  Bell,
  Gift,
  LogOut,
  User,
  CreditCard,
  ShoppingBag,
  Bot,
  Monitor,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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

interface PartnerNotification {
  id: string;
  type: 'new_request' | 'request_approved' | 'request_rejected' | 'partnership_ended' | 'new_message';
  retailerName: string;
  timestamp: Date;
  read: boolean;
}

const AppLayout = ({ children, pageTitle, pageIcon }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [referralCode, setReferralCode] = useState<string>("");

  // Fetch referral code
  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching referral code:', error);
          return;
        }

        if (data?.referral_code) {
          setReferralCode(data.referral_code);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchReferralCode();
  }, []);

  // Mock notifications - replace with real data from Supabase
  useEffect(() => {
    const mockNotifications: PartnerNotification[] = [
      {
        id: '0',
        type: 'new_message',
        retailerName: "Joe's Coffee",
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false
      },
      {
        id: '1',
        type: 'new_request',
        retailerName: 'Bloom Flower Shop',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false
      },
      {
        id: '2',
        type: 'request_approved',
        retailerName: 'Java Junction Coffee',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false
      },
      {
        id: '3',
        type: 'request_rejected',
        retailerName: 'The Clean Scene',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationMessage = (notification: PartnerNotification) => {
    switch (notification.type) {
      case 'new_message':
        return `You've got a new message from ${notification.retailerName}`;
      case 'new_request':
        return `You've received a new partner request from ${notification.retailerName}`;
      case 'request_approved':
        return `Your partner request to ${notification.retailerName} was approved`;
      case 'request_rejected':
        return `Your partner request to ${notification.retailerName} was rejected`;
      case 'partnership_ended':
        return `Your partnership has been ended by ${notification.retailerName}`;
      default:
        return '';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const allNavigationItems = [
    { 
      icon: Home, 
      tooltip: "Dashboard", 
      path: "/dashboard",
      onClick: () => navigate('/dashboard')
    },
    { 
      icon: Store, 
      tooltip: "Partners", 
      path: "/requests",
      onClick: () => navigate('/requests')
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
      icon: Settings, 
      tooltip: "Settings", 
      path: "/settings",
      onClick: () => navigate('/settings')
    },
  ];

  // Filter out Settings icon for Partner Requests, Store Locations, Offers, and Open Offer pages
  const navigationItems = allNavigationItems.filter(item => {
    if (item.path === "/settings") {
      return location.pathname !== "/requests" && 
       location.pathname !== "/locations" && 
             location.pathname !== "/offers" && 
             !location.pathname.startsWith("/offers/") &&
             location.pathname !== "/openoffer" && 
             !location.pathname.startsWith("/openoffer/") &&
             location.pathname !== "/display";
    }
    return true;
  });

  const isActivePath = (path: string) => {
    if (path === "/offers") {
      return location.pathname === "/offers" || location.pathname.startsWith("/offers/");
    }
    if (path === "/openoffer") {
      return location.pathname === "/openoffer" || location.pathname.startsWith("/openoffer/");
    }
    if (path === "/settings") {
      return location.pathname === "/settings" || location.pathname.startsWith("/settings/");
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Left Sidebar */}
      <div className="fixed top-0 left-0 z-50 w-12 sm:w-16 h-full bg-background border-r border-border flex flex-col items-center py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Logo */}
        <div className="mb-2 sm:mb-4">
          <Logo showText={false} />
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col space-y-1.5 sm:space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 sm:h-10 sm:w-10 hover:text-foreground hover:bg-secondary ${
                      isActive ? 'bg-secondary text-primary' : 'text-muted-foreground'
                    }`}
                    onClick={item.onClick}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
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
            {/* Referral Code Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] sm:max-w-sm">
                <div className="space-y-2">
                  <p className="font-medium text-xs sm:text-sm">Your Referral Code</p>
                  <div className="bg-muted p-2 rounded font-mono text-xs sm:text-sm">
                    {referralCode || "Loading..."}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Share this code with other retailers. You'll get 3 points when they sign up!</p>
                </div>
              </TooltipContent>
            </Tooltip>

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
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-secondary/50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-secondary/30' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            navigate('/requests');
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground flex-1">
                              {getNotificationMessage(notification)}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* User Profile */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <div 
                  className="w-8 h-8 bg-gradient-to-r from-primary to-accent-green rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent-green rounded-full border-2 border-background">
                    <img 
                      src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png" 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent 
                align="end" 
                className="w-80 p-0 bg-card border-border shadow-lg"
              >
                <div className="p-4 space-y-4">
                  {/* Account Section */}
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-sm font-medium">Account</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent-green rounded-full flex items-center justify-center">
                        <img 
                          src="/lovable-uploads/3c4bccb9-97d2-4019-b7e2-fb8f77dae9ad.png" 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Kris Mathis</div>
                        <div className="text-sm text-muted-foreground">kris@mediastreet.ai</div>
                      </div>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-9 text-sm"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Button>
                    <div className="border-t pt-1 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start h-9 text-sm text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            await supabase.auth.signOut();
                            navigate('/login');
                          } catch (error) {
                            console.error('Logout error:', error);
                            navigate('/login');
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
              </HoverCardContent>
            </HoverCard>
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