import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Gift, Trophy } from "lucide-react";
// Supabase removed - will use Node.js API
import { toast } from "@/hooks/use-toast";
import { get } from "@/services/apis";

const ReferralCodeCard = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile to get referral code
      try {
        const userResponse = await get({ end_point: 'users/me', token: true });
        if (userResponse.success && userResponse.data) {
          setReferralCode(userResponse.data.referralCode || userResponse.data.referral_code || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Fetch leaderboard data to get current user's points and rank
      try {
        const leaderboardResponse = await get({ end_point: 'leaderboard/referral', token: true });
        if (leaderboardResponse.success && leaderboardResponse.data) {
          // Find current user's entry in leaderboard
          const currentUserEntry = leaderboardResponse.data.find((entry: any) => entry.isCurrentUser);
          if (currentUserEntry) {
            setPoints(currentUserEntry.points || 0);
            setRank(currentUserEntry.rank || null);
          } else {
            // If user not in top 50, fetch their profile to get points
            try {
              const userResponse = await get({ end_point: 'users/me', token: true });
              if (userResponse.success && userResponse.data) {
                setPoints(userResponse.data.points || 0);
                setRank(null); // Not in top 50
              }
            } catch (error) {
              console.error('Error fetching user points:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback: try to get points from user profile
        try {
          const userResponse = await get({ end_point: 'users/me', token: true });
          if (userResponse.success && userResponse.data) {
            setPoints(userResponse.data.points || 0);
          }
        } catch (err) {
          console.error('Error fetching user points:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
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
            <div className="flex items-center gap-2 justify-end">
              {rank !== null && (
                <div className="flex items-center gap-1 text-primary">
                  <Trophy className="h-5 w-5" />
                  <span className="text-lg font-bold">#{rank}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-primary mt-1">{points}</div>
            <div className="text-xs text-muted-foreground">Points</div>
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