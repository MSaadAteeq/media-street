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

        {/* Offer Image with Overlay */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {offerImageUrl ? (
            <>
              <img 
                src={offerImageUrl} 
                alt="Offer" 
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
              
              {/* Business Name Overlay on Left */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 max-w-[50%]">
                <h2 className="text-white font-serif text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-2xl leading-tight">
                  {businessName.toUpperCase()}
                </h2>
              </div>
              
              {/* QR Code Overlay on Top Right */}
              <div className="absolute right-4 top-4 z-10 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-lg shadow-xl">
                <QRCodeSVG 
                  value="https://mediastreet.ai" 
                  size={100}
                  level="L"
                  bgColor="transparent"
                  fgColor="white"
                />
                <p className="text-white text-xs font-medium text-center max-w-[140px]">
                  Scan to redeem at {redemptionStoreName || businessName}
                </p>
              </div>
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
          
          {showChangeImageButton && onChangeImage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 gap-1.5 bg-black/60 hover:bg-black/80 text-white border-0 shadow-lg backdrop-blur-sm"
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
        </div>

        {/* Call to Action at Bottom */}
        <div 
          className="p-4 text-center"
          style={{ 
            backgroundColor: brandColors.primary || '#6366f1',
            background: `linear-gradient(135deg, ${brandColors.primary || '#6366f1'}, ${brandColors.secondary || '#4f46e5'})`
          }}
        >
          <p className="text-white font-bold text-lg leading-tight">
            {callToAction}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferPreviewCard;
