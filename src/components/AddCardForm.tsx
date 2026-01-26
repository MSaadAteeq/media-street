import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, X } from "lucide-react";
import { get, post } from "@/services/apis";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

interface CardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CardFormInner = ({ onSuccess, onCancel }: CardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [billingZip, setBillingZip] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await get({ end_point: 'users/me', token: true });
        if (response.success && response.data?.fullName) {
          setCardholderName(response.data.fullName);
        }
        // Set default ZIP if available from user profile
        if (response.success && response.data?.zipCode) {
          setBillingZip(response.data.zipCode);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded. Please refresh the page.");
      return;
    }

    if (!cardholderName.trim()) {
      setError("Please enter the cardholder name");
      return;
    }

    if (!billingZip.trim()) {
      setError("Please enter the billing ZIP code");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment method using Stripe Elements
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
          address: {
            postal_code: billingZip,
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to process card');
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Send payment method ID to backend
      const response = await post({
        end_point: 'billing/cards',
        body: {
          paymentMethodId: paymentMethod.id
        },
        token: true
      });

      if (response.success) {
        toast.success("Card saved successfully!");
        onSuccess();
      } else {
        throw new Error(response.message || 'Failed to save card');
      }
    } catch (err: any) {
      console.error("Error saving card:", err);
      setError(err?.message || "Failed to save card. Please try again.");
      toast.error(err?.message || "Failed to save card");
    } finally {
      setIsProcessing(false);
    }
  };

  const     cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#cbd5e1',
        },
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      invalid: {
        color: 'hsl(var(--destructive))',
        iconColor: 'hsl(var(--destructive))',
      },
    },
    hidePostalCode: true, // Hide postal code from CardElement since we have a separate field
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Card
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="Enter name as it appears on card"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label>Card Details</Label>
            <div className="p-3 border border-border rounded-md bg-card">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingZip">Billing ZIP Code</Label>
            <Input
              id="billingZip"
              placeholder="Enter ZIP code"
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              className="bg-card"
              maxLength={10}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isProcessing || !stripe}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Card"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your card details are securely processed by Stripe.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

interface AddCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCardForm = ({ onSuccess, onCancel }: AddCardFormProps) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Get Stripe publishable key from backend
        const response = await get({ end_point: 'billing/stripe-key', token: true });
        
        if (response.success && response.data?.publishableKey) {
          const stripe = await loadStripe(response.data.publishableKey);
          setStripePromise(stripe);
        } else {
          toast.error('Stripe is not configured. Please contact support.');
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        toast.error('Failed to load payment system. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">
            Payment system unavailable. Please refresh the page or contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardFormInner onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};
