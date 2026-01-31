import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, ArrowLeft, MapPin, Clock, QrCode as QrCodeIcon, Navigation, Map, ChevronDown, Zap, Check } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { useNavigate } from "react-router-dom";
// Supabase removed - will use Node.js API
import { useToast } from "@/hooks/use-toast";
import { get, post } from "@/services/apis";
import { generateOfferFromWebsite } from "@/services/generateOfferFromWebsite";
import mediaStreetLogoIcon from "@/assets/media-street-logo-icon.png";

interface Location {
  id: string;
  name: string;
  address: string;
  openOfferOnly?: boolean;
}

const OfferCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [website, setWebsite] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [aiGeneratedStoreName, setAiGeneratedStoreName] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [adImage, setAdImage] = useState<File | null>(null);
  const [expirationDuration, setExpirationDuration] = useState("1day");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Track if offer is being created
  const [isAiGenerated, setIsAiGenerated] = useState(false); // Track if image is AI-generated
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [brandColors, setBrandColors] = useState<{ primary: string; secondary: string } | null>(null);

  // Generate unique redemption code on mount
  useEffect(() => {
    const code = Math.random().toString(36).substr(2, 9).toUpperCase();
    setRedemptionCode(code);
  }, []);

  // Update canvas when offer text or image changes
  useEffect(() => {
    if (!canvasRef.current || !adImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      // Set canvas to 16:9 aspect ratio (standard for offer creatives)
      const targetWidth = 1280;
      const targetHeight = 720;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Calculate scaling to fit image within canvas while maintaining aspect ratio
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;
      
      // Draw the image centered and scaled
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Draw the text if it exists - positioned in top left area below logo
      if (callToAction) {
        // Calculate font size based on canvas width
        const fontSize = Math.max(32, targetWidth / 28);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw white text
        ctx.fillStyle = '#ffffff';
        
        // Word wrap the text
        const maxWidth = targetWidth * 0.6;
        const words = callToAction.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        
        // Position text to the right of where the logo overlay will be
        const lineHeight = fontSize * 1.3;
        const startX = 120; // Move right to make room for logo (was 40)
        const startY = 40; // Align with top area where logo is

        // Draw each line
        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), startX, startY + (index * lineHeight));
        });
      }

      // Generate QR code URL with location ID (use first selected location)
      // QR code should point to carousel for the location (if location selected)
      const locationId = selectedLocations.length > 0 ? selectedLocations[0] : '';
      const qrCodeUrl = locationId 
        ? `${window.location.origin}/carousel/${locationId}`
        : `${window.location.origin}/redeem/${redemptionCode}`;
      
      // Generate QR code and overlay it on top right
      try {
        // Create a temporary canvas for QR code
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = 200;
        qrCanvas.height = 200;
        const qrCtx = qrCanvas.getContext('2d');
        
        if (qrCtx) {
          // Draw white background for QR code
          qrCtx.fillStyle = '#ffffff';
          qrCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
          
          // Generate QR code using qrcode library
          await QRCode.toCanvas(qrCanvas, qrCodeUrl, {
            width: 180,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          // Draw QR code on main canvas at top right
          const qrSize = 180;
          const qrX = targetWidth - qrSize - 20; // 20px from right edge
          const qrY = 20; // 20px from top
          
          // Draw white background behind QR code for better visibility
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
          
          // Draw QR code
          ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    
    img.src = URL.createObjectURL(adImage);
  }, [adImage, callToAction, redemptionCode, selectedLocations]);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Removed useEffect that filtered locations based on isOpenOffer
  // Now all locations are shown and open offer is determined by selected location's openOfferOnly flag

  const handleGenerateOffer = async () => {
    if (!website) {
      toast({
        title: "Website Required",
        description: "Please enter your website URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await generateOfferFromWebsite(website);

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate offer');
      }

      const data = response.data;

      // Populate call to action
      if (data?.callToAction) {
        setCallToAction(data.callToAction);
      }

      // Set business name
      if (data?.businessName) {
        setAiGeneratedStoreName(data.businessName);
      }

      // Set brand colors (check both colors and brandColors for compatibility)
      if (data?.colors || data?.brandColors) {
        const colors = data.colors || data.brandColors;
        setBrandColors({
          primary: colors.primary || '#9333EA',
          secondary: colors.secondary || '#7E3AF2'
        });
      }

      // Convert offer image URL to File object (handle both data URLs and HTTP URLs)
      if (data?.offerImageUrl) {
        try {
          let imageBlob;
          if (data.offerImageUrl.startsWith('data:')) {
            // Handle base64 data URL
            const response = await fetch(data.offerImageUrl);
            imageBlob = await response.blob();
          } else {
            // Handle HTTP URL
            const imageResponse = await fetch(data.offerImageUrl);
            imageBlob = await imageResponse.blob();
          }
          const imageFile = new File([imageBlob], 'generated-offer-image.png', { type: imageBlob.type || 'image/png' });
          setAdImage(imageFile);
          setIsAiGenerated(true); // Mark as AI-generated
        } catch (imageError) {
          console.error('Error loading offer image:', imageError);
          // Continue without image if it fails
        }
      }

      // Logo removed - no longer needed

      toast({
        title: "Offer Generated! 🎉",
        description: "Your offer has been generated. Review and click 'Create Offer' when ready.",
        duration: 5000
      });
    } catch (error) {
      console.error("Error generating offer:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const displayMessage =
        errorMessage.includes('not configured') || errorMessage.includes('503')
          ? "The AI feature is currently unavailable. Please try again later."
          : errorMessage || "Failed to generate offer. Please try again.";
      toast({
        title: "Error",
        description: displayMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchLocations = async () => {
    try {
      // Fetch locations from backend API
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response.success && response.data) {
        const mappedLocations = response.data.map((location: any) => ({
          id: location._id?.toString() || location.id?.toString() || location.id,
          name: location.name,
          address: location.address,
          openOfferOnly: location.open_offer_only ?? location.openOfferOnly ?? false
        }));
        setLocations(mappedLocations);
        
        // Auto-select location if user has only one location
        if (mappedLocations.length === 1) {
          setSelectedLocations([mappedLocations[0].id]);
        }
        
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching locations from API:', error);
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    
    // If API fails, set empty array (no fallback to static data)
    setLocations([]);
  };

  // Removed searchAndSetLogo function - brand logo is no longer used

  const handleFileUpload = (file: File) => {
    setAdImage(file);
    setIsAiGenerated(false); // Manual upload is not AI-generated
  };

  const getExpirationDate = () => {
    const now = new Date();
    switch (expirationDuration) {
      case "1hour":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "1day":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case "1week":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  const formatExpirationDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleCreateOffer = async () => {
    // Prevent multiple clicks
    if (isCreating) {
      return;
    }

    if (!callToAction) {
      toast({
        title: "Missing Information",
        description: "Please enter your offer text",
        variant: "destructive",
      });
      return;
    }

    // Always require at least one location
    if (selectedLocations.length === 0) {
      toast({
        title: "Location Required",
        description: "Please select at least one of your retail locations for this offer",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true); // Disable button immediately
    try {
      // TODO: Replace with Node.js API call
      // const userResponse = await get({ end_point: 'auth/me' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create offers",
          variant: "destructive",
        });
        return;
      }

      // Convert offer image to base64
      let offerImageBase64 = null;

      if (adImage) {
        try {
          offerImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert offer image to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(adImage);
          });
        } catch (error) {
          console.error('Error converting offer image to base64:', error);
          toast({
            title: "Warning",
            description: "Failed to process offer image. Continuing without it.",
            variant: "destructive",
          });
        }
      }

      // Generate location-specific images with unique QR codes for each location
      // Each location needs its own unique image with its own QR code
      const locationImages: { [key: string]: string } = {};
      
      // Generate location-specific images using the same canvas logic as the preview
      for (const locationId of selectedLocations) {
        // Generate QR code URL for this specific location - points to carousel
        // This will show all offers for this location in a mobile-responsive carousel
        const qrCodeUrl = `${window.location.origin}/carousel/${locationId}`;
        
        // Create a canvas for this location's offer image
        const canvas = document.createElement('canvas');
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx && adImage) {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = async () => {
              // Calculate scaling to fit image within canvas
              const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const x = (targetWidth - scaledWidth) / 2;
              const y = (targetHeight - scaledHeight) / 2;
              
              // Draw the image
              ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
              
              // Draw the call to action text
              if (callToAction) {
                const fontSize = Math.max(32, targetWidth / 28);
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.fillStyle = '#ffffff';
                
                const maxWidth = targetWidth * 0.6;
                const words = callToAction.split(' ');
                let line = '';
                const lines: string[] = [];
                
                for (let i = 0; i < words.length; i++) {
                  const testLine = line + words[i] + ' ';
                  const metrics = ctx.measureText(testLine);
                  if (metrics.width > maxWidth && i > 0) {
                    lines.push(line);
                    line = words[i] + ' ';
                  } else {
                    line = testLine;
                  }
                }
                lines.push(line);
                
                const lineHeight = fontSize * 1.3;
                const startX = 120;
                const startY = 40;
                
                lines.forEach((line, index) => {
                  ctx.fillText(line.trim(), startX, startY + (index * lineHeight));
                });
              }
              
              // Generate QR code for this location (skip for AI-generated images)
              if (!isAiGenerated) {
                try {
                  const qrCanvas = document.createElement('canvas');
                  qrCanvas.width = 200;
                  qrCanvas.height = 200;
                  const qrCtx = qrCanvas.getContext('2d');
                  
                  if (qrCtx) {
                    qrCtx.fillStyle = '#ffffff';
                    qrCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
                    
                    await QRCode.toCanvas(qrCanvas, qrCodeUrl, {
                      width: 180,
                      margin: 2,
                      color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                      }
                    });
                    
                    // Draw QR code on main canvas in top right
                    ctx.drawImage(qrCanvas, targetWidth - 220, 20, 200, 200);
                  }
                } catch (qrError) {
                  console.error('Error generating QR code for location:', locationId, qrError);
                }
              }
              
              resolve(null);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(adImage);
          });
          
          // Convert canvas to base64
          locationImages[locationId] = canvas.toDataURL('image/png');
          console.log(`📸 Generated location-specific image for locationId: "${locationId}" (image length: ${locationImages[locationId].length})`);
        } else if (offerImageBase64) {
          // Fallback: use the original image if canvas fails
          locationImages[locationId] = offerImageBase64;
        }
      }
      
      // Verify that each location has a unique image
      const imageHashes = Object.keys(locationImages).map(locId => {
        const img = locationImages[locId];
        return {
          locationId: locId,
          imageHash: img ? img.substring(0, 200) : 'null',
          imageLength: img ? img.length : 0
        };
      });
      
      console.log(`📦 Sending ${Object.keys(locationImages).length} location-specific images to backend:`);
      console.log(`📦 Image details:`, imageHashes);
      console.log(`📦 Full locationImages object:`, locationImages);

      // Determine if offer should be open offer based on selected locations
      // If any selected location has openOfferOnly = true, make it an open offer
      const selectedLocationData = locations.filter(loc => selectedLocations.includes(loc.id));
      const isOpenOffer = selectedLocationData.some(loc => loc.openOfferOnly === true);

      // Create offer via backend API
      // Backend will create a separate offer for each location
      const offerData = {
        call_to_action: callToAction,
        is_open_offer: isOpenOffer,
        location_ids: selectedLocations, // Backend will create separate offers for each
        expiration_duration: expirationDuration,
        redemption_code: redemptionCode, // Base redemption code (backend will make unique per location)
        available_for_partnership: !isOpenOffer, // If not open offer, make it available for partnership
        brand_logo: null, // No longer accepting brand logo
        offer_image: offerImageBase64, // Fallback image (location-specific images in location_images)
        location_images: locationImages, // Location-specific images with QR codes
      };
      
      console.log(`📤 Sending offer data with location_images keys:`, Object.keys(offerData.location_images || {}));
      
      const response = await post({ 
        end_point: 'offers', 
        body: offerData,
        token: true
      });
      
      if (response.success) {
        const selectedLocationData = locations.filter(loc => selectedLocations.includes(loc.id));
        const isOpenOffer = selectedLocationData.some(loc => loc.openOfferOnly === true);
        const offerType = isOpenOffer ? 'Open Offer' : 'Location-based Offer';
        const locationText = `${selectedLocations.length} of your location${selectedLocations.length !== 1 ? 's' : ''}`;
        
        toast({
          title: "Offer Created Successfully!",
          description: response.message || `${offerType} created for ${locationText}. ${isOpenOffer ? 'It will appear in the Open Offers tab and be available to all retailers, while also being displayed at your selected locations.' : 'This offer is now active at your selected locations and available for partnership. Other retailers can find you in partner search!'}`,
          duration: 5000,
        });
        
        // Navigate to offers page after a short delay
        setTimeout(() => {
          navigate("/offers");
        }, 1500);
      } else {
        // Throw error with backend message
        throw new Error(response.message || 'Failed to create offer');
      }
      
      // TODO: Uncomment and use when API is ready:
      // const results = await Promise.all(offerPromises);
      // const hasErrors = results.some(result => result.error);
      // if (hasErrors) {
      //   throw new Error("Failed to create some offers");
      // }
      // toast({
      //   title: "Offer Created Successfully!",
      //   description: "Your offer is now active. Partner with other retailers to increase offer visibility!",
      //   action: (
      //     <Button 
      //       variant="outline" 
      //       size="sm" 
      //       onClick={() => navigate("/requests")}
      //     >
      //       Find Partners
      //     </Button>
      //   ),
      //   duration: 8000,
      // });
      // navigate("/offers");
    } catch (error) {
      console.error("Error creating offer:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a backend error response
      let displayMessage = "Failed to create offer";
      if (errorMessage.includes("already has an offer") || errorMessage.includes("cannot be created")) {
        displayMessage = errorMessage;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          displayMessage = apiError.response.data.message;
        }
      }
      
      toast({
        title: "Error",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false); // Re-enable button after request completes
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  // Show all locations in dropdown
  const availableLocations = locations;

  return (
    <AppLayout pageTitle="Create Offer" pageIcon={<Zap className="h-5 w-5 text-primary" />}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/offers")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Offers
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Create New Offer</CardTitle>
                <p className="text-muted-foreground">Design your promotional offer for customers</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Your Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Your Website</Label>
                  <p className="text-sm text-muted-foreground">Enter your website URL and let AI generate an offer for you</p>
                  <div className="flex gap-2">
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      type="url"
                    />
                    <Button 
                      onClick={handleGenerateOffer}
                      disabled={!website || isGenerating}
                      className="shrink-0"
                    >
                      {isGenerating ? (
                        <>
                          <span className="animate-spin mr-2">⚡</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Your Offer */}
                <div className="space-y-2">
                  <Label htmlFor="cta">Your Offer</Label>
                  <p className="text-sm text-muted-foreground">Offer a discount or free item to encourage consumers to scan your QR code</p>
                  <Input
                    id="cta"
                    placeholder="Get 10% off on your first visit!"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    maxLength={48}
                  />
                  <p className="text-xs text-muted-foreground">{48 - callToAction.length} characters left</p>
                </div>

                {/* Offer Expiration */}
                <div className="space-y-3">
                  <Label>Offer Expiration</Label>
                  <p className="text-sm text-muted-foreground">This is the amount of time a consumer has to redeem your offer from when it is downloaded at a partner location.</p>
                  <RadioGroup value={expirationDuration} onValueChange={setExpirationDuration}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1hour" id="1hour" />
                      <Label htmlFor="1hour" className="cursor-pointer">1 hour</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1day" id="1day" />
                      <Label htmlFor="1day" className="cursor-pointer">1 day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1week" id="1week" />
                      <Label htmlFor="1week" className="cursor-pointer">1 week</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Offer Image Upload */}
                <div className="space-y-2">
                  <Label>Offer Image</Label>
                  <p className="text-sm text-muted-foreground">Upload your promotional offer image here.</p>
                  <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <Button variant="ghost" className="text-primary" asChild>
                        <label htmlFor="offer-upload" className="cursor-pointer">
                          Click to upload
                        </label>
                      </Button>
                      <span className="text-muted-foreground"> or drag and drop</span>
                      <input
                        id="offer-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">SVG, PNG, JPG (max. 800x400px)</p>
                    {adImage && (
                      <p className="text-sm text-primary mt-2">Selected: {adImage.name}</p>
                    )}
                  </div>
                </div>

                {/* Location Selection */}
                <div className="space-y-2">
                  <Label htmlFor="location">Select Retail Locations</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which retail locations this offer is for.
                  </p>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={loading || availableLocations.length === 0}
                      >
                        {loading
                          ? "Loading locations..."
                          : selectedLocations.length === 0
                          ? "Select locations..."
                          : selectedLocations.length === 1
                          ? (() => {
                              const selectedLocation = locations.find(l => l.id === selectedLocations[0]);
                              return selectedLocation ? `${selectedLocation.name} - ${selectedLocation.address}` : `${selectedLocations.length} location(s) selected`;
                            })()
                          : `${selectedLocations.length} location(s) selected`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-background border border-border shadow-lg z-50" align="start">
                      <div className="p-4">
                        {availableLocations.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground space-y-2">
                            <p>No locations available. Please add a location first.</p>
                            <p className="text-xs">
                              Visit the <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/locations")}>Locations</Button> screen to add a location.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-2 text-xs font-medium text-muted-foreground">
                              {availableLocations.length} location{availableLocations.length !== 1 ? 's' : ''} available
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {availableLocations.map((location) => {
                                const isOpenOfferLocation = location.openOfferOnly === true;
                                return (
                                  <div key={location.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                      id={location.id}
                                      checked={selectedLocations.includes(location.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedLocations([...selectedLocations, location.id]);
                                        } else {
                                          setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                                        }
                                      }}
                                      className="mt-1"
                                    />
                                    <Label
                                      htmlFor={location.id}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      <div>
                                        <div className="font-medium flex items-center gap-2">
                                          {location.name}
                                          {isOpenOfferLocation && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                              Open Offer
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{location.address}</div>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedLocations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Selected locations:</p>
                      <div className="space-y-2">
                        {selectedLocations.map(locationId => {
                          const location = locations.find(l => l.id === locationId);
                          return location ? (
                            <div key={locationId} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0">
                                <Check className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium">
                                {location.name} - {location.address}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Create Offer Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={handleCreateOffer}
                    disabled={!callToAction || selectedLocations.length === 0 || isCreating}
                  >
                    {isCreating ? 'Creating Offer...' : 'Create Offer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offer Preview</CardTitle>
                <p className="text-muted-foreground">How your offer will appear in partner stores</p>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2">
                  {/* Background Image or Gradient */}
                  {adImage ? (
                    <img 
                      src={URL.createObjectURL(adImage)}
                      alt="Offer background"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: brandColors 
                          ? `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`
                          : 'linear-gradient(135deg, rgb(147 51 234) 0%, rgb(126 58 242) 100%)'
                      }}
                    >
                      <div className="text-center text-white/60">
                        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Upload className="h-8 w-8" />
                        </div>
                        <p>Offer image preview</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    {/* Top: Business Name and QR Code */}
                    <div className="flex justify-between items-start">
                      {/* Business Name in top left */}
                      {(aiGeneratedStoreName || (selectedLocations.length > 0 && locations.find(l => l.id === selectedLocations[0])?.name)) && (
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                          {aiGeneratedStoreName || locations.find(l => l.id === selectedLocations[0])?.name}
                        </h3>
                      )}
                      
                      {/* QR Code in top right corner */}
                      <div className="bg-white p-1.5 rounded-lg shadow-lg">
                        {redemptionCode && (
                          <QRCodeSVG 
                            value={`${window.location.origin}/redeem/${redemptionCode}`}
                            size={60}
                            level="H"
                          />
                        )}
                      </div>
                    </div>

                    {/* Bottom: Offer Text */}
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        {callToAction || "Your Offer Text"}
                      </h2>
                      <p className="text-white/90 text-sm drop-shadow-md">
                        Valid: {formatExpirationDate(getExpirationDate())}
                      </p>
                    </div>
                  </div>
                  
                  {/* Media Street logo in bottom right corner */}
                  <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <img 
                      src={mediaStreetLogoIcon} 
                      alt="Media Street" 
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-[10px] font-semibold text-gray-900">Partner offers by Media Street</span>
                  </div>
                </div>

                {/* Offer Type and Location Info */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  {(() => {
                    const selectedLocationData = locations.filter(loc => selectedLocations.includes(loc.id));
                    const isOpenOffer = selectedLocationData.some(loc => loc.openOfferOnly === true);
                    return isOpenOffer;
                  })() ? (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-semibold">
                          OPEN OFFER
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Available to all retailers in the Open Offers tab
                      </p>
                      {selectedLocations.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Your locations:</p>
                          {selectedLocations.slice(0, 3).map(locationId => {
                            const location = locations.find(l => l.id === locationId);
                            return location ? (
                              <div key={locationId} className="mt-1">
                                <p className="text-xs text-muted-foreground">{location.name}</p>
                              </div>
                            ) : null;
                          })}
                          {selectedLocations.length > 3 && (
                            <p className="text-xs text-muted-foreground mt-1">+ {selectedLocations.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : selectedLocations.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                          LOCATION-BASED
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedLocations.length} location{selectedLocations.length > 1 ? 's' : ''})
                        </span>
                      </p>
                      {selectedLocations.slice(0, 3).map(locationId => {
                        const location = locations.find(l => l.id === locationId);
                        return location ? (
                          <div key={locationId} className="mt-1">
                            <p className="text-sm text-muted-foreground">{location.name}</p>
                          </div>
                        ) : null;
                      })}
                      {selectedLocations.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-1">+ {selectedLocations.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select your locations</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Coupon Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Mobile Coupon Preview</CardTitle>
                <p className="text-muted-foreground">How your redemption coupon will appear to customers</p>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-80 h-[700px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden relative">
                    
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
                      {/* Partner Offer Information */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={mediaStreetLogoIcon} alt="Media Street" className="w-5 h-5 rounded" />
                          <p className="text-sm font-semibold text-purple-800">Partner Offer by Media Street</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="font-medium">Referring Retailer</span>
                          <span className="text-purple-400">→</span>
                          <span className="font-medium">
                            {selectedLocations.length > 0 
                              ? locations.find(l => l.id === selectedLocations[0])?.name 
                              : 'Your Location'}
                          </span>
                        </div>
                      </div>

                      {/* Offer Image */}
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {adImage ? (
                          <img 
                            src={URL.createObjectURL(adImage)} 
                            alt="Offer preview" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            Offer Image
                          </div>
                        )}
                      </div>
                      
                        {/* Offer Text */}
                        <div className="text-center">
                          <h4 className="font-bold text-lg text-black mb-2">
                            {callToAction || "Get 10% off on your first visit!"}
                          </h4>
                        
                          {/* Expiry Timer */}
                          <div className="flex items-center justify-center gap-2 text-sm text-orange-600 mb-2">
                            <Clock className="h-4 w-4" />
                            <span>Expires on {formatExpirationDate(getExpirationDate())}</span>
                          </div>
                          
                          {/* Directions Link */}
                          <div className="flex justify-center mb-4">
                            <button 
                              onClick={() => {
                                if (selectedLocations.length > 0) {
                                  const location = locations.find(l => l.id === selectedLocations[0]);
                                  if (location) {
                                    const encodedAddress = encodeURIComponent(location.address);
                                    window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                                  }
                                }
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <Map className="h-4 w-4" />
                              <span>Directions</span>
                            </button>
                          </div>
                        </div>
                      
                      {/* Retailer Redemption Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-gray-700 text-center mb-3">
                          For cashier to redeem:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <p className="text-lg font-bold font-mono text-gray-800 mb-3 tracking-wider">
                            {Math.random().toString(36).substr(2, 6).toUpperCase()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                          </p>
                          <div className="bg-white p-3 rounded-lg inline-block mb-2">
                            <QRCodeSVG 
                              value={`${window.location.origin}/redeem/${redemptionCode}`}
                              size={100}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                          <p className="text-xs text-gray-500">Type code or scan QR to redeem</p>
                        </div>
                        
                        {/* Website Instructions */}
                        <div className="text-center mt-4 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Powered by <span className="font-medium text-purple-600">mediastreet.ai</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/offers")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OfferCreate;