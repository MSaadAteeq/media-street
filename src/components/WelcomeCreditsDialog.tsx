import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, DollarSign, PartyPopper } from "lucide-react";

interface WelcomeCreditsDialogProps {
  open: boolean;
  onClose: () => void;
  creditAmount?: number;
}

export const WelcomeCreditsDialog = ({ open, onClose, creditAmount = 50 }: WelcomeCreditsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md text-center bg-background" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            🎉 You're all set! 🎉
          </DialogTitle>
          <DialogDescription className="text-base space-y-3">
            <p className="text-foreground font-semibold text-lg">
              You've received <span className="text-cyan-400">${creditAmount}</span> in promo credits!
            </p>
            <p className="text-muted-foreground text-sm">
              Use these credits for Open Offer ($25/mo) or partnerships ($10/mo). 
              Your card won't be charged until credits run out.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Gift className="h-6 w-6 mx-auto text-blue-400 mb-1" />
            <p className="text-xs text-muted-foreground">Free to start</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <DollarSign className="h-6 w-6 mx-auto text-green-400 mb-1" />
            <p className="text-xs text-muted-foreground">${creditAmount} credits</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="h-6 w-6 mx-auto text-amber-400 mb-1" />
            <p className="text-xs text-muted-foreground">Cancel anytime</p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
          <p>
            <strong>No charges</strong> until your ${creditAmount} credits are used. Cancel before then to avoid any charges!
          </p>
        </div>

        <Button 
          onClick={onClose} 
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Let's Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
};
