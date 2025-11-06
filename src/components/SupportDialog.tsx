import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Headphones } from "lucide-react";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-primary">
            Contact Support
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Email us at{" "}
              <a 
                href="mailto:support@mediastreet.ai" 
                className="text-primary hover:underline font-medium"
              >
                support@mediastreet.ai
              </a>
            </p>
            
            <p className="text-muted-foreground font-medium">OR</p>
            
            <p className="text-muted-foreground">
              Call us at{" "}
              <a 
                href="tel:+18884403275" 
                className="text-primary hover:underline font-medium"
              >
                +1-888-440-3275
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}