import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PARTNERSHIP-PAYMENT] ${step}${detailsStr}`);
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

    const { partner_request_id, approver_user_id, sender_user_id } = await req.json();
    if (!partner_request_id || !approver_user_id || !sender_user_id) {
      throw new Error("Missing required parameters: partner_request_id, approver_user_id, sender_user_id");
    }

    logStep("Request parameters", { partner_request_id, approver_user_id, sender_user_id });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verify the user is authorized to approve this request
    if (user.id !== approver_user_id) {
      throw new Error("User not authorized to approve this request");
    }

    const PARTNERSHIP_FEE = 7; // Monthly fee per partner

    // Check credit balances for both users
    const [approverCreditsData, senderCreditsData] = await Promise.all([
      supabaseClient.from("user_credits" as any).select("credit_balance").eq("user_id", approver_user_id).maybeSingle(),
      supabaseClient.from("user_credits" as any).select("credit_balance").eq("user_id", sender_user_id).maybeSingle()
    ]);

    const approverBalance = (approverCreditsData.data as any)?.credit_balance || 0;
    const senderBalance = (senderCreditsData.data as any)?.credit_balance || 0;
    
    logStep("Credit balances", { approverBalance, senderBalance });

    const approverHasCredits = approverBalance >= PARTNERSHIP_FEE;
    const senderHasCredits = senderBalance >= PARTNERSHIP_FEE;

    let approverSubscriptionId = null;
    let senderSubscriptionId = null;
    let approverPaidViaCredits = false;
    let senderPaidViaCredits = false;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get user profiles to get emails for Stripe customer lookup
    const [approverProfile, senderProfile] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('user_id', approver_user_id).single(),
      supabaseClient.from('profiles').select('*').eq('user_id', sender_user_id).single()
    ]);

    if (!approverProfile.data || !senderProfile.data) {
      throw new Error("Could not find user profiles");
    }

    // Get emails from auth.users
    const [approverAuthData, senderAuthData] = await Promise.all([
      supabaseClient.auth.admin.getUserById(approver_user_id),
      supabaseClient.auth.admin.getUserById(sender_user_id)
    ]);

    if (!approverAuthData.data.user?.email || !senderAuthData.data.user?.email) {
      throw new Error("Could not find user emails");
    }

    const approverEmail = approverAuthData.data.user.email;
    const senderEmail = senderAuthData.data.user.email;

    logStep("Found user emails", { approverEmail, senderEmail });

    // Handle approver payment
    if (approverHasCredits) {
      // Deduct credits for approver
      logStep("Approver paying via credits");
      const newBalance = approverBalance - PARTNERSHIP_FEE;
      await supabaseClient
        .from("user_credits" as any)
        .update({
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", approver_user_id);
      
      approverPaidViaCredits = true;
      approverSubscriptionId = `credits_${approver_user_id}_${Date.now()}`;
      logStep("Approver credits deducted", { newBalance });
    } else {
      // Charge approver via Stripe
      logStep("Approver paying via Stripe");
      const approverCustomers = await stripe.customers.list({ email: approverEmail, limit: 1 });
      
      if (approverCustomers.data.length === 0) {
        throw new Error("Approver doesn't have saved payment method. Please add a payment method in Settings > Billing.");
      }

      const approverCustomerId = approverCustomers.data[0].id;
      const partnershipPrice = "price_1SIvPh9RT8AUDOSl88Wpuc4K"; // $7/month partnership fee
      
      const approverSubscription = await stripe.subscriptions.create({
        customer: approverCustomerId,
        items: [{ price: partnershipPrice }],
        metadata: {
          type: "partnership_fee",
          partner_request_id: partner_request_id,
          user_id: approver_user_id,
          partner_user_id: sender_user_id
        }
      });
      
      approverSubscriptionId = approverSubscription.id;
      logStep("Approver Stripe subscription created", { subscriptionId: approverSubscriptionId });
    }

    // Handle sender payment
    if (senderHasCredits) {
      // Deduct credits for sender
      logStep("Sender paying via credits");
      const newBalance = senderBalance - PARTNERSHIP_FEE;
      await supabaseClient
        .from("user_credits" as any)
        .update({
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", sender_user_id);
      
      senderPaidViaCredits = true;
      senderSubscriptionId = `credits_${sender_user_id}_${Date.now()}`;
      logStep("Sender credits deducted", { newBalance });
    } else {
      // Charge sender via Stripe
      logStep("Sender paying via Stripe");
      const senderCustomers = await stripe.customers.list({ email: senderEmail, limit: 1 });
      
      if (senderCustomers.data.length === 0) {
        throw new Error("Sender doesn't have saved payment method. Please add a payment method in Settings > Billing.");
      }

      const senderCustomerId = senderCustomers.data[0].id;
      const partnershipPrice = "price_1SIvPh9RT8AUDOSl88Wpuc4K"; // $7/month partnership fee
      
      const senderSubscription = await stripe.subscriptions.create({
        customer: senderCustomerId,
        items: [{ price: partnershipPrice }],
        metadata: {
          type: "partnership_fee",
          partner_request_id: partner_request_id,
          user_id: sender_user_id,
          partner_user_id: approver_user_id
        }
      });
      
      senderSubscriptionId = senderSubscription.id;
      logStep("Sender Stripe subscription created", { subscriptionId: senderSubscriptionId });
    }

    logStep("Both payments processed successfully", {
      approverPaidViaCredits,
      senderPaidViaCredits
    });

    // Update partner request status to approved
    const { error: updateError } = await supabaseClient
      .from('partner_requests')
      .update({ status: 'approved' })
      .eq('id', partner_request_id);

    if (updateError) {
      logStep("ERROR updating partner request", { error: updateError });
      throw new Error(`Failed to update partner request: ${updateError.message}`);
    }

    // Create partnership record with subscription IDs
    const { error: partnershipError } = await supabaseClient
      .from('partnerships')
      .insert({
        partner1_id: approver_user_id,
        partner2_id: sender_user_id,
        partner_request_id: partner_request_id,
        approver_subscription_id: approverSubscriptionId,
        sender_subscription_id: senderSubscriptionId,
        approver_paid_via_credits: approverPaidViaCredits,
        sender_paid_via_credits: senderPaidViaCredits
      });

    if (partnershipError) {
      logStep("ERROR creating partnership", { error: partnershipError });
      throw new Error(`Failed to create partnership: ${partnershipError.message}`);
    }

    logStep("Partnership created successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Partnership approved and payments processed for both users",
      approver_subscription_id: approverSubscriptionId,
      sender_subscription_id: senderSubscriptionId,
      approver_paid_via_credits: approverPaidViaCredits,
      sender_paid_via_credits: senderPaidViaCredits,
      monthly_fee: 7.00,
      partnership_created: true
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