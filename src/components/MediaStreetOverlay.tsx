import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";

interface MediaStreetOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const MediaStreetOverlay = ({ isVisible, onClose }: MediaStreetOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Media Street synced!
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <p className="text-foreground">
              You're set to make money with Media Street. Now go to{" "}
              <a
                href="https://app.mediastreet.ai/settings/adpreferences"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Settings &gt; Ad Preferences
                <ExternalLink className="h-3 w-3" />
              </a>
              {" "}to update which ads you want to accept in addition to your Media Street cross-promotions.
            </p>
            
            <p className="text-foreground">
              <strong>Important:</strong> Please log-in to Media Street with your same Media Street login and password.
            </p>
            
            <div className="flex justify-end pt-2">
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
                Got it
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};