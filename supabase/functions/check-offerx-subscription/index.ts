import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-OFFERX-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get location_id from request body if provided (for location-specific checks)
    const body = await req.text();
    let location_id = null;
    if (body) {
      try {
        const parsed = JSON.parse(body);
        location_id = parsed.location_id;
      } catch (e) {
        // Body is not JSON, continue without location_id
      }
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100, // Increased to handle multiple location subscriptions
    });

    // Find all OfferX subscriptions
    const offerxSubscriptions = subscriptions.data.filter((sub: any) => 
      sub.items.data.some((item: any) => item.price.id === "price_1SBMNp9RT8AUDOSl4Y2vzTcC")
    );

    if (offerxSubscriptions.length === 0) {
      logStep("No active OfferX subscriptions found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        active_locations: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract location IDs from subscription metadata
    const activeLocations = offerxSubscriptions
      .map((sub: any) => sub.metadata?.location_id)
      .filter(Boolean);

    logStep("Active OfferX subscriptions found", { 
      subscriptionCount: offerxSubscriptions.length,
      activeLocations
    });

    // If checking for a specific location
    if (location_id) {
      const locationSubscription = offerxSubscriptions.find((sub: any) => 
        sub.metadata?.location_id === location_id
      );
      
      if (locationSubscription) {
        return new Response(JSON.stringify({
          subscribed: true,
          location_subscribed: true,
          subscription_id: locationSubscription.id,
          subscription_end: new Date(locationSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: locationSubscription.cancel_at_period_end,
          active_locations: activeLocations
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        return new Response(JSON.stringify({
          subscribed: true, // User has OfferX but not for this location
          location_subscribed: false,
          active_locations: activeLocations
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // General subscription status
    return new Response(JSON.stringify({
      subscribed: true,
      active_locations: activeLocations,
      total_subscriptions: offerxSubscriptions.length,
      earliest_subscription_end: Math.min(...offerxSubscriptions.map((sub: any) => sub.current_period_end)) * 1000
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