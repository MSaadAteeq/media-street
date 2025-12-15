import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Upload, User, CreditCard, Shield, Bell, Trash2, BarChart3, DollarSign, TrendingUp, TrendingDown, Info, MessageSquare, Send, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MediaStreetOverlay } from "@/components/MediaStreetOverlay";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import ReferralCodeCard from "@/components/ReferralCodeCard";
import { AddCardForm } from "@/components/AddCardForm";
import { get, post, deleteApi } from "@/services/apis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const [adsEnabled, setAdsEnabled] = useState(() => {
    return localStorage.getItem('adsEnabled') === 'true';
  });
  const [showMediaStreetOverlay, setShowMediaStreetOverlay] = useState(false);
  const [balance, setBalance] = useState(327.50);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [activePartnerships, setActivePartnerships] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [offerXSubscription, setOfferXSubscription] = useState<any>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null);
  const [cancelOODialogOpen, setCancelOODialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show overlay when visiting content tab if ads are enabled
  useEffect(() => {
    if (location.pathname.includes('/content') && adsEnabled) {
      setShowMediaStreetOverlay(true);
    }
  }, [location.pathname, adsEnabled]);
  
  // Determine current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/messages')) return 'messages';
    if (path.includes('/billing')) return 'billing';
    if (path.includes('/security')) return 'security';
    if (path.includes('/notifications')) return 'notifications';
    return 'profile'; // default
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchActivePartnerships();
    fetchCreditBalance();
    if (getCurrentTab() === 'billing') {
      fetchSavedCards();
      fetchTransactions();
      fetchSubscriptions();
    }
  }, []);

  useEffect(() => {
    if (getCurrentTab() === 'billing') {
      fetchSavedCards();
      fetchTransactions();
      fetchSubscriptions();
    }
  }, [location.pathname]);

  const fetchCreditBalance = async () => {
    try {
      const response = await get({ end_point: 'users/me', token: true });
      if (response.success && response.data) {
        setCreditBalance(response.data.credit || 0);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    }
  };

  const fetchSavedCards = async () => {
    setLoadingCards(true);
    try {
      const response = await get({ end_point: 'billing/cards', token: true });
      if (response.success && response.data) {
        setSavedCards(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      setSavedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await get({ end_point: 'billing/transactions', token: true });
      if (response.success && response.data) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const [partnershipsResponse, openOfferResponse] = await Promise.all([
        get({ end_point: 'partners/active', token: true }).catch(() => ({ success: false, data: [] })),
        get({ end_point: 'partners/open-offer-subscription', token: true }).catch(() => ({ success: false, data: null }))
      ]);

      if (partnershipsResponse.success) {
        setSubscriptions(partnershipsResponse.data || []);
      }

      if (openOfferResponse.success && openOfferResponse.data) {
        setOfferXSubscription(openOfferResponse.data);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSubscriptions([]);
      setOfferXSubscription(null);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setIsAddingCard(true);
  };

  const handleCardFormCancel = () => {
    setIsAddingCard(false);
  };

  const handleCardAdded = () => {
    setIsAddingCard(false);
    fetchSavedCards();
    toast.success("Card added successfully!");
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCard(cardId);
    try {
      const response = await deleteApi({ end_point: `billing/cards/${cardId}`, token: true });
      if (response.success) {
        toast.success("Card deleted successfully");
        fetchSavedCards();
      } else {
        throw new Error(response.message || "Failed to delete card");
      }
    } catch (error: any) {
      console.error("Error deleting card:", error);
      toast.error(error?.response?.data?.message || "Failed to delete card");
    } finally {
      setDeletingCard(null);
    }
  };

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsRedeemingPromo(true);
    try {
      const response = await post({ 
        end_point: 'billing/redeem-promo', 
        body: { code: promoCode.trim().toUpperCase() },
        token: true 
      });
      
      if (response.success) {
        toast.success(`Success! $${response.data.credit_amount || 0} credit added to your account`);
        setCreditBalance(response.data.new_balance || creditBalance);
      setPromoCode("");
        fetchCreditBalance();
      } else {
        toast.error(response.message || "Invalid promo code");
      }
    } catch (error: any) {
      console.error("Error redeeming promo code:", error);
      toast.error(error?.response?.data?.message || "Failed to redeem promo code");
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const handleCancelPartnership = async (partnershipId: string, partnership: any) => {
    setCancellingSubscription(partnershipId);
    try {
      const response = await post({
        end_point: `partners/${partnershipId}/cancel`,
        token: true
      });
      
      if (response.success) {
        toast.success("Partnership cancelled successfully");
        fetchSubscriptions();
      } else {
        throw new Error(response.message || "Failed to cancel partnership");
      }
    } catch (error: any) {
      console.error("Error cancelling partnership:", error);
      toast.error(error?.response?.data?.message || "Failed to cancel partnership");
    } finally {
      setCancellingSubscription(null);
    }
  };

  const openCancelOODialog = () => {
    setCancelOODialogOpen(true);
  };

  const handleCancelOpenOffer = async () => {
    setCancellingSubscription('offerx');
    setCancelOODialogOpen(false);
    try {
      const response = await post({
        end_point: 'subscriptions/open-offer/cancel',
        token: true
      });
      
      if (response.success) {
        toast.success("Open Offer subscription cancelled successfully");
        fetchSubscriptions();
      } else {
        throw new Error(response.message || "Failed to cancel subscription");
      }
    } catch (error: any) {
      console.error("Error cancelling Open Offer:", error);
      toast.error(error?.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setCancellingSubscription(null);
    }
  };


  const fetchCurrentUser = async () => {
    // TODO: Replace with Node.js API call
    // const response = await get({ end_point: 'auth/me' });
    // setCurrentUserId(response.data.user.id);
    
    // Mock implementation
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentUserId('current-user-id');
    }
  };

  const fetchActivePartnerships = async () => {
    try {
      // Mock data - will work with real data once database is set up
      const mockPartnerships = [
        {
          id: '1',
          partner_name: "Sample Retailer",
          partner_id: 'sample-retailer-id',
          last_message: "That sounds great! Let's coordinate our offers. We also have an event coming up you can participate in if you want.",
          last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          unread_count: 1
        }
      ];
      setActivePartnerships(mockPartnerships);
      console.log('Active partnerships loaded:', mockPartnerships);
      
      // Check if there's a partner to select from URL
      const urlParams = new URLSearchParams(window.location.search);
      const partnerName = urlParams.get('partner');
      if (partnerName) {
        const partner = mockPartnerships.find(p => p.partner_name === partnerName);
        if (partner) {
          handleSelectPartner(partner);
        }
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    setLoadingMessages(true);
    try {
      // Mock message
      const mockMessages = [
        {
          id: '1',
          sender_id: partnerId,
          message_text: "That sounds great! Let's coordinate our offers. We also have an event coming up you can participate in if you want.",
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          read: true
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectPartner = (partner: any) => {
    setSelectedPartner(partner);
    fetchMessages(partner.partner_id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      const newMsg = {
        id: Date.now().toString(),
        sender_id: currentUserId,
        message_text: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage("");
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        {/* Tabs */}
        <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Info</CardTitle>
                <p className="text-sm text-muted-foreground">Update your photo and personal details here</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Photo</label>
                  <p className="text-sm text-muted-foreground">This will be displayed on your profile</p>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent-green flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 flex-1 flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 800x400px)</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input defaultValue="Kris Marins" className="max-w-md" />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input defaultValue="Media Street" className="max-w-md" />
                </div>

                {/* LinkedIn URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input defaultValue="in/krismartins" className="max-w-md" />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex items-center gap-2 max-w-md">
                    <Input defaultValue="kris@mediastreet.ai" readOnly className="flex-1" />
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Number</label>
                  <p className="text-sm text-muted-foreground">We'll only use this to contact you about important account matters.</p>
                  <div className="flex items-center gap-2 max-w-md">
                    <Input defaultValue="16465577924" className="flex-1" />
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="max-w-md">
                    <ChangePasswordDialog>
                      <Button variant="outline">Change Password</Button>
                    </ChangePasswordDialog>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-primary hover:bg-primary/90">Update Profile</Button>
                </div>
              </CardContent>
            </Card>

            <ReferralCodeCard />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partner Messages</CardTitle>
                <p className="text-sm text-muted-foreground">Message your active partners</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                  {/* Partner List */}
                  <div className="md:col-span-1 border-r pr-4">
                    <ScrollArea className="h-full">
                      {activePartnerships.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No active partnerships yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activePartnerships.map((partner) => (
                            <div
                              key={partner.id}
                              onClick={() => handleSelectPartner(partner)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedPartner?.id === partner.id
                                  ? 'bg-primary/10 border border-primary'
                                  : 'hover:bg-muted border border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{partner.partner_name}</p>
                                    {partner.unread_count > 0 && (
                                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                        {partner.unread_count}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {partner.last_message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(partner.last_message_time).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Conversation Area */}
                  <div className="md:col-span-2 flex flex-col">
                    {!selectedPartner ? (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Select a partner to start messaging</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Conversation Header */}
                        <div className="border-b pb-3 mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{selectedPartner.partner_name}</h3>
                            <p className="text-xs text-muted-foreground">Active Partnership</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedPartner(null)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 pr-4 mb-4">
                          {loadingMessages ? (
                            <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No messages yet. Start the conversation!</div>
                          ) : (
                            <div className="space-y-4">
                              {messages.map((msg) => {
                                const isOwnMessage = msg.sender_id === currentUserId || msg.sender_id === 'current-user-id';
                                return (
                                  <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-lg p-3 ${
                                      isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    }`}>
                                      <p className="text-sm">{msg.message_text}</p>
                                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="flex gap-2 border-t pt-4">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Pricing Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Overview</CardTitle>
                <p className="text-sm text-muted-foreground">How Media Street billing works</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Open Offer */}
                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                    <Badge className="bg-green-500/20 text-green-400 border-0 mb-3">Open Offer</Badge>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-foreground">$25</span>
                      <span className="text-sm text-muted-foreground">/month per store</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Charged at the beginning of each month for each enrolled store location. Earn $1 in promo credits for each referral you generate for other OO retailers.</p>
                    <p className="text-xs text-muted-foreground/70 mt-3 italic">✨ Quick math: 2.5 new customers in 30 days = worth it</p>
                  </div>

                  {/* Partnership */}
                  <div className="p-4 rounded-lg border border-pink-500/30 bg-pink-500/5">
                    <Badge className="bg-pink-500/20 text-pink-400 border-0 mb-3">Partnership</Badge>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-foreground">$10</span>
                      <span className="text-sm text-muted-foreground">/partnership</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Charged after 30 days if not cancelled, to the retailer generating the fewest redemptions. If tied, retailer generating fewest views for partner pays the fee.</p>
                    <p className="text-xs text-muted-foreground/70 mt-3 italic">✨ Quick math: 1+ new customer / mo. in 30 days = worth it</p>
                  </div>
                </div>

                {/* Credits */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <Badge className="bg-primary/20 text-primary border-0 mb-3">Credits</Badge>
                  <p className="text-sm text-muted-foreground">
                    Earn credits each time you generate an Open Offer redemption for another retailer. Credits earned are automatically used to discount upcoming Open Offer or individual partnership charges!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Information</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your payment methods and billing details.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAddingCard ? (
                  <AddCardForm 
                    onSuccess={() => {
                      handleCardAdded();
                      fetchSavedCards();
                    }} 
                    onCancel={handleCardFormCancel} 
                  />
                ) : (
                  <>
                <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Saved Card(s)</label>
                  <p className="text-sm text-muted-foreground">You can save up to 5 cards</p>
                </div>

                    {/* Display saved cards */}
                    {loadingCards ? (
                      <div className="text-sm text-muted-foreground">Loading cards...</div>
                    ) : savedCards.length > 0 ? (
                <div className="space-y-2">
                        {savedCards.map((card) => (
                          <div key={card.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground capitalize">
                                  {card.brand} •••• {card.last4}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Expires {card.exp_month}/{card.exp_year}
                                  {card.is_default && <span className="ml-2 text-primary">(Default)</span>}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCard(card.id)}
                              disabled={deletingCard === card.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingCard === card.id ? 'Deleting...' : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No cards saved yet</div>
                    )}
                    
                    <Button variant="outline" onClick={handleAddPaymentMethod} disabled={savedCards.length >= 5}>
                      Add Card
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Promo Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promo Credits</CardTitle>
                <p className="text-sm text-muted-foreground">Redeem promo codes to add credits. You also earn credits automatically each time a consumer redeems a partner offer promoted by one of your store(s). Credits are used before charging your card.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Credit Balance */}
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20 min-w-[180px]">
                    <DollarSign className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Available Credits</p>
                      <p className="text-2xl font-bold text-foreground">${creditBalance.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div className="flex-1 flex gap-2">
                    <Input 
                      placeholder="Enter promo code" 
                      value={promoCode} 
                      onChange={e => setPromoCode(e.target.value.toUpperCase())} 
                      onKeyPress={e => e.key === 'Enter' && handleRedeemPromoCode()} 
                      disabled={isRedeemingPromo} 
                      className="max-w-xs" 
                    />
                    <Button 
                      onClick={handleRedeemPromoCode} 
                      disabled={isRedeemingPromo || !promoCode.trim()} 
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isRedeemingPromo ? "Redeeming..." : "Redeem"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <p className="text-sm text-muted-foreground">Recent earnings and expenses</p>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transactions.map((transaction: any) => {
                        const isCredit = transaction.transaction_type === 'credit' || transaction.transaction_type === 'promo_redemption' || transaction.transaction_type === 'referral_bonus';
                        const isPartnership = transaction.transaction_type === 'partnership_charge' || transaction.transaction_type === 'partnership_monthly';
                        const isOfferX = transaction.transaction_type === 'offerx_subscription' || transaction.transaction_type === 'offerx_monthly';

                        let badgeColor = "border-primary/20 text-primary";
                        let badgeLabel = "Charge";

                        if (isCredit) {
                          badgeColor = "border-green-500/20 text-green-500";
                          badgeLabel = "Credit";
                        } else if (isPartnership) {
                          badgeColor = "border-purple-500/20 text-purple-500";
                          badgeLabel = "Partnership";
                        } else if (isOfferX) {
                          badgeColor = "border-primary/20 text-primary";
                          badgeLabel = "Open Offer";
                        }

                        return (
                          <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                      </TableCell>
                      <TableCell>
                              <Badge variant="outline" className={badgeColor}>
                                {badgeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                              {transaction.description}
                      </TableCell>
                            <TableCell className={`text-right font-medium ${isCredit ? 'text-green-600' : ''}`}>
                              <div>{isCredit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}</div>
                              {transaction.paid_with_credits && (
                                <div className="text-xs text-muted-foreground">Paid with Credits</div>
                              )}
                      </TableCell>
                    </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Subscriptions</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your active partnerships and Open Offer subscriptions</p>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <div className="text-center py-8 text-muted-foreground">Loading subscriptions...</div>
                ) : subscriptions.length === 0 && !offerXSubscription ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active subscriptions</p>
                    </div>
                ) : (
                  <div className="space-y-4">
                    {/* Open Offer Subscription */}
                    {offerXSubscription && offerXSubscription.isSubscribed && (
                      <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-r from-primary/5 to-transparent relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">Open Offer</h3>
                              <Badge variant="outline" className="border-primary/20 text-primary">
                                Active
                              </Badge>
                  </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Monthly subscription - $25/month per location
                            </p>
                            {offerXSubscription.activeLocations && offerXSubscription.activeLocations.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <p>Active locations: {offerXSubscription.activeLocations.length}</p>
                                {offerXSubscription.locationNames && (
                                  <p className="mt-1">{offerXSubscription.locationNames.join(', ')}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openCancelOODialog()} 
                            disabled={cancellingSubscription === 'offerx'} 
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          >
                            {cancellingSubscription === 'offerx' ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Partnerships */}
                    {subscriptions.map(partnership => (
                      <div key={partnership.id} className="border border-border rounded-lg p-4 relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">
                                {partnership.partner_name || `Partnership with Partner`}
                              </h3>
                              <Badge variant="outline" className="border-purple-500/20 text-purple-500">
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Monthly charge - $10/month per partnership
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started {new Date(partnership.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                    <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelPartnership(partnership.id, partnership)} 
                            disabled={cancellingSubscription === partnership.id} 
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          >
                            {cancellingSubscription === partnership.id ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  </div>
                </div>
                    ))}

                    {/* Info Alert */}
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Cancellation Policy</p>
                        <p>Cancelling a subscription will stop future charges. Your access will remain active until the end of the current billing period.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your active sessions</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Sessions */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Active Sessions</label>
                  <p className="text-sm text-muted-foreground">Where you're logged in</p>
                  
                  {/* Current Session */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">2018 MacBook Pro 15-inch</p>
                        <p className="text-sm text-muted-foreground">Los Angeles, California • 22 Jan at 10:40am</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active now</span>
                      </div>
                    </div>
                  </div>

                  {/* Other Sessions */}
                  <div className="space-y-3">
                    {[1, 2].map((session) => (
                      <div key={session} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">2018 MacBook Pro 15-inch</p>
                            <p className="text-sm text-muted-foreground">Los Angeles, California • 22 Jan at 10:40am</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete Account */}
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">Delete Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
                    <Button variant="destructive" className="text-destructive border-destructive hover:bg-destructive/10">
                      Delete my account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">Manage how you receive important notifications</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Updates */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Campaign Updates</h3>
                    <p className="text-sm text-muted-foreground">Get real-time alerts for key campaign updates</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In-App</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Security Alerts */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get alerts for logins from new devices or locations</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In-App</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Monthly Insights */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Monthly Insights</h3>
                    <p className="text-sm text-muted-foreground">Monthly performance and insight updates</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In-App</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="border-t pt-6">
                  <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                    <h3 className="font-medium">Stay in the loop with Media Street Minute</h3>
                    <p className="text-sm text-muted-foreground">A quick weekly rundown of all the latest industry trends along with exciting Media Street updates and offers.</p>
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Subscribe to updates</label>
                      <Button className="bg-primary hover:bg-primary/90">Subscribe</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      
      <MediaStreetOverlay
        isVisible={showMediaStreetOverlay}
        onClose={() => setShowMediaStreetOverlay(false)}
      />

      {/* Cancel Open Offer Dialog */}
      <AlertDialog open={cancelOODialogOpen} onOpenChange={setCancelOODialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Open Offer Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your Open Offer subscription? Your access will remain active until the end of the current billing period, and you won't be charged for the next month.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOpenOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
