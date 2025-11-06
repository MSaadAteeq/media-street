-- Create locations table to track retail locations per user
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for locations
CREATE POLICY "Users can view their own locations" 
ON public.locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
ON public.locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
ON public.locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
ON public.locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create partnerships table to track completed partnerships with metrics
CREATE TABLE public.partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_request_id UUID REFERENCES public.partner_requests(id) ON DELETE SET NULL,
  impressions_partner1 INTEGER DEFAULT 0,
  impressions_partner2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partnerships
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Create policies for partnerships
CREATE POLICY "Users can view their own partnerships" 
ON public.partnerships 
FOR SELECT 
USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);

-- Add admin policies that can view all data (will be used by admin functions)
CREATE POLICY "Admin can view all locations" 
ON public.locations 
FOR SELECT 
USING (auth.email() = 'admin@offerave.com');

CREATE POLICY "Admin can view all partnerships" 
ON public.partnerships 
FOR SELECT 
USING (auth.email() = 'admin@offerave.com');

-- Create trigger for locations updated_at
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for partnerships updated_at
CREATE TRIGGER update_partnerships_updated_at
BEFORE UPDATE ON public.partnerships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get admin analytics data
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  first_name text,
  last_name text,
  store_name text,
  created_at timestamp with time zone,
  location_count bigint,
  partnership_count bigint,
  total_impressions bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF auth.email() != 'admin@offerave.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email as user_email,
    p.first_name,
    p.last_name,
    p.store_name,
    p.created_at,
    COALESCE(l.location_count, 0) as location_count,
    COALESCE(pt.partnership_count, 0) as partnership_count,
    COALESCE(pt.total_impressions, 0) as total_impressions
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as location_count
    FROM public.locations
    GROUP BY user_id
  ) l ON au.id = l.user_id
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) as partnership_count,
      SUM(total_impressions) as total_impressions
    FROM (
      SELECT partner1_id as user_id, impressions_partner1 + impressions_partner2 as total_impressions
      FROM public.partnerships
      UNION ALL
      SELECT partner2_id as user_id, impressions_partner1 + impressions_partner2 as total_impressions
      FROM public.partnerships
    ) combined
    GROUP BY user_id
  ) pt ON au.id = pt.user_id
  ORDER BY p.created_at DESC;
END;
$$;