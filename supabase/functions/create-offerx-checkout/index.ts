import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-OFFERX-CHECKOUT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { location_id } = await req.json();
    if (!location_id) throw new Error("Location ID is required");
    logStep("Location ID provided", { location_id });

    const OFFERX_PRICE = 20; // Open Offer monthly price

    // Check if user has sufficient credits first
    const { data: userCredits } = await supabaseClient
      .from("user_credits" as any)
      .select("credit_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const creditBalance = (userCredits as any)?.credit_balance || 0;
    logStep("User credit balance", { balance: creditBalance });

    if (creditBalance >= OFFERX_PRICE) {
      // User has enough credits - deduct and activate subscription without Stripe
      logStep("Sufficient credits available, using credits instead of Stripe");
      
      const newBalance = creditBalance - OFFERX_PRICE;
      const { error: updateError } = await supabaseClient
        .from("user_credits" as any)
        .update({
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Create OfferX subscription record directly
      const { error: subError } = await supabaseClient
        .from("offerx_subscriptions" as any)
        .insert({
          user_id: user.id,
          location_id: location_id,
          is_active: true,
          paid_via_credits: true
        });

      if (subError) throw subError;

      logStep("OfferX subscription activated via credits", { 
        deducted: OFFERX_PRICE, 
        newBalance 
      });

      return new Response(JSON.stringify({ 
        success: true,
        paid_via_credits: true,
        amount_deducted: OFFERX_PRICE,
        new_balance: newBalance,
        redirect_url: `${req.headers.get("origin")}/offerx?success=true&location_id=${location_id}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Insufficient credits - proceed with Stripe
    logStep("Insufficient credits, proceeding with Stripe checkout");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1SBMNp9RT8AUDOSl4Y2vzTcC", // OfferX monthly subscription price
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/offerx?session_id={CHECKOUT_SESSION_ID}&location_id=${location_id}`,
      cancel_url: `${req.headers.get("origin")}/offerx`,
      metadata: {
        user_id: user.id,
        location_id: location_id,
        service: "offerx"
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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