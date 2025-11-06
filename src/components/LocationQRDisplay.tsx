import { useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import mediaStreetLogo from "@/assets/media-street-logo.png";
import { Download, Mail, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LocationQRDisplayProps {
  locationId: string;
  locationName: string;
  locationAddress: string;
  onEmailSent?: () => void;
}

const LocationQRDisplay = ({ locationId, locationName, locationAddress, onEmailSent }: LocationQRDisplayProps) => {
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRequestingSticker, setIsRequestingSticker] = useState(false);
  const carouselUrl = `${window.location.origin}/carousel/${locationId}`;

  const generateQRDataUrl = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const svg = document.querySelector('.qr-code-svg') as SVGElement;
      if (!svg) {
        resolve('');
        return;
      }

      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 1200);

      // Load and draw logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = mediaStreetLogo;
      
      logo.onload = () => {
        // Draw logo
        ctx.drawImage(logo, 275, 50, 250, 100);

        // Draw headline
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Partner Offers', 400, 200);
        ctx.fillText(locationName, 400, 240);

        // Draw subtitle
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        const subtitle = `Scan to discover special deals and discounts from ${locationName}`;
        ctx.fillText(subtitle, 400, 280);
        ctx.fillText('partners. You get a great deal and we get the credit for referring you!', 400, 305);

        // Draw white background for QR code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(175, 340, 450, 450);

        // Draw QR code SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const qrImg = new Image();

        qrImg.onload = () => {
          ctx.drawImage(qrImg, 200, 365, 400, 400);

          // Draw instructions
          ctx.fillStyle = '#ffffff';
          ctx.font = '18px system-ui, -apple-system, sans-serif';
          ctx.fillText('📱 Open your camera and point at the QR code', 400, 840);
          
          ctx.fillStyle = '#a0a0a0';
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillText('No app needed • Instant access to offers', 400, 870);

          // Get final data URL
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        };

        qrImg.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('');
        };

        qrImg.src = url;
      };

      logo.onerror = () => {
        resolve('');
      };
    });
  };

  const handleDownload = async () => {
    const dataUrl = await generateQRDataUrl();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${locationName.replace(/\s+/g, '_')}_QR.png`;
    link.href = dataUrl;
    link.click();
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

      const { error } = await supabase.functions.invoke('send-location-qr', {
        body: {
          locationId,
          locationName,
          locationAddress,
          qrCodeDataUrl: dataUrl,
          requestSticker: false,
        },
      });

      if (error) throw error;

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

      const { error } = await supabase.functions.invoke('send-location-qr', {
        body: {
          locationId,
          locationName,
          locationAddress,
          qrCodeDataUrl: dataUrl,
          requestSticker: true,
        },
      });

      if (error) throw error;

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
      {/* Fancy QR Ad Display */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 rounded-2xl p-8 shadow-elegant border border-primary/20">
        {/* Media Street Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src={mediaStreetLogo} 
            alt="Media Street" 
            className="h-16 w-auto"
          />
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Partner Offers
          </h2>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {locationName}
          </h3>
          <p className="text-muted-foreground text-sm">
            Scan to discover special deals and discounts from {locationName} partners. You get a great deal and we get the credit for referring you!
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl shadow-medium mx-auto w-fit mb-6">
          <QRCodeSVG 
            value={carouselUrl}
            size={256}
            level="H"
            className="qr-code-svg"
            includeMargin={true}
          />
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-foreground font-medium">
            📱 Open your camera and point at the QR code
          </p>
          <p className="text-xs text-muted-foreground">
            No app needed • Instant access to offers
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-secondary/5 rounded-full blur-xl" />
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 mt-6">
        {/* Download Option */}
        <button
          onClick={handleDownload}
          className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-left"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Download className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Download QR Code</h3>
              <p className="text-sm text-primary-foreground/80">
                Get a high-quality PNG file ready to print
              </p>
            </div>
          </div>
        </button>

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
      </div>
    </div>
  );
};

export default LocationQRDisplay;
