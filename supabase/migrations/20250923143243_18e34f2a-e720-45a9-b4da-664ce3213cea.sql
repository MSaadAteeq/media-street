-- Fix the get_offerai_subscribers function with proper column aliasing to avoid ambiguous references
CREATE OR REPLACE FUNCTION public.get_offerai_subscribers()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  store_name TEXT,
  location_count BIGINT,
  active_partnerships BIGINT,
  available_partnerships INTEGER,
  earliest_subscription_date TIMESTAMP WITH TIME ZONE,
  partnership_charge_per_request NUMERIC,
  locations JSON
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF auth.email() != 'admin@offerave.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    ais.user_id,
    au.email as user_email,
    p.first_name,
    p.last_name,
    p.store_name,
    COALESCE(l.location_count, 0) as location_count,
    COALESCE(pt.partnership_count, 0) as active_partnerships,
    (5 - COALESCE(pt.partnership_count, 0))::INTEGER as available_partnerships,
    MIN(ais.subscription_started_at) as earliest_subscription_date,
    MAX(ais.partnership_charge_per_request) as partnership_charge_per_request,
    COALESCE(l.locations_json, '[]'::JSON) as locations
  FROM public.offerai_subscriptions ais
  LEFT JOIN auth.users au ON ais.user_id = au.id
  LEFT JOIN public.profiles p ON ais.user_id = p.user_id
  LEFT JOIN (
    SELECT 
      loc.user_id, 
      COUNT(*) as location_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', loc.id,
          'name', loc.name,
          'address', loc.address,
          'created_at', loc.created_at
        )
      ) as locations_json
    FROM public.locations loc
    GROUP BY loc.user_id
  ) l ON ais.user_id = l.user_id
  LEFT JOIN (
    SELECT 
      combined.user_id, 
      COUNT(*) as partnership_count
    FROM (
      SELECT partner1_id as user_id FROM public.partnerships
      UNION ALL
      SELECT partner2_id as user_id FROM public.partnerships
    ) combined
    GROUP BY combined.user_id
  ) pt ON ais.user_id = pt.user_id
  WHERE ais.is_active = true
  GROUP BY ais.user_id, au.email, p.first_name, p.last_name, p.store_name, l.location_count, l.locations_json, pt.partnership_count
  ORDER BY earliest_subscription_date DESC;
END;
$$;