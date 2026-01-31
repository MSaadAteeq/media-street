/**
 * Generate offer from website - tries backend first, falls back to Supabase Edge Function.
 * Normalizes response format from both sources.
 */
import { post } from "@/services/apis";

export interface GenerateOfferResult {
  success: boolean;
  data?: {
    callToAction?: string;
    businessName?: string;
    offerImageUrl?: string;
    brandLogoUrl?: string;
    colors?: { primary: string; secondary: string };
    brandColors?: { primary: string; secondary: string };
    pageTitle?: string;
    faviconUrl?: string;
    targetAudience?: string;
  };
  message?: string;
}

function normalizeResponse(raw: unknown): GenerateOfferResult {
  if (!raw || typeof raw !== "object") {
    return { success: false, message: "Invalid response" };
  }
  const obj = raw as Record<string, unknown>;

  // Backend format: { success: true, data: { callToAction, businessName, ... } }
  if (obj.data && typeof obj.data === "object") {
    return {
      success: (obj.success as boolean) ?? true,
      data: obj.data as GenerateOfferResult["data"],
      message: obj.message as string | undefined,
    };
  }

  // Supabase format: { callToAction, businessName, offerImageUrl, ... } (no wrapper)
  const supabaseObj = obj as Record<string, unknown>;
  if (typeof supabaseObj.callToAction === "string") {
    const colors =
      (supabaseObj.colors as { primary?: string; secondary?: string }) ||
      (supabaseObj.brandColors as { primary?: string; secondary?: string });
    return {
      success: true,
      data: {
        callToAction: supabaseObj.callToAction as string,
        businessName: supabaseObj.businessName as string | undefined,
        offerImageUrl: supabaseObj.offerImageUrl as string | undefined,
        brandLogoUrl: supabaseObj.brandLogoUrl as string | undefined,
        colors: colors as { primary: string; secondary: string } | undefined,
        brandColors: colors as { primary: string; secondary: string } | undefined,
        pageTitle: supabaseObj.pageTitle as string | undefined,
        faviconUrl: supabaseObj.faviconUrl as string | undefined,
        targetAudience: supabaseObj.targetAudience as string | undefined,
      },
    };
  }

  return {
    success: (obj.success as boolean) ?? false,
    message: (obj.message as string) || "Invalid response format",
  };
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const obj = error as Record<string, unknown>;
  const msg =
    (obj.response as Record<string, unknown> | undefined)?.data as
      | Record<string, unknown>
      | undefined;
  if (msg?.message && typeof msg.message === "string") return msg.message;
  if (obj.message && typeof obj.message === "string") return obj.message;
  return "An unexpected error occurred.";
}

/**
 * Generate offer from website URL.
 * Tries backend first; on failure (network, 500, timeout), falls back to Supabase Edge Function.
 */
export async function generateOfferFromWebsite(
  website: string,
  options?: { regenerateImage?: boolean }
): Promise<GenerateOfferResult> {
  const body = options?.regenerateImage
    ? { website, regenerateImage: true }
    : { website };

  // 1. Try backend first
  try {
    const response = await post({
      end_point: "offers/generate-from-website",
      body,
      token: false,
      configuration: { params: body, timeout: 120000 },
    });
    return normalizeResponse(response);
  } catch (backendError) {
    const errorMsg = extractErrorMessage(backendError);
    const isNetworkError =
      errorMsg.includes("ECONNREFUSED") ||
      errorMsg.includes("Cannot connect") ||
      errorMsg.includes("No response") ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("Network Error");

    // If backend failed due to network/unavailability, try Supabase fallback
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (
      (isNetworkError || errorMsg.includes("Something went wrong")) &&
      supabaseUrl &&
      supabaseKey
    ) {
      try {
        const fnUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/generate-offer-from-website`;
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ website }),
          signal: AbortSignal.timeout(120000),
        });

        const json = await res.json();

        if (!res.ok) {
          const errMsg =
            json?.error || json?.message || `Supabase function failed (${res.status})`;
          return {
            success: false,
            message: errMsg,
          };
        }

        return normalizeResponse(json);
      } catch (supabaseError) {
        const supabaseMsg = extractErrorMessage(supabaseError);
        if (supabaseMsg.includes("not configured")) {
          return {
            success: false,
            message:
              "The AI feature is not configured. Please ensure GEMINI_API_KEY and LOVABLE_API_KEY are set in Supabase.",
          };
        }
        return {
          success: false,
          message: supabaseMsg || errorMsg,
        };
      }
    }

    return {
      success: false,
      message: errorMsg,
    };
  }
}
