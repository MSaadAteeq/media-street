import { Card } from "@/components/ui/card";
import { Store, DoorOpen, CreditCard, Tablet, QrCode, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import storeImage from "@/assets/store-visibility-zones-labeled.png";
interface StorePlacementTipsProps {
  displayType?: 'tablet' | 'qr';
}
const StorePlacementTips = ({
  displayType = 'tablet'
}: StorePlacementTipsProps) => {
  return <Card className="p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Display Incentives</h3>
        </div>
        <Link to="/location-qr" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <QrCode className="h-5 w-5" />
          <span className="text-sm font-medium">Print and Post Your QR Code Sticker</span>
        </Link>
      </div>
      
      <div className="space-y-4 mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">5 reasons to promote Media Street in-store</strong> with your {displayType === 'qr' ? 'QR code' : 'tablet carousel'}:
        </p>
        
        <div className="grid gap-3">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
            <p className="text-sm text-foreground">Your own offer is shown <strong>more</strong> if you generate more views for other retailer offers</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
            <p className="text-sm text-foreground">Earn <strong>$1 in promo credits</strong> for each partner offer redemption you generate. These are redeemed for discounts on partner fees and Open Offer.</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">3</span>
            <p className="text-sm text-foreground">The retailer referring the most redemptions in a partnership <strong>never pays the $10/mo. partnership fee</strong>. Win the partnership challenge and you don't pay!</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">4</span>
            <p className="text-sm text-foreground">Win <strong>weekly rewards ($1K)</strong> for views and redemptions</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">5</span>
            <p className="text-sm text-foreground">Cross-promote your business partners and <strong>save retail</strong> by getting businesses like yours to band together!</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden bg-background/50 p-6">
        <p className="text-sm font-semibold text-foreground mb-4">Highest Traffic Placement Areas:</p>
        
        <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-muted/30 to-muted/60 rounded-lg border-2 border-border">
          {/* Store interior representation */}
          <svg className="w-full h-full" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
            {/* Floor */}
            <rect x="0" y="0" width="800" height="450" fill="hsl(var(--muted))" opacity="0.3" />
            
            {/* Front wall and door */}
            <rect x="0" y="50" width="800" height="20" fill="hsl(var(--muted-foreground))" opacity="0.2" />
            <rect x="350" y="50" width="100" height="20" fill="hsl(var(--background))" opacity="0.5" />
            <path d="M 375 70 L 375 90 M 425 70 L 425 90" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.3" />
            
            {/* Checkout counter */}
            <rect x="600" y="250" width="120" height="80" fill="hsl(var(--muted-foreground))" opacity="0.3" rx="4" />
            
            {/* Shelving/displays */}
            <rect x="100" y="150" width="80" height="120" fill="hsl(var(--muted-foreground))" opacity="0.15" rx="4" />
            <line x1="110" y1="180" x2="170" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="110" y1="210" x2="170" y2="210" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="110" y1="240" x2="170" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            
            <rect x="250" y="150" width="80" height="120" fill="hsl(var(--muted-foreground))" opacity="0.15" rx="4" />
            <line x1="260" y1="180" x2="320" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="260" y1="210" x2="320" y2="210" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="260" y1="240" x2="320" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            
            <rect x="400" y="150" width="80" height="120" fill="hsl(var(--muted-foreground))" opacity="0.15" rx="4" />
            <line x1="410" y1="180" x2="470" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="410" y1="210" x2="470" y2="210" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            <line x1="410" y1="240" x2="470" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
            
            {/* QR Code markers */}
            {/* Front door QR */}
            <rect x="388" y="48" width="24" height="24" fill="hsl(var(--primary))" opacity="0.9" rx="2" />
            <rect x="392" y="52" width="4" height="4" fill="white" />
            <rect x="404" y="52" width="4" height="4" fill="white" />
            <rect x="392" y="64" width="4" height="4" fill="white" />
            <rect x="404" y="64" width="4" height="4" fill="white" />
            <rect x="398" y="58" width="4" height="4" fill="white" />
            
            {/* Checkout front QR */}
            <rect x="568" y="278" width="24" height="24" fill="hsl(var(--primary))" opacity="0.9" rx="2" />
            <rect x="572" y="282" width="4" height="4" fill="white" />
            <rect x="584" y="282" width="4" height="4" fill="white" />
            <rect x="572" y="294" width="4" height="4" fill="white" />
            <rect x="584" y="294" width="4" height="4" fill="white" />
            <rect x="578" y="288" width="4" height="4" fill="white" />
            
            {/* Counter tablet bubble - purple */}
            <circle cx="660" cy="290" r="12" fill="#9333ea" opacity="0.9" />
            <circle cx="660" cy="290" r="8" fill="#a855f7" opacity="0.5" />
            
            {/* Behind register tablet bubble - purple */}
            <circle cx="660" cy="240" r="12" fill="#9333ea" opacity="0.9" />
            <circle cx="660" cy="240" r="8" fill="#a855f7" opacity="0.5" />
            
            {/* Connection lines and labels */}
            {/* Front door line - from label to QR icon at door (400, 60) */}
            <line x1="345" y1="38" x2="388" y2="55" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.7" strokeDasharray="5 3" />
            
            {/* Checkout QR line - from label to QR icon (580, 290) */}
            <line x1="175" y1="400" x2="560" y2="295" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.7" strokeDasharray="5 3" />
            
            {/* Counter tablet line - from label to purple bubble (660, 290) */}
            <line x1="530" y1="400" x2="655" y2="300" stroke="#9333ea" strokeWidth="2" opacity="0.7" strokeDasharray="5 3" />
            
            {/* Behind register tablet line - from label to purple bubble (660, 240) */}
            <line x1="650" y1="175" x2="660" y2="232" stroke="#9333ea" strokeWidth="2" opacity="0.7" strokeDasharray="5 3" />
          </svg>
          
          {/* Text labels positioned absolutely */}
          <div className="absolute top-[4%] left-[32%] text-xs font-semibold text-primary bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-primary/20 whitespace-nowrap">
            <QrCode className="h-3 w-3 inline mr-1" />
            QR sticker on front door
          </div>
          
          <div className="absolute bottom-[6%] left-[8%] text-xs font-semibold text-primary bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-primary/20 whitespace-nowrap">
            <QrCode className="h-3 w-3 inline mr-1" />
            QR sticker at checkout
          </div>
          
          <div className="absolute bottom-[6%] left-[58%] text-xs font-semibold text-purple-600 bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-purple-200 whitespace-nowrap">
            <Tablet className="h-3 w-3 inline mr-1 text-purple-600" />
            Tablet on counter
          </div>
          
          <div className="absolute top-[33%] right-[8%] text-xs font-semibold text-purple-600 bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-purple-200 whitespace-nowrap">
            <Tablet className="h-3 w-3 inline mr-1 text-purple-600" />
            Tablet behind register
          </div>
        </div>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground cursor-help">
              <Info className="h-4 w-4" />
              <span className="text-xs">Display both a Tablet and QR code for best results. Get creative! We've seen users promote their MS QR code on social media, emails, receipts, even napkins!</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p>Displaying both your partner carousel on tablet and QR code stickers throughout the store will drive the most views increasing reach for your own offer and earning you rewards.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>;
};
export default StorePlacementTips;
