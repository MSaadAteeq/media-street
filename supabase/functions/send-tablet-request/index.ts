import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TabletRequestData {
  storeName: string;
  storeAddress: string;
  transactionsPerDay: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { storeName, storeAddress, transactionsPerDay }: TabletRequestData = await req.json();

    console.log("Sending tablet request email for:", storeName, "from user:", user.email);

    const emailResponse = await resend.emails.send({
      from: "Media Street <onboarding@resend.dev>",
      to: ["hi@mediastreet.com"],
      subject: `FREE Tablet Request - ${storeName}`,
      html: `
        <h1>New FREE Tablet Request</h1>
        <p>A retailer has requested a free tablet for in-store display.</p>
        
        <h2>Store Details:</h2>
        <ul>
          <li><strong>Store Name:</strong> ${storeName}</li>
          <li><strong>Store Address:</strong> ${storeAddress}</li>
          <li><strong>Estimated Transactions/Day:</strong> ${transactionsPerDay}</li>
          <li><strong>Contact Email:</strong> ${user.email}</li>
        </ul>
        
        <p>Please review this request and contact the retailer if approved.</p>
        
        <p>Best regards,<br>Media Street System</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-tablet-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
