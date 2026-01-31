import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { get, post } from "@/services/apis";

const RedeemConfirm = () => {
  const { offerCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redemptionCode = searchParams.get('code');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!offerCode || !redemptionCode) {
      setStatus('error');
      setMessage('Invalid redemption link');
      return;
    }

    handleAutoRedeem();
  }, [offerCode, redemptionCode]);

  const handleAutoRedeem = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/redeem/${offerCode}/confirm?code=${redemptionCode}`);
        return;
      }

      // First get the offer to verify it exists and get location info
      const offerResponse = await get({
        end_point: `offers/${offerCode}`,
        token: false
      });

      if (!offerResponse.success || !offerResponse.data) {
        setStatus('error');
        setMessage('Offer not found or inactive');
        return;
      }

      const offerData = offerResponse.data;
      
      // Get location ID from offer (use first location)
      const locationId = offerData.locationIds?.[0]?._id || 
                        offerData.locationIds?.[0]?.toString() ||
                        offerData.locations?.[0]?._id ||
                        offerData.locations?.[0]?.toString() ||
                        null;

      if (!locationId) {
        setStatus('error');
        setMessage('Location not found for this offer');
        return;
      }

      // Redeem coupon using Node.js API - awards points correctly
      const response = await post({
        end_point: 'redemptions/redeem-coupon',
        body: {
          couponCode: redemptionCode,
          locationId: locationId
        },
        token: true
      });

      if (response.success) {
        setStatus('success');
        setMessage(`Successfully redeemed! Points have been awarded.`);
      } else {
        throw new Error(response.message || 'Failed to redeem coupon');
      }

      // Redirect back to main redeem page after 2 seconds
      setTimeout(() => {
        navigate(`/redeem/${offerCode}`);
      }, 2000);

    } catch (error: any) {
      console.error("Auto-redemption error:", error);
      setStatus('error');
      setMessage(error?.response?.data?.message || error.message || 'Failed to redeem coupon');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Redemption</h2>
            <p className="text-gray-600">Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Success!</h2>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Redemption Failed</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={() => navigate(`/redeem/${offerCode}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Back to Coupon
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedeemConfirm;
