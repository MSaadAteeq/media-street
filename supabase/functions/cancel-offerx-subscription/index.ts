import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-OFFERX-SUBSCRIPTION] ${step}${detailsStr}`);
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
      throw new Error("No customer found");
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get location_id from request body
    const { location_id } = await req.json();
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    // Find OfferX subscriptions
    const offerxSubscriptions = subscriptions.data.filter((sub: any) => 
      sub.items.data.some((item: any) => item.price.id === "price_1SBMNp9RT8AUDOSl4Y2vzTcC")
    );

    if (offerxSubscriptions.length === 0) {
      throw new Error("No active OfferX subscriptions found");
    }

    if (location_id) {
      // Cancel specific location subscription
      const locationSubscription = offerxSubscriptions.find((sub: any) => 
        sub.metadata?.location_id === location_id
      );

      if (!locationSubscription) {
        throw new Error("No active OfferX subscription found for this location");
      }

      // Cancel the specific location subscription immediately
      const canceledSubscription = await stripe.subscriptions.cancel(locationSubscription.id);

      logStep("Location subscription canceled", { 
        subscriptionId: canceledSubscription.id,
        locationId: location_id
      });

      return new Response(JSON.stringify({
        success: true,
        message: "OfferX subscription canceled for this location",
        location_id: location_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Cancel all OfferX subscriptions
      const cancelPromises = offerxSubscriptions.map((sub: any) => 
        stripe.subscriptions.cancel(sub.id)
      );
      
      await Promise.all(cancelPromises);

      logStep("All OfferX subscriptions canceled", { 
        canceledCount: offerxSubscriptions.length
      });

      return new Response(JSON.stringify({
        success: true,
        message: "All OfferX subscriptions have been canceled",
        canceled_count: offerxSubscriptions.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});