import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQRRequest {
  locationId: string;
  locationName: string;
  locationAddress: string;
  qrCodeDataUrl: string;
  requestSticker?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { locationId, locationName, locationAddress, qrCodeDataUrl, requestSticker }: SendQRRequest = await req.json();

    console.log("Sending QR code email for location:", locationId);

    // Convert data URL to buffer for attachment
    const base64Data = qrCodeDataUrl.split(",")[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    if (requestSticker) {
      // Send sticker request to hi@mediastreet
      const stickerResponse = await resend.emails.send({
        from: "OfferAve <onboarding@resend.dev>",
        to: ["hi@mediastreet"],
        subject: `Glossy Sticker Request - ${locationName}`,
        html: `
          <h2>New Glossy Sticker Request</h2>
          <p><strong>Location:</strong> ${locationName}</p>
          <p><strong>Address:</strong> ${locationAddress}</p>
          <p><strong>User Email:</strong> ${user.email}</p>
          <p>The printable QR code is attached to this email.</p>
        `,
        attachments: [
          {
            filename: `${locationName.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`,
            content: buffer,
          },
        ],
      });

      console.log("Sticker request email sent:", stickerResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Sticker request sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      // Send QR code to user's email
      const emailResponse = await resend.emails.send({
        from: "OfferAve <onboarding@resend.dev>",
        to: [user.email!],
        subject: `Your QR Code for ${locationName}`,
        html: `
          <h2>Your In-Store QR Code</h2>
          <p>Hi there!</p>
          <p>Here's your downloadable QR code for <strong>${locationName}</strong> (${locationAddress}).</p>
          <p>The QR code is attached to this email as a PNG file. You can:</p>
          <ul>
            <li>Print it in color on 8.5" x 11" paper or larger</li>
            <li>Place it in high-visibility areas: checkout counter, entrance, or waiting area</li>
            <li>Customers scan to instantly access your partner offers and nearby deals</li>
          </ul>
          <p>Best regards,<br>The OfferAve Team</p>
        `,
        attachments: [
          {
            filename: `${locationName.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`,
            content: buffer,
          },
        ],
      });

      console.log("QR code email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-location-qr function:", error);
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
