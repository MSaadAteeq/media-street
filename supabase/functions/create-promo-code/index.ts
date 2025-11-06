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

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      console.log(`[CREATE-PROMO] User ${user.id} is not admin`);
      throw new Error("Unauthorized: Admin access required");
    }

    const { code, creditAmount, usageLimit } = await req.json();

    if (!code || !creditAmount) {
      throw new Error("Code and credit amount are required");
    }

    console.log(`[CREATE-PROMO] Admin ${user.id} creating code: ${code}`);

    // Insert the promo code
    const { data: promoCode, error: insertError } = await supabaseClient
      .from("promo_codes")
      .insert({
        code: code.toUpperCase(),
        credit_amount: parseFloat(creditAmount),
        usage_limit: usageLimit === "unlimited" ? null : 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error("This promo code already exists");
      }
      throw insertError;
    }

    console.log(`[CREATE-PROMO] Success! Created promo code ${promoCode.id}`);

    return new Response(
      JSON.stringify({ success: true, promoCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CREATE-PROMO] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
