import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// Supabase removed - will use Node.js API
import { Clock, Map, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import coffeeCampaign from "@/assets/pos-campaign-coffee.jpg";
import flowersCampaign from "@/assets/pos-campaign-flowers.jpg";
import salonCampaign from "@/assets/pos-campaign-salon.jpg";
import subsCampaign from "@/assets/pos-campaign-subs.jpg";

// Sample offers data (same as RecentOffers)
const sampleOffers: any = {
  "1": {
    id: "1",
    call_to_action: "Get 20% off your morning coffee! Show this offer at checkout.",
    redemption_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    offer_image_url: coffeeCampaign,
    brand_logo_url: null,
    location_id: "1"
  },
  "2": {
    id: "2",
    call_to_action: "Fresh flowers for any occasion - Buy 2 bouquets, get 1 free!",
    redemption_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    offer_image_url: flowersCampaign,
    brand_logo_url: null,
    location_id: "2"
  },
  "3": {
    id: "3",
    call_to_action: "New client special: $15 off your first haircut & style!",
    redemption_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    offer_image_url: salonCampaign,
    brand_logo_url: null,
    location_id: "3"
  },
  "4": {
    id: "4",
    call_to_action: "Lunch combo deal: Any sub + chips + drink for just $10!",
    redemption_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    offer_image_url: subsCampaign,
    brand_logo_url: null,
    location_id: "4"
  }
};

const sampleLocations: any = {
  "1": { id: "1", name: "Brew & Bean Coffee", address: "123 Main St, Portland, OR 97201" },
  "2": { id: "2", name: "Bloom & Petal Florist", address: "456 Park Ave, Seattle, WA 98101" },
  "3": { id: "3", name: "Luxe Hair Studio", address: "789 Broadway, San Francisco, CA 94102" },
  "4": { id: "4", name: "Sub Station Deli", address: "321 Oak St, Austin, TX 78701" }
};

const Redeem = () => {
  const { offerCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offer, setOffer] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
  }, [offerCode, searchParams]);

  const fetchOfferDetails = async () => {
    try {
      // Check if this is a sample offer from query parameter
      const offerIdFromQuery = searchParams.get('offer');
      
      if (offerIdFromQuery && sampleOffers[offerIdFromQuery]) {
        // Use sample offer data
        const sampleOffer = sampleOffers[offerIdFromQuery];
        const sampleLocation = sampleLocations[sampleOffer.location_id];
        
        setOffer(sampleOffer);
        setLocation(sampleLocation);
        
        // Generate unique redemption code
        const uniqueCode = `SAMPLE-${offerIdFromQuery}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        setRedemptionCode(uniqueCode);
        
        setLoading(false);
        return;
      }

      // Fetch offer by redemption_code_prefix
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('redemption_code_prefix', offerCode)
        .eq('is_active', true)
        .maybeSingle();

      if (offerError) throw offerError;

      if (!offerData) {
        toast({
          title: "Offer Not Found",
          description: "This offer may have expired or is no longer available.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setOffer(offerData);

      // Generate unique redemption code for tracking
      const uniqueCode = `${offerCode}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setRedemptionCode(uniqueCode);

      // Fetch location details
      const { data: locationData } = await supabase
        .from('locations')
        .select('*')
        .eq('id', offerData.location_id)
        .maybeSingle();

      if (locationData) {
        setLocation(locationData);
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

  const handleRedemption = async () => {
    if (!offer || isRedeemed || redeeming) return;

    setRedeeming(true);

    try {
      // For sample offers, just mark as redeemed without backend call
      if (redemptionCode.startsWith('SAMPLE-')) {
        setIsRedeemed(true);
        toast({
          title: "Demo Redemption",
          description: "This is a sample offer. Real offers will award points!",
        });
        setRedeeming(false);
        return;
      }

      // TODO: Replace with Node.js API call
      // const response = await post({ end_point: 'redemptions/log', body: { redemption_code: redemptionCode, offer_id: offer.id } });
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to redeem this offer.",
          variant: "destructive",
        });
        navigate(`/login?redirect=/redeem/${offerCode}`);
        return;
      }
      
      // Mock implementation
      // In real implementation, use response.data

      setIsRedeemed(true);
      toast({
        title: "Success!",
        description: "Coupon redeemed successfully! Points have been awarded.",
      });

    } catch (error: any) {
      console.error("Redemption error:", error);
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
          <div className="w-full bg-white rounded-[1.5rem] overflow-hidden">
            
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
                <h3 className="text-lg font-semibold text-gray-800">
                  {location?.name || "Store Location"}
                </h3>
              </div>
              
              {/* Offer Image */}
              {offer.offer_image_url && (
                <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={offer.offer_image_url} 
                    alt="Offer preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Offer Text */}
              <div className="text-center">
                <h4 className="font-bold text-lg text-black mb-2">
                  {offer.call_to_action}
                </h4>
              
                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-2 text-sm text-orange-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires on {formatExpirationDate(offer.redemption_end_date)}</span>
                </div>
                
                {/* Directions Link */}
                {location && (
                  <div className="flex justify-center mb-4">
                    <button 
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(location.address);
                        window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Map className="h-4 w-4" />
                      <span>Directions</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Retailer Redemption Section */}
              <div className="border-t border-gray-200 pt-4">
                {isRedeemed ? (
                  <div className="bg-green-50 p-6 rounded-lg text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-green-800 mb-1">Redeemed!</p>
                    <p className="text-sm text-green-600">This coupon has been used</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700 text-center mb-3">
                      For cashier to redeem:
                    </p>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-lg font-bold font-mono text-gray-800 mb-3 tracking-wider">
                      {redemptionCode}
                    </p>
                    <div className="bg-white p-3 rounded-lg inline-block mb-2">
                      <QRCodeSVG 
                        value={`${window.location.origin}/redeem/confirm?code=${redemptionCode}`}
                        size={100}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Type code or scan QR to redeem</p>
                      <p className="text-lg font-bold font-mono text-gray-800 mb-3 tracking-wider">
                      {redemptionCode}
                    </p>
                    <div className="bg-white p-3 rounded-lg inline-block mb-2">
                      <QRCodeSVG 
                        value={`${window.location.origin}/redeem/confirm?code=${redemptionCode}`}
                        size={100}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Type code or scan QR to redeem</p>
                      
                      {/* Manual Redeem Button for Testing */}
                      <button
                        onClick={handleRedemption}
                        disabled={redeeming}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {redeeming ? "Redeeming..." : "Redeem Now"}
                      </button>
                    </div>
                    
                    {/* Website Instructions */}
                    <div className="text-center mt-4 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Powered by <span className="font-medium text-purple-600">mediastreet.ai</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Redeem;
