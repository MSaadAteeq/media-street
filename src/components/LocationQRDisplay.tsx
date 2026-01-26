import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from 'qrcode.react';
import mediaStreetLogoRounded from "@/assets/media-street-logo-rounded.png";
import { Download, Mail, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { post } from "@/services/apis";

interface LocationQRDisplayProps {
  locationId: string;
  locationName: string;
  locationAddress: string;
  onEmailSent?: () => void;
}

// Gradient colors - more pronounced transition
const PURPLE_TOP = '#8B5CF6';
const BLUE_BOTTOM = '#3B82F6';

const LocationQRDisplay = ({ locationId, locationName, locationAddress, onEmailSent }: LocationQRDisplayProps) => {
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRequestingSticker, setIsRequestingSticker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const carouselUrl = `${window.location.origin}/coupons/${locationId}`;

  const generateQRDataUrl = useCallback(async (type: 'transparent' | 'glossy' = 'glossy'): Promise<string> => {
    return new Promise((resolve) => {
      const qrCanvas = qrCanvasRef.current;
      if (!qrCanvas) {
        console.error('QR canvas not found');
        resolve('');
        return;
      }

      const canvas = document.createElement('canvas');
      // 6x8 inches at 300 DPI for print
      const width = 1800;
      const height = 2400;
      const cornerRadius = 60;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Canvas context not available');
        resolve('');
        return;
      }

      // Create rounded rectangle clipping path
      ctx.beginPath();
      ctx.moveTo(cornerRadius, 0);
      ctx.lineTo(width - cornerRadius, 0);
      ctx.quadraticCurveTo(width, 0, width, cornerRadius);
      ctx.lineTo(width, height - cornerRadius);
      ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
      ctx.lineTo(cornerRadius, height);
      ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
      ctx.lineTo(0, cornerRadius);
      ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
      ctx.closePath();
      ctx.clip();

      // Purple to blue gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, PURPLE_TOP);
      gradient.addColorStop(1, BLUE_BOTTOM);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // "Partner Offers" text - very large, black with white glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 236px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Partner Offers', 68, 225);
      
      // Reset shadow for other elements
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Store name - smaller, left aligned below, white (no glow)
      ctx.font = '81px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(locationName, 68, 340);
      
      // Draw white rounded rectangle behind QR code
      const qrSize = 945;
      const qrX = (width - qrSize) / 2;
      const qrY = 550;
      const padding = 68;
      const bgX = qrX - padding;
      const bgY = qrY - padding;
      const bgSize = qrSize + padding * 2;
      const borderRadius = 68;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(bgX + borderRadius, bgY);
      ctx.lineTo(bgX + bgSize - borderRadius, bgY);
      ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + borderRadius);
      ctx.lineTo(bgX + bgSize, bgY + bgSize - borderRadius);
      ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - borderRadius, bgY + bgSize);
      ctx.lineTo(bgX + borderRadius, bgY + bgSize);
      ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - borderRadius);
      ctx.lineTo(bgX, bgY + borderRadius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + borderRadius, bgY);
      ctx.closePath();
      ctx.fill();

      // Draw QR code (black on white)
      const srcSize = qrCanvas.width;
      ctx.drawImage(qrCanvas, 0, 0, srcSize, srcSize, qrX, qrY, qrSize, qrSize);

      // "Scan to discover exclusive nearby deals." subtitle - centered, below QR
      ctx.font = '63px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Scan to discover exclusive nearby deals.', width / 2, 1720);

      // Load and draw Media Street rounded logo at bottom center
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      logo.onload = () => {
        const logoSize = 180;
        const logoX = (width - logoSize) / 2;
        const logoY = 2040;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      logo.onerror = () => {
        // Draw fallback rounded "M" icon if logo fails
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect((width - 180) / 2, 2040, 180, 180, 36);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 108px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M', width / 2, 2160);
        
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      logo.src = mediaStreetLogoRounded;
    });
  }, [locationName, carouselUrl]);

  const handleDownload = async (type: 'transparent' | 'glossy') => {
    setIsDownloading(true);
    try {
      const dataUrl = await generateQRDataUrl(type);
      if (!dataUrl) {
        toast({
          title: "Download Failed",
          description: "Could not generate QR code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const suffix = type === 'transparent' ? '_Transparent' : '_Glossy';
      const link = document.createElement('a');
      link.download = `${locationName.replace(/\s+/g, '_')}_QR${suffix}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Your ${type} QR code sticker is being downloaded.`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailQR = async () => {
    setIsSendingEmail(true);
    try {
      const dataUrl = await generateQRDataUrl();
      if (!dataUrl) {
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
        return;
      }

      // Use Node.js API instead of Supabase function
      const response = await post({
        end_point: 'email/send-location-qr',
        body: {
          locationId,
          locationName,
          locationAddress,
          qrCodeDataUrl: dataUrl,
          requestSticker: false,
        },
        token: true
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send email');
      }

      toast({
        title: "Email Sent!",
        description: "Check your inbox for the QR code",
      });
      
      onEmailSent?.();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRequestSticker = async () => {
    setIsRequestingSticker(true);
    try {
      const dataUrl = await generateQRDataUrl();
      if (!dataUrl) {
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
        return;
      }

      // Use Node.js API instead of Supabase function
      const response = await post({
        end_point: 'email/send-location-qr',
        body: {
          locationId,
          locationName,
          locationAddress,
          qrCodeDataUrl: dataUrl,
          requestSticker: true,
        },
        token: true
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to request sticker');
      }

      toast({
        title: "Sticker Requested!",
        description: "We'll mail a glossy sticker to your store location",
      });
    } catch (error: any) {
      console.error('Error requesting sticker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request sticker",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSticker(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* QR Display - Purple to Blue Gradient Design */}
      <div className="rounded-2xl overflow-hidden shadow-elegant">
        {/* Gradient main section - more pronounced purple to blue */}
        <div className="bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] px-6 pt-6 pb-8">
          {/* Partner Offers - very large, black with white glow */}
          <h2 className="font-black text-black tracking-tighter text-left mb-1 whitespace-nowrap" style={{ fontSize: '3.75rem', textShadow: '0 0 20px rgba(255, 255, 255, 0.7), 0 0 40px rgba(255, 255, 255, 0.4)' }}>
            Partner Offers
          </h2>
          
          {/* Store name - white, no glow */}
          <p className="text-lg text-white text-left mb-8 mt-1">
            {locationName}
          </p>

          {/* QR Code - black on white with rounded corners */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeCanvas 
                ref={qrCanvasRef}
                value={carouselUrl}
                size={220}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Subtitle - below QR */}
          <p className="text-center text-white/90 text-sm mt-4 mb-6">
            Scan to discover exclusive nearby deals.
          </p>

          {/* Media Street Logo */}
          <div className="flex justify-center">
            <img 
              src={mediaStreetLogoRounded} 
              alt="Media Street" 
              className="h-14 w-14 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 mt-6">
        {/* Download Options */}
        <div className="grid grid-cols-2 gap-3">
          {/* Transparent Sticker */}
          <button
            onClick={() => handleDownload('transparent')}
            disabled={isDownloading}
            className="group relative overflow-hidden bg-card hover:bg-accent text-card-foreground rounded-xl p-5 border-2 border-dashed border-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-left disabled:opacity-50"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-muted p-3 rounded-lg">
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Transparent
                </h3>
                <p className="text-xs text-muted-foreground">
                  Clear background
                </p>
              </div>
            </div>
          </button>

          {/* Glossy Sticker */}
          <button
            onClick={() => handleDownload('glossy')}
            disabled={isDownloading}
            className="group relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-left disabled:opacity-50"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex flex-col items-center text-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Glossy
                </h3>
                <p className="text-xs text-primary-foreground/80">
                  Dark background
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isDownloading ? "Generating your sticker..." : "Choose a sticker style to download"}
        </p>

        {/* Email Option */}
        <button
          onClick={handleEmailQR}
          disabled={isSendingEmail}
          className="group relative overflow-hidden bg-card hover:bg-accent text-card-foreground rounded-xl p-6 border-2 border-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {isSendingEmail ? "Sending..." : "Email to Me"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Receive the QR code directly in your inbox
              </p>
            </div>
          </div>
        </button>

        {/* Sticker Option */}
        <button
          onClick={handleRequestSticker}
          disabled={isRequestingSticker}
          className="group relative overflow-hidden bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl p-6 border-2 border-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          {/* Free Badge */}
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            FREE
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {isRequestingSticker ? "Requesting..." : "Mail Glossy Sticker"}
              </h3>
              <p className="text-sm text-secondary-foreground/70">
                Professional sticker shipped to your location
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-4 bg-secondary/20 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">Print & Display:</span> Place this QR code at your checkout counter, entrance, or waiting area for maximum visibility
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You can place more than one up for more rewards!
        </p>
      </div>
    </div>
  );
};

export default LocationQRDisplay;
