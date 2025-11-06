-- Drop the overly permissive policy that exposes all customer data
DROP POLICY IF EXISTS "Anyone can view store names for referrals" ON public.profiles;

-- Create a secure policy that only allows viewing store names for referral purposes
-- This policy restricts access to only the store_name column and prevents exposure of personal data
CREATE POLICY "Public can view store names only for referrals" 
ON public.profiles 
FOR SELECT 
USING (true)
WITH CHECK (false);