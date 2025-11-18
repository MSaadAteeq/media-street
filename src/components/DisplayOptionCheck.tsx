import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Monitor, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Supabase removed - will use Node.js API
import { toast } from "sonner";

interface DisplayOptionCheckProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

const DisplayOptionCheck = ({ open, onOpenChange, onConfirm, title, description }: DisplayOptionCheckProps) => {
  const navigate = useNavigate();
  const [displayCarousel, setDisplayCarousel] = useState(false);
  const [displayQR, setDisplayQR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    if (!displayCarousel && !displayQR) {
      toast.error("Please select at least one display option");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with Node.js API call
      // const response = await get({ end_point: 'auth/me' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in to continue");
        setIsSaving(false);
        return;
      }

      // Store display options in localStorage for now
      // TODO: Update profiles table with display_carousel and display_qr columns
      localStorage.setItem('displayCarousel', displayCarousel.toString());
      localStorage.setItem('displayQR', displayQR.toString());
      
      const { error } = null as any; // Placeholder

      if (error) {
        console.error('Error updating display options:', error);
        toast.error("Failed to save display options");
        return;
      }

      toast.success("Display options saved!");
      onOpenChange(false);
      onConfirm();
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
            <p className="text-sm text-muted-foreground mb-4">
              For your offer to be shown at partner retailers, please first select and implement a partner display option:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <Checkbox 
                  id="carousel" 
                  checked={displayCarousel}
                  onCheckedChange={(checked) => setDisplayCarousel(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="carousel" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    Display Partner Carousel
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run your dedicated partner carousel on a tablet in-store
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenChange(false);
                      navigate('/display');
                    }}
                  >
                    Set up carousel →
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <Checkbox 
                  id="qr-codes" 
                  checked={displayQR}
                  onCheckedChange={(checked) => setDisplayQR(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="qr-codes" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Printer className="h-4 w-4" />
                    Print & Post Your Store QR codes
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Display QR code stickers near checkout, entrance, or counter
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenChange(false);
                      navigate('/locations');
                    }}
                  >
                    Print QR codes →
                  </Button>
                </div>
              </div>
            </div>
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
