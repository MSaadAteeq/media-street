-- Create OfferX subscriptions table
CREATE TABLE public.offerx_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.offerx_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for OfferX subscriptions
CREATE POLICY "Admin can view all OfferX subscriptions" 
ON public.offerx_subscriptions 
FOR SELECT 
USING (auth.email() = 'admin@offerave.com');

CREATE POLICY "Users can view their own OfferX subscription" 
ON public.offerx_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own OfferX subscription" 
ON public.offerx_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OfferX subscription" 
ON public.offerx_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to get OfferX subscribers for admin
CREATE OR REPLACE FUNCTION public.get_offerx_subscribers()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  store_name TEXT,
  location_count BIGINT,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  monthly_charge NUMERIC,
  is_active BOOLEAN
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
    s.user_id,
    au.email as user_email,
    p.first_name,
    p.last_name,
    p.store_name,
    COALESCE(l.location_count, 0) as location_count,
    s.subscription_started_at,
    (COALESCE(l.location_count, 0) * 5.00)::NUMERIC as monthly_charge,
    s.is_active
  FROM public.offerx_subscriptions s
  LEFT JOIN auth.users au ON s.user_id = au.id
  LEFT JOIN public.profiles p ON s.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as location_count
    FROM public.locations
    GROUP BY user_id
  ) l ON s.user_id = l.user_id
  WHERE s.is_active = true
  ORDER BY s.subscription_started_at DESC;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_offerx_subscriptions_updated_at
BEFORE UPDATE ON public.offerx_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();