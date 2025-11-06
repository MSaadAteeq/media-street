import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";

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
      // First get the offer to verify it exists
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('id')
        .eq('redemption_code_prefix', offerCode)
        .eq('is_active', true)
        .maybeSingle();

      if (offerError || !offerData) {
        setStatus('error');
        setMessage('Offer not found or inactive');
        return;
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/redeem/${offerCode}/confirm?code=${redemptionCode}`);
        return;
      }

      // Call the redemption function
      const { data, error } = await supabase.functions.invoke('log-redemption', {
        body: {
          redemption_code: redemptionCode,
          offer_id: offerData.id
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus('success');
      setMessage(`Successfully redeemed! ${data.points_awarded || 0} points awarded.`);

      // Redirect back to main redeem page after 2 seconds
      setTimeout(() => {
        navigate(`/redeem/${offerCode}`);
      }, 2000);

    } catch (error: any) {
      console.error("Auto-redemption error:", error);
      setStatus('error');
      setMessage(error.message || 'Failed to redeem coupon');
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
