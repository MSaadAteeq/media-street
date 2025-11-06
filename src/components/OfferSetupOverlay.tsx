import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone, X } from "lucide-react";

interface OfferSetupOverlayProps {
  isOpen: boolean;
  onGetStarted: () => void;
  onClose?: () => void;
}

const OfferSetupOverlay: React.FC<OfferSetupOverlayProps> = ({ isOpen, onGetStarted, onClose }) => {
  return (
    <>
      {/* Blurred Background Overlay - more transparent, greyed out */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/40" />
      )}
      
      {/* Main Overlay Content */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="max-w-2xl border-0 bg-transparent shadow-none p-0 z-[101]">
          <DialogHeader className="sr-only">
            <DialogTitle>Create your first offer</DialogTitle>
            <DialogDescription>
              Set up your business offer to start promoting at nearby retailers
            </DialogDescription>
          </DialogHeader>

          {/* Close Button - improved styling */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-[102] w-10 h-10 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 text-foreground/70 hover:text-foreground transition-all"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Centered Content */}
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-8 max-w-lg mx-auto px-8">
              {/* Megaphone Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <Megaphone className="h-12 w-12 text-primary" />
              </div>
              
              {/* Main Heading */}
              <div className="space-y-2">
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  Create your first
                </h1>
                <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
                  Offer
                </h1>
              </div>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
                Promote an offer for your business at nearby retailers
              </p>
              
              {/* Get Started Button */}
              <div className="pt-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg transform translate-x-1 translate-y-1"></div>
                  <Button
                    onClick={onGetStarted}
                    size="lg"
                    className="relative bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg font-semibold rounded-lg"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OfferSetupOverlay;
