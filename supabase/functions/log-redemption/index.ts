import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { redemption_code, offer_id } = await req.json();

    if (!redemption_code || !offer_id) {
      throw new Error('Missing redemption_code or offer_id');
    }

    console.log('Processing redemption for user:', user.id, 'code:', redemption_code, 'offer:', offer_id);

    // Validate the offer exists and is active
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, location:locations(name)')
      .eq('id', offer_id)
      .eq('is_active', true)
      .single();

    if (offerError || !offer) {
      throw new Error('Offer not found or inactive');
    }

    // Check redemption window
    const today = new Date().toISOString().split('T')[0];
    if (offer.redemption_start_date && today < offer.redemption_start_date) {
      throw new Error('Redemption period has not started');
    }
    if (offer.redemption_end_date && today > offer.redemption_end_date) {
      throw new Error('Redemption period has ended');
    }

    // Check if this code has already been used
    const { data: existingRedemption } = await supabase
      .from('offer_redemptions')
      .select('id')
      .eq('redemption_code', redemption_code)
      .single();

    if (existingRedemption) {
      throw new Error('This redemption code has already been used');
    }

    // Get the user's profile to find referring retailer
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('store_name')
      .eq('user_id', user.id)
      .single();

    // Find the partnership to determine referring retailer
    let referringStore = null;
    const { data: partnerships } = await supabase
      .from('partnerships')
      .select('*')
      .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`);

    if (partnerships && partnerships.length > 0) {
      // For now, we'll use the first partnership found
      // In a real implementation, you might want to encode the referring store in the redemption code
      const partnership = partnerships[0];
      const partnerId = partnership.partner1_id === user.id ? partnership.partner2_id : partnership.partner1_id;
      
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('store_name')
        .eq('user_id', partnerId)
        .single();
        
      referringStore = partnerProfile?.store_name;
    }

    // Create the redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('offer_redemptions')
      .insert({
        offer_id,
        location_id: offer.location_id,
        redemption_code,
        referring_store: referringStore,
      })
      .select('id')
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      throw new Error('Failed to create redemption record');
    }

    console.log('Created redemption:', redemption.id);

    // Award points using the database function
    if (referringStore) {
      const { error: pointsError } = await supabase.rpc('award_redemption_points', {
        redemption_id: redemption.id,
        redeeming_user_id: user.id,
        referring_store_name: referringStore
      });

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't throw here - redemption is already logged
      } else {
        console.log('Points awarded successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        redemption_id: redemption.id,
        referring_store: referringStore,
        points_awarded: referringStore ? 2 : 1 // 1 for redeemer + 1 for referrer if exists
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in log-redemption function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to log redemption' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});