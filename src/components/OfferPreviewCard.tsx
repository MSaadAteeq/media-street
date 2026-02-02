import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, RefreshCw } from "lucide-react";
import mediaStreetLogo from "@/assets/media-street-logo-icon.png";

interface OfferPreviewCardProps {
  businessName: string;
  callToAction: string;
  offerImageUrl?: string | null;
  brandLogoUrl?: string | null;
  brandColors?: {
    primary: string;
    secondary: string;
  };
  onChangeImage?: () => void;
  isChangingImage?: boolean;
  showChangeImageButton?: boolean;
  redemptionStoreName?: string;
}

const OfferPreviewCard = ({
  businessName,
  callToAction,
  offerImageUrl,
  brandLogoUrl,
  brandColors = { primary: "#6366f1", secondary: "#4f46e5" },
  onChangeImage,
  isChangingImage,
  showChangeImageButton = false,
  redemptionStoreName,
}: OfferPreviewCardProps) => {
  return (
    <Card className="overflow-hidden border-2 w-full max-w-2xl mx-auto rounded-2xl" style={{ borderColor: brandColors.primary }}>
      <CardContent className="p-0">
        {/* Top: Image with overlays - Bright Horizons style */}
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {offerImageUrl ? (
            <>
              <img 
                src={offerImageUrl} 
                alt="Offer" 
                className="w-full h-full object-cover object-center"
              />
              {/* Media Street pill - top left */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                <img src={mediaStreetLogo} alt="Media Street" className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-800">Partner offers by Media Street</span>
              </div>
              
              {/* QR Code - top right, white box */}
              <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-1 bg-white p-3 rounded-lg shadow-lg">
                <QRCodeSVG 
                  value="https://mediastreet.ai" 
                  size={80}
                  level="L"
                  bgColor="white"
                  fgColor="#111827"
                />
                <p className="text-gray-800 text-xs font-medium text-center max-w-[120px]">
                  Scan to redeem at {redemptionStoreName || businessName}
                </p>
              </div>
              
              {/* Tagline - lighter background, full width, flush with bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 rounded-t-lg z-10">
                <p className="text-white text-xl md:text-2xl font-bold text-left">
                  {callToAction}
                </p>
              </div>
              
              {showChangeImageButton && onChangeImage && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 left-4 gap-1.5 bg-white/80 hover:bg-white text-gray-800 border-0 shadow-lg backdrop-blur-sm z-20"
                  onClick={onChangeImage}
                  disabled={isChangingImage}
                >
                  {isChangingImage ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  Change Image
                </Button>
              )}
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`
              }}
            >
              <p className="text-white/80 text-sm">No image available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferPreviewCard;
