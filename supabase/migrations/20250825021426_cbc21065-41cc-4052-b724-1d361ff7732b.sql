-- Drop the current policy as it still exposes all columns
DROP POLICY IF EXISTS "Public can view store names only for referrals" ON public.profiles;

-- Create a security definer function that only returns store names for referrals
-- This prevents exposure of any personal information
CREATE OR REPLACE FUNCTION public.get_store_names_for_referrals(search_term text DEFAULT ''::text)
RETURNS TABLE(store_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.store_name
  FROM public.profiles p
  WHERE p.store_name IS NOT NULL 
    AND p.store_name != ''
    AND (search_term = '' OR p.store_name ILIKE '%' || search_term || '%')
  ORDER BY p.store_name
  LIMIT 10;
END;
$$;

-- Remove all public access to the profiles table
-- Users can only access their own data or use the secure function above
-- This ensures no personal information is exposed publicly