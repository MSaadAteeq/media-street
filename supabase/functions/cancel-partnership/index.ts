import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-PARTNERSHIP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { partnership_id } = await req.json();
    if (!partnership_id) throw new Error("partnership_id is required");

    // Get partnership details
    const { data: partnership, error: partnershipError } = await supabaseClient
      .from('partnerships')
      .select('*, stripe_subscription_id')
      .eq('id', partnership_id)
      .eq('user_id', user.id)
      .single();

    if (partnershipError || !partnership) {
      throw new Error("Partnership not found or you don't have permission to cancel it");
    }

    logStep("Found partnership", { partnershipId: partnership_id, stripeSubId: partnership.stripe_subscription_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Cancel Stripe subscription if it exists
    if (partnership.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(partnership.stripe_subscription_id);
        logStep("Stripe subscription canceled", { subscriptionId: partnership.stripe_subscription_id });
      } catch (stripeError: any) {
        logStep("Stripe cancellation error", { error: stripeError.message });
        // Continue even if Stripe fails - we still want to update our database
      }
    }

    // Update partnership status in database
    const { error: updateError } = await supabaseClient
      .from('partnerships')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', partnership_id);

    if (updateError) {
      throw new Error(`Failed to update partnership: ${updateError.message}`);
    }

    logStep("Partnership canceled successfully", { partnershipId: partnership_id });

    return new Response(JSON.stringify({
      success: true,
      message: "Partnership canceled successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
