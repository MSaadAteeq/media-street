import { useState, useEffect, useRef } from "react";
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
import { get, post, patch, deleteApi } from "@/services/apis";
import socketManager from "@/utils/socket";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const [adsEnabled, setAdsEnabled] = useState(() => {
    return localStorage.getItem('adsEnabled') === 'true';
  });
  const [showMediaStreetOverlay, setShowMediaStreetOverlay] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activePartnerships, setActivePartnerships] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const optimisticTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
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
  const [notificationPreferences, setNotificationPreferences] = useState({
    campaignUpdates: { inApp: true, email: true },
    securityAlerts: { inApp: true, email: true },
    monthlyInsights: { inApp: true, email: true },
    newsletter: false
  });
  const [loadingNotificationPrefs, setLoadingNotificationPrefs] = useState(false);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
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
    // if (path.includes('/security')) return 'security';
    if (path.includes('/notifications')) return 'notifications';
    return 'profile'; // default
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUserProfile();
    if (getCurrentTab() === 'messages') {
      fetchConversations();
    }
    if (getCurrentTab() === 'billing') {
      fetchSavedCards();
      fetchTransactions();
      fetchSubscriptions();
    }
    if (getCurrentTab() === 'notifications') {
      fetchNotificationPreferences();
    }
  }, []);

  useEffect(() => {
    if (getCurrentTab() === 'notifications') {
      fetchNotificationPreferences();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (getCurrentTab() === 'messages') {
      fetchConversations();
    }
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
    try {
      const response = await get({ end_point: 'users/me', token: true });
      if (response.success && response.data) {
        setCurrentUserId(response.data.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await get({ end_point: 'users/me', token: true });
      if (response.success && response.data) {
        console.log('📥 Fetched user profile:', response.data);
        setUserProfile(response.data);
        setCurrentUserId(response.data.id || response.data._id);
        setFullName(response.data.fullName || "");
        setEmail(response.data.email || "");
        
        // Set profile picture from avatar field
        const avatar = response.data.avatar || response.data.profilePicture || null;
        console.log('🖼️ Setting profile picture from fetch:', avatar ? avatar.substring(0, 50) + '...' : 'null');
        setProfilePicture(avatar);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setProfilePictureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      // First upload profile picture if selected
      let avatarUrl = profilePicture;
      
      if (profilePictureFile) {
        // Convert file to base64 for now (in production, upload to cloud storage)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(profilePictureFile);
        avatarUrl = await base64Promise;
        console.log('📸 Converting new profile picture to base64...');
      }

      // Prepare update body
      const updateBody: any = {
        fullName: fullName
      };
      
      // Always send avatar if we have one (either new upload or existing)
      if (avatarUrl) {
        updateBody.avatar = avatarUrl;
        console.log('📸 Sending avatar in update request:', avatarUrl.substring(0, 50) + '...');
      } else {
        console.log('⚠️ No avatar to send');
      }

      console.log('📤 Updating profile with:', { fullName, hasAvatar: !!avatarUrl });

      // Update profile
      const response = await patch({
        end_point: 'users/profile',
        body: updateBody,
        token: true
      });

      console.log('📥 Profile update response:', response);

      if (response.success) {
        toast.success("Profile updated successfully!");
        
        // Update state immediately with the response data
        if (response.data) {
          console.log('✅ Updating state with response data:', response.data);
          setUserProfile(response.data);
          setFullName(response.data.fullName || fullName);
          
          // Always update profile picture from response
          if (response.data.avatar) {
            console.log('✅ Setting profile picture from response:', response.data.avatar.substring(0, 50) + '...');
            setProfilePicture(response.data.avatar);
          } else {
            console.log('⚠️ No avatar in response data');
          }
        }
        
        setProfilePictureFile(null);
        
        // Also refetch to ensure we have the latest data
        await fetchUserProfile();
        
        // Dispatch event to notify other components (like AppLayout) to refresh user data
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // Note: Email change might require verification
      // For now, we'll just show a message that this feature requires backend support
      toast.error("Email change functionality requires backend support. Please contact support.");
      setShowChangeEmailDialog(false);
      setNewEmail("");
    } catch (error: any) {
      console.error("Error changing email:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to change email");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await get({ end_point: 'messages/conversations', token: true });
      if (response.success && response.data) {
        setActivePartnerships(response.data || []);
        
        // Check if there's a partner to select from URL
        const urlParams = new URLSearchParams(window.location.search);
        const partnerName = urlParams.get('partner');
        if (partnerName) {
          const partner = response.data.find((p: any) => p.partner_name === partnerName);
          if (partner) {
            handleSelectPartner(partner);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setActivePartnerships([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (partnershipId: string) => {
    setLoadingMessages(true);
    
    // Try WebSocket first
    if (socketManager.isConnected()) {
      socketManager.requestMessages(partnershipId);
      // Messages will be received via WebSocket event
    } else {
      // Fallback to API
      try {
        const response = await get({ 
          end_point: `messages/partnership/${partnershipId}`, 
          token: true 
        });
        if (response.success && response.data) {
          setMessages(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    }
  };

  const handleSelectPartner = (partner: any) => {
    // Leave previous partnership room if exists
    if (selectedPartner?.partnership_id && socketManager.isConnected()) {
      socketManager.leavePartnership(selectedPartner.partnership_id);
    }
    
    setSelectedPartner(partner);
    if (partner.partnership_id) {
      // Join partnership room for real-time messages
      if (socketManager.isConnected()) {
        socketManager.joinPartnership(partner.partnership_id);
      }
      fetchMessages(partner.partnership_id);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner) return;

    const messageText = newMessage.trim();
    const partnershipId = selectedPartner.partnership_id;
    const recipientId = selectedPartner.partner_id;

    // Optimistically add message to UI for instant feedback
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId || '',
      recipient_id: recipientId,
      partnership_id: partnershipId,
      message_text: messageText,
      created_at: new Date().toISOString(),
      read: false,
      sender: {
        id: currentUserId || '',
        fullName: userProfile?.fullName || 'You',
        email: userProfile?.email || ''
      },
      isOptimistic: true
    };

    // Add optimistic message immediately for instant UI update
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    // Set timeout to remove optimistic message if not confirmed within 10 seconds
    const optimisticTimeout = setTimeout(() => {
      setMessages(prev => {
        const stillOptimistic = prev.find(m => m.id === optimisticMessage.id && m.isOptimistic);
        if (stillOptimistic) {
          console.warn('⚠️ Optimistic message not confirmed after 10 seconds, removing');
          return prev.filter(m => m.id !== optimisticMessage.id);
        }
        return prev;
      });
      optimisticTimeoutsRef.current.delete(optimisticMessage.id);
    }, 10000);
    
    // Store timeout for cleanup
    optimisticTimeoutsRef.current.set(optimisticMessage.id, optimisticTimeout);

    // Try WebSocket first for instant delivery
    if (socketManager.isConnected()) {
      socketManager.sendMessage({
        partnershipId,
        messageText,
        recipientId
      });
      // Message will be confirmed via WebSocket event
      // Optimistic message will be replaced when real message arrives
      // Clear timeout when message is confirmed (handled in handleMessageSent)
    } else {
      // Fallback to API
      try {
        const response = await post({
          end_point: 'messages',
          body: {
            partnershipId,
            messageText,
            recipientId
          },
          token: true
        });

        if (response.success && response.data) {
          // Clear timeout since message was sent successfully
          const timeout = optimisticTimeoutsRef.current.get(optimisticMessage.id);
          if (timeout) {
            clearTimeout(timeout);
            optimisticTimeoutsRef.current.delete(optimisticMessage.id);
          }
          
          // Replace optimistic message with real one
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== optimisticMessage.id);
            return [...filtered, response.data];
          });
          toast.success('Message sent!');
          // Refresh conversations to update last message
          fetchConversations();
        } else {
          // Clear timeout and remove optimistic message on error
          const timeout = optimisticTimeoutsRef.current.get(optimisticMessage.id);
          if (timeout) {
            clearTimeout(timeout);
            optimisticTimeoutsRef.current.delete(optimisticMessage.id);
          }
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
          throw new Error(response.message || 'Failed to send message');
        }
      } catch (error: any) {
        // Clear timeout and remove optimistic message on error
        const timeout = optimisticTimeoutsRef.current.get(optimisticMessage.id);
        if (timeout) {
          clearTimeout(timeout);
          optimisticTimeoutsRef.current.delete(optimisticMessage.id);
        }
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        console.error('Error sending message:', error);
        toast.error(error?.response?.data?.message || 'Failed to send message');
      }
    }
  };

  const fetchNotificationPreferences = async () => {
    setLoadingNotificationPrefs(true);
    try {
      const response = await get({ end_point: 'users/notification-preferences', token: true });
      if (response.success && response.data) {
        setNotificationPreferences(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoadingNotificationPrefs(false);
    }
  };

  const updateNotificationPreference = async (category: string, type: string, value: boolean) => {
    // Optimistically update UI
    const currentPrefs = { ...notificationPreferences };
    const updatedPrefs = { ...notificationPreferences };
    
    if (category === 'newsletter') {
      updatedPrefs.newsletter = value;
    } else if (updatedPrefs[category as keyof typeof updatedPrefs]) {
      (updatedPrefs[category as keyof typeof updatedPrefs] as any)[type] = value;
    }
    setNotificationPreferences(updatedPrefs);

    // Save to backend
    setSavingNotificationPrefs(true);
    try {
      const response = await patch({
        end_point: 'users/notification-preferences',
        body: { notificationPreferences: updatedPrefs },
        token: true
      });
      
      if (response.success) {
        setNotificationPreferences(response.data);
        toast.success('Notification preferences updated');
      } else {
        // Revert on error
        setNotificationPreferences(currentPrefs);
        throw new Error(response.message || 'Failed to update preferences');
      }
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      toast.error(error?.response?.data?.message || 'Failed to update notification preferences');
      // Revert to previous state
      setNotificationPreferences(currentPrefs);
    } finally {
      setSavingNotificationPrefs(false);
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize WebSocket connection for messages
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketManager.isConnected()) {
      socketManager.connect(token);
    }

    const socket = socketManager.getSocket();
    if (socket) {
      // Listen for incoming messages
      const handleIncomingMessage = (message: any) => {
        console.log('📨 Received WebSocket message:', message);
        
        // Only add if it's for the current partnership
        const messagePartnershipId = message.partnership_id || message.partnershipId;
        const currentPartnershipId = selectedPartner?.partnership_id || selectedPartner?.id;
        
        if (currentPartnershipId && 
            (messagePartnershipId === currentPartnershipId || 
             messagePartnershipId?.toString() === currentPartnershipId?.toString())) {
          
          setMessages(prev => {
            const messageId = message.id || message._id;
            const messageText = message.message_text || message.messageText || message.text || '';
            const messageSenderId = message.sender_id || message.senderId || message.sender?.id;
            
            // Check if this is our own message (to replace optimistic)
            const isOwnMessage = messageSenderId === currentUserId || 
                               messageSenderId?.toString() === currentUserId ||
                               (typeof messageSenderId === 'object' && messageSenderId?.toString() === currentUserId);
            
            // Remove optimistic message if this is the real one (same text and from same sender)
            let filtered = prev;
            if (isOwnMessage) {
              // Remove optimistic messages with matching text
              filtered = prev.filter(m => {
                if (m.isOptimistic && m.message_text === messageText) {
                  console.log('🔄 Replacing optimistic message with real one');
                  return false; // Remove optimistic message
                }
                return true;
              });
            }
            
            // Check if message already exists (avoid duplicates)
            const exists = filtered.some(m => {
              const existingId = m.id || m._id;
              return existingId === messageId || 
                     existingId === message._id ||
                     (existingId && messageId && existingId.toString() === messageId.toString());
            });
            
            if (exists) {
              console.log('⚠️ Message already exists, skipping');
              return filtered;
            }
            
            console.log('✅ Adding new message to chat');
            return [...filtered, message];
          });
          
          // Auto-scroll to bottom when new message arrives
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        } else {
          console.log('⚠️ Message not for current partnership:', {
            messagePartnershipId,
            currentPartnershipId,
            selectedPartner
          });
        }
      };

      // Listen for messages list (response to fetch request)
      const handleMessagesList = (data: { partnershipId: string, messages: any[] }) => {
        if (selectedPartner?.partnership_id === data.partnershipId || 
            selectedPartner?.partnership_id?.toString() === data.partnershipId) {
          setMessages(data.messages || []);
          setLoadingMessages(false);
        }
      };

      // Listen for message sent confirmation (for sender)
      const handleMessageSent = (message: any) => {
        console.log('✅ Message sent confirmation received:', message);
        const messagePartnershipId = message.partnership_id || message.partnershipId;
        const currentPartnershipId = selectedPartner?.partnership_id || selectedPartner?.id;
        
        if (currentPartnershipId && 
            (messagePartnershipId === currentPartnershipId || 
             messagePartnershipId?.toString() === currentPartnershipId?.toString())) {
          
          setMessages(prev => {
            const messageText = message.message_text || message.messageText || message.text || '';
            const messageId = message.id || message._id;
            
            // Remove optimistic message and replace with real one
            const filtered = prev.filter(m => {
              // Remove optimistic messages with matching text
              if (m.isOptimistic && m.message_text === messageText) {
                console.log('🔄 Replacing optimistic message with confirmed message');
                // Clear timeout for this optimistic message
                const timeout = optimisticTimeoutsRef.current.get(m.id);
                if (timeout) {
                  clearTimeout(timeout);
                  optimisticTimeoutsRef.current.delete(m.id);
                }
                return false;
              }
              // Remove duplicates
              const existingId = m.id || m._id;
              if (existingId && messageId) {
                if (existingId.toString() === messageId.toString()) {
                  return false;
                }
              }
              return true;
            });
            
            // Check if message already exists
            const exists = filtered.some(m => {
              const existingId = m.id || m._id;
              return existingId && messageId && existingId.toString() === messageId.toString();
            });
            
            if (!exists) {
              console.log('✅ Adding confirmed message to chat');
              return [...filtered, message];
            }
            
            console.log('⚠️ Message already exists, skipping');
            return filtered;
          });
          
          // Auto-scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      };

      // Listen for message send errors
      const handleMessageError = (error: any) => {
        console.error('❌ Message send error:', error);
        const currentPartnershipId = selectedPartner?.partnership_id || selectedPartner?.id;
        
        if (error.partnershipId === currentPartnershipId || 
            error.partnershipId?.toString() === currentPartnershipId?.toString()) {
          // Remove optimistic message on error
          setMessages(prev => {
            // Remove the most recent optimistic message
            const optimisticMessages = prev.filter(m => m.isOptimistic);
            if (optimisticMessages.length > 0) {
              const lastOptimistic = optimisticMessages[optimisticMessages.length - 1];
              return prev.filter(m => m.id !== lastOptimistic.id);
            }
            return prev;
          });
          toast.error(error.error || 'Failed to send message');
        }
      };

      socketManager.onMessage(handleIncomingMessage);
      socket.on('messages:list', handleMessagesList);
      socket.on('message:sent', handleMessageSent);
      socket.on('message:error', handleMessageError);

      return () => {
        socketManager.offMessage(handleIncomingMessage);
        socket.off('messages:list', handleMessagesList);
        socket.off('message:sent', handleMessageSent);
        socket.off('message:error', handleMessageError);
      };
    }
  }, [selectedPartner?.partnership_id, currentUserId]);
  
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
          <TabsList className="grid w-full grid-cols-4">
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
            {/* <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger> */}
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
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-primary to-accent-green flex items-center justify-center">
                      {profilePicture ? (
                        <img 
                          key={profilePicture.substring(0, 50)} 
                          src={profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading profile picture:', e);
                            setProfilePicture(null);
                          }}
                        />
                      ) : (
                        <User className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <label className="border-2 border-dashed border-border rounded-lg p-8 flex-1 flex flex-col items-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 5MB)</p>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="max-w-md" 
                    disabled={loadingProfile || isUpdatingProfile}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex items-center gap-2 max-w-md">
                    <Input 
                      value={email}
                      readOnly 
                      className="flex-1" 
                      disabled={loadingProfile || isUpdatingProfile}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowChangeEmailDialog(true)}
                      disabled={loadingProfile || isUpdatingProfile}
                    >
                      Change
                    </Button>
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
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleUpdateProfile}
                    disabled={loadingProfile || isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ReferralCodeCard />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] min-h-[500px] sm:min-h-[600px] flex flex-col">
              <CardHeader className="border-b flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Partner Messages
                </CardTitle>
                <p className="text-sm text-muted-foreground">Message your active partners</p>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                <div className={`grid h-full ${selectedPartner ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} flex-1 overflow-hidden`}>
                  {/* Partner List */}
                  <div className={`${selectedPartner ? 'hidden md:flex' : 'flex'} md:col-span-1 flex-col border-r border-border bg-muted/30 overflow-hidden`}>
                    <div className="p-4 border-b border-border flex-shrink-0">
                      <h3 className="font-semibold text-sm">Conversations</h3>
                    </div>
                    <ScrollArea className="flex-1">
                      {loadingConversations ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                          </div>
                          <p className="text-sm mt-4">Loading conversations...</p>
                        </div>
                      ) : activePartnerships.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="text-sm font-medium mb-1">No active partnerships</p>
                          <p className="text-xs">Start a partnership to begin messaging</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {activePartnerships.map((partner) => {
                            const isSelected = selectedPartner?.partnership_id === partner.partnership_id || 
                                             selectedPartner?.id === partner.id;
                            return (
                              <div
                                key={partner.id || partner.partnership_id}
                                onClick={() => handleSelectPartner(partner)}
                                className={`p-4 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-primary/10 border-l-2 border-l-primary'
                                    : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm truncate">{partner.partner_name || 'Partner'}</p>
                                      {partner.unread_count > 0 && (
                                        <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full">
                                          {partner.unread_count}
                                        </Badge>
                                      )}
                                    </div>
                                    {partner.last_message && (
                                      <p className="text-xs text-muted-foreground truncate mb-1">
                                        {partner.last_message}
                                      </p>
                                    )}
                                    {partner.last_message_time && (
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(partner.last_message_time).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Conversation Area */}
                  <div className={`${selectedPartner ? 'flex' : 'hidden md:flex'} md:col-span-2 flex-col h-full overflow-hidden`}>
                    {!selectedPartner ? (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
                        <div className="text-center max-w-sm px-4">
                          <MessageSquare className="h-20 w-20 mx-auto mb-4 opacity-30" />
                          <p className="text-base font-medium mb-2">Select a partner to start messaging</p>
                          <p className="text-sm">Choose a conversation from the list to view and send messages</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Conversation Header */}
                        <div className="border-b border-border p-3 sm:p-4 bg-background flex items-center justify-between flex-shrink-0">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            {/* Back button for mobile */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (selectedPartner?.partnership_id && socketManager.isConnected()) {
                                  socketManager.leavePartnership(selectedPartner.partnership_id);
                                }
                                setSelectedPartner(null);
                                setMessages([]);
                              }}
                              className="h-8 w-8 md:hidden flex-shrink-0"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{selectedPartner.partner_name || 'Partner'}</h3>
                              <p className="text-xs text-muted-foreground">Active Partnership</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (selectedPartner?.partnership_id && socketManager.isConnected()) {
                                socketManager.leavePartnership(selectedPartner.partnership_id);
                              }
                              setSelectedPartner(null);
                              setMessages([]);
                            }}
                            className="h-8 w-8 hidden md:flex flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-3 sm:p-4 bg-muted/10 min-h-0">
                          {loadingMessages ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <div className="animate-pulse space-y-3">
                                <div className="flex justify-start">
                                  <div className="h-12 bg-muted rounded-lg w-48"></div>
                                </div>
                                <div className="flex justify-end">
                                  <div className="h-12 bg-primary/20 rounded-lg w-48"></div>
                                </div>
                              </div>
                              <p className="text-sm mt-4">Loading messages...</p>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                              <p className="text-sm font-medium mb-1">No messages yet</p>
                              <p className="text-xs">Start the conversation by sending a message below</p>
                            </div>
                          ) : (
                            <div className="space-y-3" ref={messagesContainerRef}>
                              {messages
                                .sort((a, b) => {
                                  const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
                                  const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
                                  return timeA - timeB;
                                })
                                .map((msg, index) => {
                                  const messageId = msg.id || msg._id || `msg-${index}`;
                                  const isOwnMessage = msg.sender_id === currentUserId || 
                                                     msg.sender?.id === currentUserId ||
                                                     (typeof msg.sender_id === 'object' && msg.sender_id?.toString() === currentUserId);
                                  const messageTime = msg.created_at || msg.createdAt || new Date();
                                  const messageText = msg.message_text || msg.messageText || msg.text || '';
                                  
                                  return (
                                    <div key={messageId} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg p-2.5 sm:p-3 shadow-sm ${
                                      isOwnMessage 
                                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                        : 'bg-background border border-border rounded-bl-sm'
                                    } ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                                        {!isOwnMessage && msg.sender?.fullName && (
                                          <p className="text-[10px] sm:text-xs font-medium mb-1 text-foreground/80">
                                            {msg.sender.fullName}
                                          </p>
                                        )}
                                        <p className={`text-xs sm:text-sm whitespace-pre-wrap break-words ${
                                          isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                                        }`}>
                                          {messageText}
                                        </p>
                                        <p className={`text-[10px] sm:text-xs mt-1 ${
                                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        }`}>
                                          {new Date(messageTime).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                          {msg.isOptimistic && ' • Sending...'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="border-t border-border p-3 sm:p-4 bg-background flex-shrink-0">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="flex-1 text-sm sm:text-base"
                              disabled={loadingMessages}
                            />
                            <Button 
                              onClick={handleSendMessage} 
                              disabled={!newMessage.trim() || loadingMessages}
                              className="shrink-0 h-10 w-10 sm:h-auto sm:w-auto sm:px-4"
                              size="icon"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
                            Press Enter to send, Shift+Enter for new line
                          </p>
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

          {/* Security Tab - Commented out */}
          {/*
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your active sessions</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Active Sessions</label>
                  <p className="text-sm text-muted-foreground">Where you're logged in</p>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">You are currently logged in</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active now</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground text-center py-4">
                    Session management coming soon
                  </div>
                </div>

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
          */}

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
                      <Switch 
                        checked={notificationPreferences.campaignUpdates?.inApp ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('campaignUpdates', 'inApp', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch 
                        checked={notificationPreferences.campaignUpdates?.email ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('campaignUpdates', 'email', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Alerts */}
                {/* <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get alerts for logins from new devices or locations</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In-App</span>
                      <Switch 
                        checked={notificationPreferences.securityAlerts?.inApp ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('securityAlerts', 'inApp', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch 
                        checked={notificationPreferences.securityAlerts?.email ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('securityAlerts', 'email', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                  </div>
                </div> */}

                {/* Monthly Insights */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Monthly Insights</h3>
                    <p className="text-sm text-muted-foreground">Monthly performance and insight updates</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In-App</span>
                      <Switch 
                        checked={notificationPreferences.monthlyInsights?.inApp ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('monthlyInsights', 'inApp', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch 
                        checked={notificationPreferences.monthlyInsights?.email ?? true}
                        onCheckedChange={(checked) => updateNotificationPreference('monthlyInsights', 'email', checked)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      />
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                {/* <div className="border-t pt-6">
                  <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                    <h3 className="font-medium">Stay in the loop with Media Street Minute</h3>
                    <p className="text-sm text-muted-foreground">A quick weekly rundown of all the latest industry trends along with exciting Media Street updates and offers.</p>
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Subscribe to updates</label>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => updateNotificationPreference('newsletter', '', !notificationPreferences.newsletter)}
                        disabled={loadingNotificationPrefs || savingNotificationPrefs}
                      >
                        {notificationPreferences.newsletter ? 'Unsubscribe' : 'Subscribe'}
                      </Button>
                    </div>
                  </div>
                </div> */}
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

      {/* Change Email Dialog */}
      <Dialog open={showChangeEmailDialog} onOpenChange={setShowChangeEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. You'll need to verify it before the change takes effect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Email Address</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangeEmailDialog(false);
                  setNewEmail("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleChangeEmail} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? "Changing..." : "Change Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
