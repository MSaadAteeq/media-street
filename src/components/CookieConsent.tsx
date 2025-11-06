import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 pr-4">
            <p className="text-sm text-foreground leading-relaxed">
              We use cookies to improve your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept", you agree to the use of cookies as described in our{" "}
              <a href="/privacy-policy" className="underline hover:text-primary">
                Privacy Policy
              </a>
              . You can manage your cookie preferences at any time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              className="whitespace-nowrap"
            >
              Reject All
            </Button>
            <Button
              onClick={handleAccept}
              className="whitespace-nowrap"
            >
              Accept All
            </Button>
            <button
              onClick={handleClose}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close cookie notice"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
