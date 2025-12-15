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
    <Card className="overflow-hidden border-2 w-full max-w-2xl mx-auto" style={{ borderColor: brandColors.primary }}>
      <CardContent className="p-0">
        {/* Header with brand */}
        <div 
          className="p-3 flex items-center gap-3"
          style={{ backgroundColor: `${brandColors.primary}10` }}
        >
          {brandLogoUrl ? (
            <img 
              src={brandLogoUrl} 
              alt={businessName}
              className="w-10 h-10 rounded-lg object-contain bg-white p-1"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: brandColors.primary }}
            >
              {businessName.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">{businessName}</p>
            <p className="text-xs text-muted-foreground">Partner Offer</p>
          </div>
          <img src={mediaStreetLogo} alt="Media Street" className="w-6 h-6 opacity-50" />
        </div>

        {/* Offer Image */}
        <div className="relative aspect-[16/9] bg-muted">
          {offerImageUrl ? (
            <img 
              src={offerImageUrl} 
              alt="Offer" 
              className="w-full h-full object-cover"
            />
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
          
          {showChangeImageButton && onChangeImage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 gap-1"
              onClick={onChangeImage}
              disabled={isChangingImage}
            >
              {isChangingImage ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <ImagePlus className="h-3 w-3" />
              )}
              Change Image
            </Button>
          )}
        </div>

        {/* Call to Action */}
        <div 
          className="p-4 text-center"
          style={{ backgroundColor: brandColors.primary }}
        >
          <p className="text-white font-bold text-lg leading-tight">
            {callToAction}
          </p>
        </div>

        {/* QR Code placeholder */}
        <div className="p-3 flex items-center justify-center gap-3 bg-white">
          <QRCodeSVG 
            value="https://mediastreet.ai" 
            size={48}
            level="L"
          />
          <div className="text-xs text-muted-foreground text-center">
            <p className="font-medium">Scan here to redeem</p>
            <p>at {redemptionStoreName || businessName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferPreviewCard;
