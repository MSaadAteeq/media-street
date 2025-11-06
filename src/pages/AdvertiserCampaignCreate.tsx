import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Upload, Zap, MapPin, CreditCard, ExternalLink, Clock, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from 'qrcode.react';
import RetailerSelectionMap from "@/components/RetailerSelectionMap";
import mediaStreetIcon from "@/assets/media-street-logo-icon.png";
import { addMonths, format } from "date-fns";
interface Partner {
  id: string;
  business_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  partnership_status: string;
  partner_count: number;
}
interface SelectedRetailer {
  retailer_user_id: string;
  location_id: string;
  business_name: string;
  location_name: string;
  is_default_fallback?: boolean;
}
const AdvertiserCampaignCreate = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Step 1: Campaign Details
  const [campaignName, setCampaignName] = useState("");
  const [website, setWebsite] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [campaignImage, setCampaignImage] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState(() => {
    const oneMonthFromNow = addMonths(new Date(), 1);
    return format(oneMonthFromNow, "yyyy-MM-dd");
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [campaignType, setCampaignType] = useState<"online" | "store">("online");
  const [storeAddress, setStoreAddress] = useState("");

  // Step 2: Target Retailers
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedRetailers, setSelectedRetailers] = useState<SelectedRetailer[]>([]);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  // Step 3: Payment
  const weeklyCostPerStore = 10;
  const totalWeeklyCost = selectedRetailers.length * weeklyCostPerStore;

  // Generate unique redemption code on mount
  useEffect(() => {
    const code = Math.random().toString(36).substr(2, 9).toUpperCase();
    setRedemptionCode(code);
  }, []);
  // Fetch partners when on step 2 or when expiration date changes
  useEffect(() => {
    if (currentStep === 2) {
      fetchPartners();
    }
  }, [currentStep, expirationDate]);
  const fetchPartners = async () => {
    setLoading(true);
    try {
      // Fetch all active retail locations
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select(`
          id,
          name,
          address,
          latitude,
          longitude,
          user_id,
          profiles!inner(business_name)
        `);

      if (locationsError) throw locationsError;

      // Fetch active campaigns to check which locations are booked
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("advertiser_campaigns" as any)
        .select(`
          id,
          start_date,
          end_date,
          status,
          campaign_locations!inner(location_id)
        `)
        .eq('status', 'active');

      if (campaignsError) {
        console.warn("Could not fetch campaign data:", campaignsError);
      }

      // Create a set of location IDs that have active campaigns
      const bookedLocationIds = new Set<string>();
      
      if (campaignsData) {
        const ourStartDate = new Date();
        const ourEndDate = expirationDate ? new Date(expirationDate) : null;

        campaignsData.forEach((campaign: any) => {
          const campaignStart = new Date(campaign.start_date);
          const campaignEnd = campaign.end_date ? new Date(campaign.end_date) : null;

          // Check if campaign overlaps with our potential date range
          const hasOverlap = !campaignEnd || // No end date means indefinite booking
            !ourEndDate || // If we have no end date, assume overlap
            (campaignStart <= ourEndDate && (!campaignEnd || campaignEnd >= ourStartDate));

          if (hasOverlap && campaign.campaign_locations) {
            campaign.campaign_locations.forEach((cl: any) => {
              bookedLocationIds.add(cl.location_id);
            });
          }
        });
      }

      // Filter out booked locations
      const availableLocations = (locationsData || []).filter(
        (loc: any) => !bookedLocationIds.has(loc.id)
      );

      const formattedPartners: Partner[] = availableLocations.map((loc: any) => ({
        id: loc.id,
        business_name: loc.profiles?.business_name || "Unknown Business",
        location_name: loc.name,
        latitude: loc.latitude || 0,
        longitude: loc.longitude || 0,
        partnership_status: "available",
        partner_count: 0,
        user_id: loc.user_id
      }));

      setPartners(formattedPartners);

      if (formattedPartners.length === 0) {
        toast({
          title: "No Available Locations",
          description: "All retail locations are currently booked for this time period. Please try a different date range.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast({
        title: "Error",
        description: "Failed to load retail locations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGenerateCampaign = async () => {
    if (!website) {
      toast({
        title: "Website Required",
        description: "Please enter your website URL",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-offer-from-website', {
        body: {
          website
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.callToAction) {
        setCallToAction(data.callToAction);
      }
      if (data?.businessName && !campaignName) {
        setCampaignName(`${data.businessName} Campaign`);
      }
      if (data?.offerImageUrl) {
        const imageResponse = await fetch(data.offerImageUrl);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], 'campaign-image.png', {
          type: imageBlob.type || 'image/png'
        });
        setCampaignImage(imageFile);
      }
      toast({
        title: "Success",
        description: "AI generated your campaign!"
      });
    } catch (error) {
      console.error("Error generating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to generate campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const handleFileUpload = (file: File) => {
    setCampaignImage(file);
  };
  const handleRetailerToggle = (partner: Partner) => {
    const exists = selectedRetailers.find(r => r.retailer_user_id === (partner as any).user_id && r.location_id === partner.id);
    if (exists) {
      setSelectedRetailers(prev => prev.filter(r => !(r.retailer_user_id === (partner as any).user_id && r.location_id === partner.id)));
    } else {
      setSelectedRetailers(prev => [...prev, {
        retailer_user_id: (partner as any).user_id,
        location_id: partner.id,
        business_name: partner.business_name,
        location_name: partner.location_name,
        is_default_fallback: false
      }]);
    }
  };
  const handleDefaultFallbackToggle = (locationId: string) => {
    setSelectedRetailers(prev => prev.map(r => r.location_id === locationId ? {
      ...r,
      is_default_fallback: !r.is_default_fallback
    } : r));
  };
  const handlePayment = async () => {
    if (selectedRetailers.length === 0) {
      toast({
        title: "No Retailers Selected",
        description: "Please select at least one retail location",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create campaigns",
          variant: "destructive"
        });
        return;
      }

      // Campaign will be created after successful payment via webhook
      const campaignData = {
        user_id: user.id,
        campaign_name: campaignName,
        call_to_action: callToAction,
        website: website,
        total_stores: selectedRetailers.length,
        weekly_cost: totalWeeklyCost
      };

      // Create Stripe checkout session
      const {
        data: paymentData,
        error: paymentError
      } = await supabase.functions.invoke('create-campaign-payment', {
        body: {
          campaign_data: campaignData,
          store_count: selectedRetailers.length,
          retailers: selectedRetailers
        }
      });
      if (paymentError) throw paymentError;
      if (paymentData?.url) {
        window.open(paymentData.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment in the new tab"
        });

        // Navigate back to dashboard after short delay
        setTimeout(() => {
          navigate('/advertiser/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const canProceedStep1 = campaignName && callToAction;
  const canProceedStep2 = selectedRetailers.length > 0;
  const filteredPartners = partners.filter(p => {
    if (filterLocation && !p.location_name.toLowerCase().includes(filterLocation.toLowerCase())) {
      return false;
    }
    if (filterChannel && !p.business_name.toLowerCase().includes(filterChannel.toLowerCase())) {
      return false;
    }
    return true;
  });
  return <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => currentStep === 1 ? navigate("/advertiser/dashboard") : setCurrentStep(currentStep - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Back to Dashboard" : "Previous Step"}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Campaign</h1>
              <p className="text-muted-foreground">
                Step {currentStep} of 3: {currentStep === 1 ? "Build Your Campaign" : currentStep === 2 ? "Target Retailers" : "Payment"}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-2">
            {[1, 2, 3].map(step => <div key={step} className={`h-2 w-20 rounded-full transition-colors ${step <= currentStep ? "bg-primary" : "bg-muted"}`} />)}
          </div>
        </div>

        {/* Step 1: Build Campaign */}
        {currentStep === 1 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Website URL with AI Generation */}
                <div className="space-y-2">
                  <Label htmlFor="website">Your Website URL</Label>
                  <p className="text-sm text-muted-foreground">
                    This link is where consumers will be directed when they see your ad
                  </p>
                  <div className="flex gap-2">
                    <Input id="website" placeholder="https://yourwebsite.com" value={website} onChange={e => setWebsite(e.target.value)} type="url" />
                    <Button onClick={handleGenerateCampaign} disabled={!website || isGenerating} className="shrink-0">
                      {isGenerating ? <>
                          <span className="animate-spin mr-2">⚡</span>
                          Generating...
                        </> : <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate
                        </>}
                    </Button>
                  </div>
                </div>

                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input id="campaignName" placeholder="Summer Sale 2024" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                </div>

                {/* Call to Action */}
                <div className="space-y-2">
                  <Label htmlFor="cta">Your Offer / Call to Action</Label>
                  <Input id="cta" placeholder="Get 20% off your first purchase!" value={callToAction} onChange={e => setCallToAction(e.target.value)} maxLength={60} />
                  <p className="text-xs text-muted-foreground">
                    {60 - callToAction.length} characters left
                  </p>
                </div>

                {/* Campaign Type */}
                <div className="space-y-2">
                  <Label>Is this ad intended to drive users online or to a store location?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="online" checked={campaignType === "online"} onChange={e => setCampaignType(e.target.value as "online" | "store")} className="w-4 h-4" />
                      <span>Online</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="store" checked={campaignType === "store"} onChange={e => setCampaignType(e.target.value as "online" | "store")} className="w-4 h-4" />
                      <span>Store Location</span>
                    </label>
                  </div>
                </div>

                {/* Store Address - Only show if store location is selected */}
                {campaignType === "store" && <div className="space-y-2">
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <Input id="storeAddress" placeholder="123 Main St, City, State ZIP" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                  </div>}

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                  <Input id="expiration" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                </div>

                {/* Campaign Image Upload */}
                <div className="space-y-2">
                  <Label>Campaign Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }} />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {campaignImage ? <div className="space-y-2">
                          <img src={URL.createObjectURL(campaignImage)} alt="Campaign" className="w-full h-48 object-cover mx-auto rounded" />
                          <p className="text-sm text-muted-foreground">{campaignImage.name}</p>
                        </div> : <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload campaign image
                          </p>
                        </>}
                    </label>
                  </div>
                </div>

                <Button onClick={() => setCurrentStep(2)} disabled={!canProceedStep1} className="w-full" size="lg">
                  Next: Target Retailers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Preview Card with Campaign and Mobile Coupon */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Preview</CardTitle>
                <p className="text-sm text-muted-foreground">How your ad will appear in retailers.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  {/* Background Image */}
                  {campaignImage ? <img src={URL.createObjectURL(campaignImage)} alt="Campaign" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-muted-foreground">Upload campaign image to preview</p>
                    </div>}

                  {/* Website Badge - Top Left */}
                  {website && <div className="absolute top-4 left-4">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                        {website.replace(/^https?:\/\//, '').split('/')[0]}
                      </div>
                    </div>}

                  {/* QR Code - Top Right */}
                  {website && <div className="absolute top-4 right-4">
                      <div className="bg-white p-2 rounded-lg shadow-lg">
                        <QRCodeSVG value={website} size={80} level="H" includeMargin={false} />
                      </div>
                    </div>}

                  {/* Main Content Overlay - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
                    {/* Call to Action */}
                    {callToAction && <h3 className="text-white text-2xl font-bold mb-3">
                        {callToAction}
                      </h3>}

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between">
                      {/* Expiration Date */}
                      {expirationDate && <div className="flex items-center gap-2 text-white/90">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            Expires {new Date(expirationDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                          </span>
                        </div>}

                      {/* Ads by Media Street Badge */}
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg ml-auto">
                        <img src={mediaStreetIcon} alt="Media Street" className="h-5 w-5" />
                        <span className="text-white text-sm font-medium">
                          ads by Media Street
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Coupon Preview - Positioned on the right */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Mobile Coupon Preview</h3>
                  <p className="text-sm text-muted-foreground mb-4">How your redemption coupon will appear to customers</p>
                  <div className="flex justify-end">
                    <div className="w-80 h-[700px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden relative">
                        
                        {/* iPhone Status Bar */}
                        <div className="bg-black text-white px-6 py-2 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                              <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
                            </div>
                            <span className="ml-2 font-medium">Verizon</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>9:41 AM</span>
                            <div className="w-6 h-3 border border-white rounded-sm">
                              <div className="w-4 h-2 bg-white rounded-sm m-0.5"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Coupon Content */}
                        <div className="p-4 space-y-4 pt-6">
                          {/* Partner Offer Information */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <img src={mediaStreetIcon} alt="Media Street" className="w-5 h-5 rounded" />
                              <p className="text-sm font-semibold text-purple-800">Offers by Media Street</p>
                            </div>
                            {website && <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="font-medium">Visit</span>
                                <span className="text-purple-400">→</span>
                                <span className="font-medium">
                                  {website.replace(/^https?:\/\//, '').split('/')[0]}
                                </span>
                              </div>}
                          </div>

                          {/* Offer Image */}
                          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {campaignImage ? <img src={URL.createObjectURL(campaignImage)} alt="Campaign preview" className="w-full h-full object-contain" /> : <div className="text-gray-400 text-sm text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                Campaign Image
                              </div>}
                          </div>
                          
                          {/* Offer Text */}
                          <div className="text-center">
                            <h4 className="font-bold text-lg text-black mb-2">
                              {callToAction || "Your campaign offer text"}
                            </h4>
                          
                            {/* Expiry Timer */}
                            {expirationDate && <div className="flex items-center justify-center gap-2 text-sm text-orange-600 mb-2">
                                <Clock className="h-4 w-4" />
                                <span>Expires on {new Date(expirationDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                              </div>}
                            
                            {/* Website Link */}
                            {website && <div className="flex justify-center mb-4">
                                <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                  <ExternalLink className="h-4 w-4" />
                                  <span>Visit Website</span>
                                </a>
                              </div>}
                          </div>

                          {/* Store Location - Only show if campaign type is store */}
                          {campaignType === "store" && storeAddress && <>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Store Location</p>
                                    <p className="text-sm text-gray-700">{storeAddress}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Directions Link */}
                              <div className="flex justify-center">
                                <button onClick={() => {
                            const encodedAddress = encodeURIComponent(storeAddress);
                            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                          }} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                  <Map className="h-4 w-4" />
                                  <span>Directions</span>
                                </button>
                              </div>
                            </>}
                        
                          {/* Retailer Redemption Section - Only show if campaign type is store */}
                          {campaignType === "store" && <div className="border-t border-gray-200 pt-4">
                              <p className="text-sm font-semibold text-gray-700 text-center mb-3">
                                For cashier to redeem:
                              </p>
                              <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-lg font-bold font-mono text-gray-800 mb-3 tracking-wider">
                                  {redemptionCode}
                                </p>
                                <div className="bg-white p-3 rounded-lg inline-block mb-2">
                                  <QRCodeSVG value={`${window.location.origin}/redeem/${redemptionCode}`} size={100} level="H" includeMargin={true} />
                                </div>
                                <p className="text-xs text-gray-500">Type code or scan QR to redeem</p>
                              </div>
                            </div>}

                          {/* Footer */}
                          <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Powered by <span className="font-medium text-purple-600">mediastreet.ai</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>}

        {/* Step 2: Target Retailers */}
        {currentStep === 2 && <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Retail Locations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose retail stores where your campaign will be displayed
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Filter by Location</Label>
                    <Input placeholder="Search by city, state..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
                  </div>
                  <div>
                    <Label>Filter by Retail Channel</Label>
                    <Input placeholder="Search by business type..." value={filterChannel} onChange={e => setFilterChannel(e.target.value)} />
                  </div>
                </div>

                {/* Selected Count */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">Selected Stores: {selectedRetailers.length}</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly Cost: ${totalWeeklyCost.toFixed(2)}
                    </p>
                  </div>
                  {selectedRetailers.length > 0 && <Button variant="outline" onClick={() => setSelectedRetailers([])} size="sm">
                      Clear All
                    </Button>}
                </div>

                {/* Map for selecting individual retailers */}
                <div className="space-y-2">
                  <Label>Select Retailers on Map</Label>
                  <p className="text-sm text-muted-foreground">
                    Click on map markers to select individual retail locations.
                  </p>
                  <div className="border rounded-lg overflow-hidden h-96">
                    <RetailerSelectionMap 
                      retailers={filteredPartners} 
                      selectedRetailerIds={selectedRetailers.map(r => r.location_id)}
                      onRetailerSelect={(retailer) => {
                        const partner = filteredPartners.find(p => p.id === retailer.id);
                        if (partner) handleRetailerToggle(partner);
                      }}
                    />
                  </div>
                </div>

                {/* Retailer List */}
                {loading ? <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading locations...</p>
                    </div>
                  </div> : <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                    {filteredPartners.map(partner => <div key={partner.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{partner.business_name}</p>
                          <p className="text-sm text-muted-foreground">{partner.location_name}</p>
                        </div>
                        <Button variant={selectedRetailers.find(r => r.location_id === partner.id) ? "default" : "outline"} size="sm" onClick={() => handleRetailerToggle(partner)}>
                          {selectedRetailers.find(r => r.location_id === partner.id) ? "Selected" : "Select"}
                        </Button>
                      </div>)}
                  </div>}

                {/* Selected Retailers List */}
                {selectedRetailers.length > 0 && <div className="space-y-2">
                    <Label>Selected Retailers</Label>
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {selectedRetailers.map((retailer, idx) => <div key={idx} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{retailer.business_name}</p>
                              <p className="text-sm text-muted-foreground">{retailer.location_name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedRetailers(prev => prev.filter(r => !(r.retailer_user_id === retailer.retailer_user_id && r.location_id === retailer.location_id)));
                    }}>
                              Remove
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 ml-1">
                            <input type="checkbox" id={`default-${idx}`} checked={retailer.is_default_fallback || false} onChange={() => handleDefaultFallbackToggle(retailer.location_id)} className="rounded border-border" />
                            <label htmlFor={`default-${idx}`} className="text-sm text-muted-foreground cursor-pointer">
                              Show as default when no partner offers available
                            </label>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                <Button onClick={() => setCurrentStep(3)} disabled={!canProceedStep2} className="w-full" size="lg">
                  Next: Payment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>}

        {/* Step 3: Payment */}
        {currentStep === 3 && <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Review & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Summary */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Campaign Name</Label>
                    <p className="font-semibold">{campaignName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Offer</Label>
                    <p className="font-semibold">{callToAction}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Number of Stores</Label>
                    <p className="font-semibold">{selectedRetailers.length} locations</p>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="border rounded-lg p-6 space-y-4 bg-muted/50">
                  <h3 className="font-semibold text-lg">Pricing Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost per store</span>
                      <span className="font-medium">${weeklyCostPerStore}/week</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number of stores</span>
                      <span className="font-medium">{selectedRetailers.length}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total Weekly Cost</span>
                      <span className="text-primary">${totalWeeklyCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You will be charged ${totalWeeklyCost.toFixed(2)} per week for this campaign.
                    Cancel anytime from your dashboard.
                  </p>
                </div>

                <Button onClick={handlePayment} disabled={loading} className="w-full" size="lg">
                  {loading ? <>
                      <span className="animate-spin mr-2">⚡</span>
                      Processing...
                    </> : <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Payment
                    </>}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secured by Stripe. Your campaign will go live after successful payment.
                </p>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
};
export default AdvertiserCampaignCreate;