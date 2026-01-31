import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Sparkles, Clock, ArrowRight } from "lucide-react";
// Supabase removed - using Node.js API
import { useToast } from "@/hooks/use-toast";
import { generateOfferFromWebsite } from "@/services/generateOfferFromWebsite";
import { useNavigate } from "react-router-dom";
import mediaStreetLogoIcon from "@/assets/media-street-logo-icon.png";
import { QRCodeSVG } from "qrcode.react";
import RequestInviteForm from "@/components/RequestInviteForm";
const OfferBuilderDemo = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [website, setWebsite] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOffer, setGeneratedOffer] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState({
    primary: '#9333EA',
    secondary: '#7E3AF2'
  });
  const [offerImage, setOfferImage] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  useEffect(() => {
    if (generatedOffer) {
      setShowCTA(false);
      const timer = setTimeout(() => {
        setShowCTA(true);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [generatedOffer]);
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

      if (data?.callToAction) {
        setGeneratedOffer(data.callToAction);
      }

      // Always set businessName, with fallback to "Your Business"
      setBusinessName(data?.businessName && data.businessName.trim() ? data.businessName : "Your Business");

      // Set page title and favicon
      if (data?.pageTitle) {
        setPageTitle(data.pageTitle);
      }
      // Set favicon - backend should provide Google favicon service URL
      if (data?.faviconUrl) {
        setFaviconUrl(data.faviconUrl);
      } else {
        // Fallback: use Google favicon service
        try {
          const url = website.startsWith('http') ? website : `https://${website}`;
          const hostname = new URL(url).hostname;
          setFaviconUrl(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`);
        } catch (e) {
          setFaviconUrl(null);
        }
      }
      
      // Set offer image - if not provided, will use gradient background
      // The gradient will use the brand colors from the AI response
      setOfferImage(data?.offerImageUrl || null);

      // Set brand colors if available
      if (data?.colors) {
        setBrandColors({
          primary: data.colors.primary || '#9333EA',
          secondary: data.colors.secondary || '#7E3AF2'
        });
      }
      
      console.log('Generated data:', {
        callToAction: data?.callToAction,
        businessName: data?.businessName,
        pageTitle: data?.pageTitle,
        faviconUrl: data?.faviconUrl,
        offerImageUrl: data?.offerImageUrl
      });
      
      if (data?.callToAction) {
        toast({
          title: "Offer Generated! 🎉",
          description: "Your custom offer is ready. Sign up to promote it!",
          duration: 5000
        });
      }
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
  return <section id="build-offer" className="py-24 bg-gradient-to-b from-background to-secondary/20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/30">
          <Sparkles className="h-4 w-4 text-accent-green" />
          <span className="text-accent-green font-semibold">Try It Now</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          Build Your First Offer
          <span className="gradient-hero bg-clip-text text-transparent"> with AI</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Enter your website and watch AI create a compelling offer in seconds
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20 shadow-strong">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent-green" />
              AI Offer Generator
            </CardTitle>
            <p className="text-muted-foreground">
              Let our AI analyze your business and create the perfect promotional offer
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-website">Your Website</Label>
                <div className="flex gap-2">
                  <Input id="demo-website" placeholder="https://yourwebsite.com" value={website} onChange={e => setWebsite(e.target.value)} type="url" className="flex-1" disabled={isGenerating} />
                  <Button onClick={handleGenerateOffer} disabled={!website || isGenerating} className="shrink-0 bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground" size="lg">
                    {isGenerating ? <>
                      <span className="animate-spin mr-2">⚡</span>
                      Generating...
                    </> : <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate
                    </>}
                  </Button>
                </div>
              </div>

              {generatedOffer && <div className="space-y-6">
                {/* Offer Preview with CTA Overlay */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2">
                  {/* Background Image or Gradient */}
                  {offerImage ? (
                    <img 
                      src={offerImage} 
                      alt="Offer background" 
                      className="w-full h-full object-cover absolute inset-0" 
                      style={{
                        objectPosition: 'center 30%'
                      }} 
                      onError={(e) => {
                        // If image fails to load, hide it
                        e.currentTarget.style.display = 'none';
                      }} 
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center absolute inset-0" 
                    style={{
                      background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
                      zIndex: offerImage ? -1 : 0
                    }}
                  >
                    <div className="text-center text-white/60">
                      <Sparkles className="h-16 w-16 mx-auto mb-3" />
                      <p>Your offer image will appear here</p>
                    </div>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    {/* Top row: Page title/favicon on left, QR Code on right */}
                    <div className="flex justify-between items-start gap-4">
                      {(pageTitle || website) && <div className="backdrop-blur-sm px-3 py-2 rounded-lg shadow-md flex items-center gap-2 max-w-[60%]" style={{
                        backgroundColor: brandColors.primary
                      }}>
                        {faviconUrl && <img src={faviconUrl} alt="favicon" className="w-5 h-5 object-contain flex-shrink-0 bg-white rounded" onError={e => {
                          // Hide if favicon fails to load
                          e.currentTarget.style.display = 'none';
                        }} />}
                        <span className="text-sm font-semibold text-white truncate">
                          {pageTitle || (() => {
                            try {
                              const url = website.startsWith('http') ? website : `https://${website}`;
                              return new URL(url).hostname;
                            } catch {
                              return website;
                            }
                          })()}
                        </span>
                      </div>}
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-white p-2 rounded-xl shadow-md">
                          <QRCodeSVG value={website || "https://example.com"} size={48} level="M" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Offer Text with semi-transparent background */}
                    <div className="space-y-1.5 bg-black/20 backdrop-blur-sm p-3 rounded-lg max-w-[85%]">
                      <h2 className="text-lg md:text-xl font-bold text-white drop-shadow-lg leading-tight">
                        {generatedOffer}
                      </h2>
                      <p className="text-white/90 text-xs drop-shadow-md flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Expires in 30 days
                      </p>
                    </div>
                  </div>

                  {/* Media Street logo in bottom right corner */}
                  <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <img src={mediaStreetLogoIcon} alt="Media Street" className="w-4 h-4 rounded" />
                    <span className="text-[6px] font-semibold text-gray-900">Partner offers by Media Street</span>
                  </div>

                  {/* CTA Overlay - Appears after 15 seconds */}
                  {showCTA && <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 to-slate-800/70 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                    <div className="text-center space-y-6 px-6 max-w-2xl">
                      <h3 className="text-3xl md:text-4xl font-bold text-white">
                        Ready to Launch Your Offer?
                      </h3>
                      <p className="text-lg text-slate-200">Sign up to customize & activate this offer at other stores near you                                                                                                                                                                                                                                     </p>
                      <RequestInviteForm>
                        <Button size="lg" className="bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground text-lg px-8 py-6">
                          Sign Up to Get Started
                          <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                      </RequestInviteForm>
                    </div>
                  </div>}
                </div>
              </div>}
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ AI analyzes your website</li>
                <li>✓ Generates a custom and compelling offer for your business</li>
                <li>✓ Sign up to activate and customize your offer</li>
                <li>✓ Start partnering with nearby retailers in a couple clicks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>;
};
export default OfferBuilderDemo;