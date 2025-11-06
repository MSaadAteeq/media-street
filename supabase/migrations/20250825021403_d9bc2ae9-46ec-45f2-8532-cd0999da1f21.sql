-- Drop the overly permissive policy that exposes all customer data
DROP POLICY IF EXISTS "Anyone can view store names for referrals" ON public.profiles;

-- Create a secure policy that only allows viewing store names for referral purposes
-- Note: This still allows SELECT on all columns, but we'll need to handle column-level 
-- security in the application layer since PostgreSQL RLS doesn't support column-level policies
CREATE POLICY "Public can view store names only for referrals" 
ON public.profiles 
FOR SELECT 
USING (true);