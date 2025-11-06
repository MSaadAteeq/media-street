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

    const { amount, description, type } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    console.log(`[DEDUCT-CREDITS] User ${user.id} attempting to deduct $${amount} for ${type || description}`);

    // Get user credits
    const { data: userCredits, error: creditsError } = await supabaseClient
      .from("user_credits" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (creditsError && creditsError.code !== "PGRST116") {
      throw creditsError;
    }

    const currentBalance = (userCredits as any)?.credit_balance || 0;

    // Check if user has enough credits
    if (currentBalance < amount) {
      console.log(`[DEDUCT-CREDITS] Insufficient credits. Has $${currentBalance}, needs $${amount}`);
      return new Response(
        JSON.stringify({ 
          has_sufficient_credits: false,
          current_balance: currentBalance,
          amount_needed: amount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits
    const newBalance = currentBalance - amount;
    
    if (userCredits) {
      const { error: updateError } = await supabaseClient
        .from("user_credits" as any)
        .update({
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    } else {
      // This shouldn't happen, but handle it
      console.log(`[DEDUCT-CREDITS] User has no credits record, cannot deduct`);
      return new Response(
        JSON.stringify({ 
          has_sufficient_credits: false,
          current_balance: 0,
          amount_needed: amount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[DEDUCT-CREDITS] Success! Deducted $${amount}, new balance: $${newBalance}`);

    return new Response(
      JSON.stringify({
        has_sufficient_credits: true,
        amount_deducted: amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[DEDUCT-CREDITS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
