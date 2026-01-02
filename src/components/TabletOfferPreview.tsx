import { QRCodeSVG } from "qrcode.react";
import { MapPin, Clock } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo-icon.png";
import { format, addDays } from "date-fns";

interface TabletOfferPreviewProps {
  offerId?: string;
  businessName: string;
  callToAction: string;
  offerImageUrl?: string | null;
  brandLogoUrl?: string | null;
  brandColors?: {
    primary: string;
    secondary: string;
  };
  referringStoreName?: string;
  referringStoreAddress?: string;
  redemptionStoreName?: string;
  redemptionStoreAddress?: string;
  expirationDate?: string;
  previewLabel?: string;
  hideMobileCoupon?: boolean;
}

const TabletOfferPreview = ({
  offerId,
  businessName,
  callToAction,
  offerImageUrl,
  brandLogoUrl,
  brandColors = { primary: "#6366f1", secondary: "#4f46e5" },
  referringStoreName,
  redemptionStoreName,
  expirationDate,
  previewLabel,
  hideMobileCoupon = false,
}: TabletOfferPreviewProps) => {
  
  // Generate QR code URL for the specific offer
  const offerRedemptionUrl = offerId 
    ? `${window.location.origin}/redeem?offer=${offerId}`
    : `${window.location.origin}/redeem`;
  
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const defaultExpirationDate = expirationDate || formatExpirationDate(
    addDays(new Date(), 7).toISOString()
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg">
      {previewLabel && (
        <div className="mb-4 text-center">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {previewLabel}
          </span>
        </div>
      )}
      
      {/* Tablet Display Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800" style={{ aspectRatio: '16/10' }}>
        <div className="h-full flex flex-col">
          {/* Header with Media Street Logo */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={mediaStreetLogo} 
                alt="Media Street" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-white font-semibold text-lg">Media Street</span>
            </div>
            {redemptionStoreName && (
              <div className="text-white/90 text-sm">
                <MapPin className="inline h-4 w-4 mr-1" />
                {redemptionStoreName}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side - Offer Image */}
            <div className="w-1/2 bg-gray-100 flex items-center justify-center p-4">
              {offerImageUrl ? (
                <img 
                  src={offerImageUrl} 
                  alt={businessName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div 
                  className="w-full h-full rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                  style={{ 
                    background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)` 
                  }}
                >
                  {businessName}
                </div>
              )}
            </div>

            {/* Right Side - Offer Details */}
            <div className="w-1/2 flex flex-col p-6 bg-white">
              {brandLogoUrl && (
                <div className="mb-4">
                  <img 
                    src={brandLogoUrl} 
                    alt={`${businessName} logo`}
                    className="h-12 object-contain"
                  />
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {businessName}
              </h2>
              
              <div 
                className="text-3xl font-extrabold mb-4"
                style={{ color: brandColors.primary }}
              >
                {callToAction}
              </div>

              {referringStoreName && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Referred by:</span> {referringStoreName}
                  </p>
                </div>
              )}

              <div className="mt-auto space-y-3">
                {!hideMobileCoupon && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Mobile Coupon</span>
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <QRCodeSVG 
                        value={offerRedemptionUrl}
                        size={80}
                        level="M"
                        includeMargin={false}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">
                          Scan to redeem at checkout
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires: {defaultExpirationDate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {redemptionStoreAddress && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{redemptionStoreAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabletOfferPreview;

