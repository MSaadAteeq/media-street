import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Monitor, Printer, Lightbulb, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
// Supabase removed - will use Node.js API
import { toast } from "sonner";

interface DisplayOptionCheckProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (creativeIdeas?: string) => void;
  title: string;
  description: string;
}

const DisplayOptionCheck = ({ open, onOpenChange, onConfirm, title, description }: DisplayOptionCheckProps) => {
  const navigate = useNavigate();
  const [displayCarousel, setDisplayCarousel] = useState(true); // Default to checked
  const [displayQR, setDisplayQR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creativeIdeas, setCreativeIdeas] = useState("");
  const [showCreativeSection, setShowCreativeSection] = useState(false);

  const handleSaveAndContinue = async () => {
    if (!displayCarousel && !displayQR) {
      toast.error("Please select at least one display option");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in to continue");
        setIsSaving(false);
        return;
      }

      // Store display options in localStorage
      localStorage.setItem('displayCarousel', displayCarousel.toString());
      localStorage.setItem('displayQR', displayQR.toString());
      if (creativeIdeas.trim()) {
        localStorage.setItem('creativeIdeas', creativeIdeas.trim());
      }

      toast.success("Display options saved!");
      onOpenChange(false);
      onConfirm(creativeIdeas.trim() || undefined);
    } catch (error) {
      console.error('Error saving display options:', error);
      toast.error("Failed to save display options");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-1">Please select your in-store partner display method:</p>
            <p className="text-xs text-muted-foreground mb-4">Both methods are recommended</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                <Checkbox 
                  id="carousel" 
                  checked={displayCarousel}
                  onCheckedChange={(checked) => setDisplayCarousel(checked as boolean)}
                  className="h-4 w-4"
                />
                <div className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                  <Monitor className="h-4 w-4" />
                  <span>Tablet <span className="text-muted-foreground font-normal">(Most effective)</span></span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                    navigate('/display');
                  }}
                >
                  Display
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                <Checkbox 
                  id="qr-codes" 
                  checked={displayQR}
                  onCheckedChange={(checked) => setDisplayQR(checked as boolean)}
                  className="h-4 w-4"
                />
                <div className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1">
                  <Printer className="h-4 w-4" />
                  <span>QR Code <span className="text-muted-foreground font-normal">(Easiest to implement)</span></span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                    navigate('/locations');
                  }}
                >
                  Print
                </Button>
              </div>
            </div>
          </div>

          {/* Get Creative Section */}
          <div className="border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setShowCreativeSection(!showCreativeSection)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">Get Creative (Optional)</span>
              </div>
              {showCreativeSection ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showCreativeSection && (
              <div className="p-4 pt-0 space-y-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  List other ways you'd be open to promoting your partners by sharing your MS QR code on other marketing assets:
                </p>
                <Textarea
                  placeholder="e.g. include qr code on receipts, mention partner offer in newsletter, one social media post a week"
                  value={creativeIdeas}
                  onChange={(e) => setCreativeIdeas(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={isSaving || (!displayCarousel && !displayQR)}
            >
              {isSaving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisplayOptionCheck;
