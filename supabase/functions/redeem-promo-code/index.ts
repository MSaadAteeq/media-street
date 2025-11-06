import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { code } = await req.json();
    if (!code) throw new Error("Promo code is required");

    console.log(`[REDEEM-PROMO] User ${user.id} attempting to redeem code: ${code}`);

    // Fetch the promo code
    const { data: promoCode, error: promoError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (promoError || !promoCode) {
      console.log("[REDEEM-PROMO] Code not found or inactive");
      throw new Error("Invalid or inactive promo code");
    }

    // Check usage limit
    if (promoCode.usage_limit !== null && promoCode.times_used >= promoCode.usage_limit) {
      console.log("[REDEEM-PROMO] Code usage limit reached");
      throw new Error("This promo code has reached its usage limit");
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await supabaseClient
      .from("promo_code_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("promo_code_id", promoCode.id)
      .single();

    if (existingRedemption) {
      console.log("[REDEEM-PROMO] User already redeemed this code");
      throw new Error("You have already redeemed this promo code");
    }

    // Get or create user credits record
    const { data: userCredits } = await supabaseClient
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const newBalance = (userCredits?.credit_balance || 0) + promoCode.credit_amount;
    const newTotalEarned = (userCredits?.total_earned || 0) + promoCode.credit_amount;

    if (userCredits) {
      // Update existing credits
      const { error: updateError } = await supabaseClient
        .from("user_credits")
        .update({
          credit_balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    } else {
      // Create new credits record
      const { error: insertError } = await supabaseClient
        .from("user_credits")
        .insert({
          user_id: user.id,
          credit_balance: promoCode.credit_amount,
          total_earned: promoCode.credit_amount,
        });

      if (insertError) throw insertError;
    }

    // Record the redemption
    const { error: redemptionError } = await supabaseClient
      .from("promo_code_redemptions")
      .insert({
        user_id: user.id,
        promo_code_id: promoCode.id,
        credit_amount: promoCode.credit_amount,
      });

    if (redemptionError) throw redemptionError;

    // Update times_used counter
    const { error: updateCodeError } = await supabaseClient
      .from("promo_codes")
      .update({ times_used: promoCode.times_used + 1 })
      .eq("id", promoCode.id);

    if (updateCodeError) throw updateCodeError;

    console.log(`[REDEEM-PROMO] Success! Added $${promoCode.credit_amount} to user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        credit_amount: promoCode.credit_amount,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[REDEEM-PROMO] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
