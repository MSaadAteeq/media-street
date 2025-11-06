import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName } = await req.json();

    if (!businessName) {
      return new Response(
        JSON.stringify({ error: 'Business name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for logo for business:', businessName);

    // Use Brave Search API to find the logo
    const braveApiKey = Deno.env.get('BRAVE_API_KEY');
    if (!braveApiKey) {
      console.error('BRAVE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Search API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for the business logo
    const searchQuery = `${businessName} logo transparent png`;
    const searchResponse = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(searchQuery)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': braveApiKey,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Brave Search API error:', await searchResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to search for logo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', searchData);

    if (!searchData.results || searchData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No logo found', logoUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first result's image URL
    const logoUrl = searchData.results[0].thumbnail?.src || searchData.results[0].url;

    console.log('Found logo URL:', logoUrl);

    return new Response(
      JSON.stringify({ logoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-business-logo:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
