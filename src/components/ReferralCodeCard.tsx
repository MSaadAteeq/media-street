import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ReferralCodeCard = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyPoints, setWeeklyPoints] = useState<number>(0);

  useEffect(() => {
    fetchReferralCode();
    fetchWeeklyPoints();
  }, []);

  const fetchReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching referral code:', error);
        return;
      }

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_current_week_leaderboard');

      if (error) {
        console.error('Error fetching weekly points:', error);
        return;
      }

      if (data) {
        const currentUserEntry = data.find((entry: any) => entry.user_id === user.id);
        if (currentUserEntry) {
          setWeeklyPoints(currentUserEntry.points || 0);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share this code with other retailers. You'll get 3 points when they sign up!
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{weeklyPoints}</div>
            <div className="text-xs text-muted-foreground">Weekly Points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input 
            value={referralCode} 
            readOnly 
            className="font-mono text-lg font-bold text-center bg-muted"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>• When someone signs up with your code, you earn 3 points</p>
          <p>• Points are added to your weekly leaderboard</p>
          <p>• Share with other retailers to grow the network</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCodeCard;