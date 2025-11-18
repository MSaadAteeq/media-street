import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Upload, User, CreditCard, Shield, Bell, Trash2, BarChart3, DollarSign, TrendingUp, TrendingDown, Info, MessageSquare, Send, X } from "lucide-react";
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
  }, []);

  const fetchCreditBalance = async () => {
    try {
      // TODO: Replace with Node.js API call
      // const response = await get({ end_point: 'credits/balance' });
      // setCreditBalance(response.data.credit_balance || 0);
      
      // Mock implementation
      setCreditBalance(0);
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    }
  };

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsRedeemingPromo(true);
    try {
      // TODO: Replace with Node.js API call
      // const response = await post({ end_point: 'promo-codes/redeem', body: { code: promoCode.trim() } });
      // if (response.data.error) {
      //   toast.error(response.data.error);
      // } else {
      //   toast.success(`Success! $${response.data.credit_amount} credit added to your account`);
      //   setCreditBalance(response.data.new_balance);
      //   setPromoCode("");
      // }
      
      // Mock implementation
      toast.info('Promo code redemption will be available after API integration');
      setPromoCode("");
    } catch (error) {
      console.error("Error redeeming promo code:", error);
      toast.error("Failed to redeem promo code");
    } finally {
      setIsRedeemingPromo(false);
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Information</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your payment methods and billing details for campaign charges.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Saved Cards */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saved Card(s)</label>
                  <p className="text-sm text-muted-foreground">You can save up to 5 cards</p>
                </div>

                {/* Add New Card */}
                <div className="space-y-2">
                  <Button variant="outline">Add Card</Button>
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
                    {/* Open Offer Monthly Charges */}
                    <TableRow>
                      <TableCell className="text-sm">Jan 8, 2025</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          Open Offer
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Monthly Open Offer Subscription
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -$20.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">Dec 8, 2024</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          Open Offer
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Monthly Open Offer Subscription
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -$20.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">Nov 8, 2024</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          Open Offer
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Monthly Open Offer Subscription
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -$20.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">Oct 8, 2024</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          Open Offer
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Monthly Open Offer Subscription
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -$20.00
                      </TableCell>
                    </TableRow>
                    
                    {/* Partnership Purchases */}
                    <TableRow>
                      <TableCell className="text-sm">Jan 8, 2025</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-500/20 text-purple-500">
                          Partnership
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Cross-promotion with Main Street Coffee
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div>-$10.00</div>
                        <Badge variant="secondary" className="text-xs mt-1">Paid with Credits</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">Jan 5, 2025</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-500/20 text-purple-500">
                          Partnership
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        Cross-promotion with Downtown Yoga Studio
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -$10.00
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Promo Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promo Codes</CardTitle>
                <p className="text-sm text-muted-foreground">Redeem promo codes to add credits. Credits are used before charging your card.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Credit Balance */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-accent-green/10 rounded-lg border border-primary/20 min-w-[200px]">
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
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleRedeemPromoCode()}
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
    </div>
  );
};

export default Settings;
