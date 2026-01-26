import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Map, CheckCircle, Camera, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import mediaStreetLogo from "@/assets/media-street-logo.png";
import { get, post } from "@/services/apis";

// Note: html2canvas is loaded dynamically to avoid Vite static analysis issues

const Redeem = () => {
  const { offerCode, locationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offer, setOffer] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  const couponCardRef = useRef<HTMLDivElement>(null);
  const [qrLocationId, setQrLocationId] = useState<string | null>(locationId || null);

  useEffect(() => {
    // If locationId is present in URL (from old QR codes), redirect to carousel
    if (locationId) {
      navigate(`/carousel/${locationId}`, { replace: true });
      return;
    }
    fetchOfferDetails();
  }, [offerCode, locationId, searchParams, navigate]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);

      // Fetch offer by ID or redemption code (offerCode can be either)
      let offerResponse;
      
      // First, try to fetch by offer ID (if it's a valid ObjectId)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(offerCode || '');
      if (isValidObjectId) {
        offerResponse = await get({ 
          end_point: `offers/${offerCode}`,
          token: false // Public endpoint
        });
      }
      
      // If not found by ID, try to find by redemption code
      if (!offerResponse || !offerResponse.success || !offerResponse.data) {
        try {
          offerResponse = await get({ 
            end_point: `offers/redemption-code/${offerCode}`,
            token: false // Public endpoint
          });
        } catch (error) {
          console.error('Error fetching offer by redemption code:', error);
        }
      }

      if (!offerResponse || !offerResponse.success || !offerResponse.data) {
        toast({
          title: "Offer Not Found",
          description: "This offer may have expired or is no longer available.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const offerData = offerResponse.data;
      setOffer(offerData);

      // Get location from offer data
      if (offerData.locations && offerData.locations.length > 0) {
        setLocation(offerData.locations[0]);
      } else if (offerData.locationIds && offerData.locationIds.length > 0) {
        if (Array.isArray(offerData.locationIds) && offerData.locationIds.length > 0) {
          const firstLoc = offerData.locationIds[0];
          if (firstLoc && typeof firstLoc === 'object') {
            setLocation(firstLoc);
          }
        }
      }

      // Generate or fetch coupon code by creating a redemption (public endpoint)
      try {
        const redemptionResponse = await post({
          end_point: 'redemptions/public',
          body: {
            offerId: offerCode,
            redemptionCode: offerData.redemptionCode || offerData.redemption_code || 'SCAN',
            locationId: qrLocationId || locationId
          },
          token: false // Public endpoint
        });

        if (redemptionResponse.success && redemptionResponse.data) {
          const coupon = redemptionResponse.data.couponCode || redemptionResponse.data.coupon_code;
          if (coupon) {
            setCouponCode(coupon);
            setRedemptionCode(redemptionResponse.data.redemptionCode || redemptionResponse.data.redemption_code || coupon);
          }
        } else {
          // Generate a temporary code if API fails
          const tempCode = Math.random().toString(36).substr(2, 10).toUpperCase();
          setRedemptionCode(tempCode);
        }
      } catch (error: any) {
        console.error('Error generating coupon code:', error);
        // Generate a temporary code if API fails
        const tempCode = Math.random().toString(36).substr(2, 10).toUpperCase();
        setRedemptionCode(tempCode);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching offer:", error);
      toast({
        title: "Error",
        description: "Failed to load offer details.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const loadHtml2CanvasFromCDN = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).html2canvas) {
        resolve((window as any).html2canvas);
        return;
      }

      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => {
        if ((window as any).html2canvas) {
          resolve((window as any).html2canvas);
        } else {
          reject(new Error('html2canvas failed to load from CDN'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas script'));
      };
      document.head.appendChild(script);
    });
  };

  const handleScreenshot = async () => {
    if (!couponCardRef.current) return;
    
    try {
      // Load html2canvas from CDN to avoid Vite import issues
      let html2canvas: any;
      try {
        html2canvas = await loadHtml2CanvasFromCDN();
      } catch (loadError) {
        console.error('Failed to load html2canvas:', loadError);
        toast({
          title: "Screenshot Unavailable",
          description: "Screenshot feature is not available. Please use your device's screenshot function.",
          variant: "destructive",
        });
        return;
      }
      
      const canvas = await html2canvas(couponCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // Add Media Street logo watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = mediaStreetLogo;
        
        await new Promise<void>((resolve) => {
          logo.onload = () => {
            const logoWidth = 80;
            const logoHeight = (logo.height / logo.width) * logoWidth;
            const padding = 12;
            ctx.drawImage(
              logo,
              canvas.width - logoWidth - padding,
              canvas.height - logoHeight - padding,
              logoWidth,
              logoHeight
            );
            resolve();
          };
          logo.onerror = () => {
            console.log('Logo failed to load');
            resolve();
          };
        });
      }
      
      // Convert canvas to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `offer-${offer?.id || offer?._id || 'coupon'}-${Date.now()}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Screenshot Saved",
            description: "Your coupon has been saved as an image.",
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error("Screenshot error:", error);
      toast({
        title: "Error",
        description: "Failed to capture screenshot.",
        variant: "destructive",
      });
    }
  };

  const handleSendText = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber) || phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Send SMS via backend API
      const offerUrl = window.location.href;
      const response = await post({
        end_point: 'sms/send',
        body: {
          phoneNumber: phoneNumber.replace(/\D/g, ''), // Remove non-digits
          message: `Check out this offer: ${offerUrl}`,
          offerId: offer?.id || offer?._id
        },
        token: false // Public endpoint for SMS
      });

      if (response.success) {
        toast({
          title: "Text Sent!",
          description: `Coupon link sent to ${phoneNumber}`,
        });
        setShowTextDialog(false);
        setPhoneNumber("");
      } else {
        throw new Error(response.message || 'Failed to send text');
      }
    } catch (error: any) {
      console.error('SMS error:', error);
      // Fallback: Use SMS link if API fails
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const smsLink = `sms:${phoneDigits}?body=${encodeURIComponent(`Check out this offer: ${window.location.href}`)}`;
      window.location.href = smsLink;
      
      toast({
        title: "Opening SMS",
        description: `Opening your default SMS app to send the coupon link.`,
      });
      setShowTextDialog(false);
      setPhoneNumber("");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenInNewWindow = () => {
    window.open(window.location.href, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Offer Not Found</h1>
          <p className="text-gray-600">This offer may have expired or is no longer available.</p>
        </div>
      </div>
    );
  }

  // Get referring retailer name from URL params
  const refParam = searchParams.get('ref');
  const referrerParam = searchParams.get('referrer');
  const decodedRefParam = refParam ? decodeURIComponent(refParam) : null;
  
  // Determine referring retailer
  let referringRetailer = 'Media Street'; // Default
  if (decodedRefParam && decodedRefParam.toLowerCase() !== 'mediastreet') {
    referringRetailer = decodedRefParam;
  } else if (referrerParam) {
    referringRetailer = referrerParam;
  }

  // Calculate proper expiry date
  const getExpiryDate = () => {
    if (offer?.redemption_end_date) {
      const endDate = new Date(offer.redemption_end_date);
      if (!isNaN(endDate.getTime()) && endDate > new Date()) {
        return endDate;
      }
    }
    if (offer?.expires_at || offer?.expiresAt) {
      const endDate = new Date(offer.expires_at || offer.expiresAt);
      if (!isNaN(endDate.getTime()) && endDate > new Date()) {
        return endDate;
      }
    }
    // Default to 1 week from now
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  const expiryDate = getExpiryDate();
  const businessName = offer.business_name || offer.user?.fullName || offer.userId?.fullName || location?.name || 'Partner Store';
  const storeName = location?.name || businessName || "Store Location";

  // Check if this is an open offer (not a partner offer)
  const isOpenOffer = offer.is_open_offer === true || 
                     offer.isOpenOffer === true || 
                     offer.is_open_offer === 'true' ||
                     offer.isOpenOffer === 'true';

  // For open offers, only show if it has a coupon code and referrer is Media Street
  const referringRetailerLower = referringRetailer.toLowerCase();
  const isFromMediaStreet = referringRetailerLower === 'media street' || 
                            referringRetailerLower === 'mediastreet' ||
                            !refParam && !referrerParam; // If no referrer param, assume from Media Street
  
  // Check if offer has a valid coupon/redemption code
  const hasCouponCode = !!(redemptionCode || couponCode);

  // If it's an open offer but doesn't meet criteria, don't show it
  if (isOpenOffer && (!hasCouponCode || !isFromMediaStreet)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Offer Not Available</h1>
          <p className="text-gray-600">This open offer is not available for redemption.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header - Matching Carousel design */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={mediaStreetLogo} 
              alt="Media Street" 
              className="h-10 w-auto"
            />
            {location && (
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{location.name}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <Map className="h-3 w-3" />
                  {location.address.split(',')[1]?.trim() || location.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[calc(100vh-200px)] pb-24">
        <div className="w-full max-w-md">
          <div ref={couponCardRef} className="w-full bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            
            {/* Coupon Content */}
            <div className="p-4 space-y-4 pt-6">
              {/* Header - Only show "Partner offer" badge if it's NOT an open offer */}
              {!isOpenOffer && (
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                    <img src={mediaStreetLogo} alt="Media Street" className="h-5 w-5 object-contain" />
                    <span className="font-medium text-foreground">Partner offer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {referringRetailer} → <span className="font-medium text-foreground">{businessName}</span>
                  </p>
                </div>
              )}
              
              {/* For open offers, show simpler header */}
              {isOpenOffer && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {referringRetailer} → <span className="font-medium text-foreground">{businessName}</span>
                  </p>
                </div>
              )}
              
              {/* Store Location Name with Brand Logo */}
              <div className="text-center">
                {offer.brand_logo_url && (
                  <div className="flex justify-center mb-2">
                    <img 
                      src={offer.brand_logo_url} 
                      alt="Brand logo" 
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">
                  {storeName}
                </h3>
              </div>
              
              {/* Offer Image - Larger and more prominent */}
              {offer.offer_image_url && (
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden relative">
                  <img 
                    src={offer.offer_image_url} 
                    alt="Offer preview" 
                    className="w-full h-full object-cover"
                  />
                  {/* Badge overlay - green badge with brand name and code */}
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                    <div className="w-4 h-4 bg-white/20 rounded"></div>
                    <span className="text-sm font-semibold">{businessName}</span>
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">C{Math.floor(Math.random() * 100)}.{Math.floor(Math.random() * 100)}</span>
                  </div>
                </div>
              )}
              
              {/* Offer Text */}
              <div className="text-center">
                <h4 className="font-bold text-lg text-foreground mb-2">
                  {offer.call_to_action || offer.callToAction}
                </h4>
              
                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-2 text-sm text-orange-600 dark:text-orange-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires on {formatExpirationDate(expiryDate.toISOString())}</span>
                </div>
                
                {/* Directions Link */}
                {location?.address && (
                  <div className="flex justify-center mb-4">
                    <button 
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(location.address);
                        window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                      }}
                      className="flex items-center gap-1 text-primary hover:text-primary/80"
                    >
                      <Map className="h-4 w-4" />
                      <span>Directions</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Retailer Redemption Section */}
              <div className="border-t border-border pt-4">
                {isRedeemed ? (
                  <div className="bg-green-500/10 dark:bg-green-900/20 p-6 rounded-lg text-center border border-green-500/20">
                    <div className="flex justify-center mb-3">
                      <img src={mediaStreetLogo} alt="Media Street" className="h-10 object-contain" />
                    </div>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
                    <p className="text-xl font-bold text-foreground mb-1">Coupon Redeemed</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Successfully logged this redemption!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground text-center mb-3">
                      For cashier to redeem:
                    </p>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-lg font-bold font-mono text-foreground mb-3 tracking-wider">
                      {redemptionCode || couponCode || "------"}
                    </p>
                    <div className="bg-background p-3 rounded-lg inline-block mb-2 border border-border">
                      <QRCodeSVG 
                        value={`${window.location.origin}/redeem/${offer.id || offer._id}/confirm?code=${redemptionCode || couponCode}`}
                        size={100}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Retailer: type code above or scan QR to log this redemption</p>
                  </div>
                    
                    {/* Terms and Conditions */}
                    <div className="text-center mt-4 pt-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
                        *Limit one coupon per customer. Not valid with other offers. Valid and redeemable only when presented at a participating store location.
                      </p>
                    </div>
                    
                    {/* Website Instructions */}
                    <div className="text-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Powered by <span className="font-medium text-primary">mediastreet.ai</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed dark bar at bottom */}
      {!isRedeemed && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 flex gap-2 justify-center z-50 shadow-lg">
          <Button
            onClick={handleScreenshot}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Screenshot
          </Button>
          <Button
            onClick={() => setShowTextDialog(true)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Text Me
          </Button>
          <Button
            onClick={handleOpenInNewWindow}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>
      )}

      {/* Text Me Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Text Me This Offer</DialogTitle>
            <DialogDescription>
              Enter your phone number to receive a link to this offer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            />
            <Button
              onClick={handleSendText}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? "Sending..." : "Send Text"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer - Matching Carousel design */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Powered by <span className="font-semibold text-foreground">Media Street</span></p>
          <p className="text-xs">Connecting local businesses with their community</p>
        </div>
      </footer>
    </div>
  );
};

export default Redeem;
