-- Add unique referral code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from first 3 letters of first name + first 3 letters of last name
  base_code := UPPER(LEFT(COALESCE(first_name, 'USER'), 3) || LEFT(COALESCE(last_name, 'REF'), 3));
  final_code := base_code;
  
  -- Check if code exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to award referral points
CREATE OR REPLACE FUNCTION public.award_referral_points(referrer_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  referrer_user_id UUID;
  current_week_start DATE;
BEGIN
  -- Calculate the start of the current week (Monday)
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  -- Find the referrer by code
  SELECT user_id INTO referrer_user_id
  FROM public.profiles
  WHERE referral_code = referrer_code
  LIMIT 1;
  
  -- Award 3 points to the referrer if they exist
  IF referrer_user_id IS NOT NULL THEN
    INSERT INTO public.weekly_leaderboard (user_id, week_start_date, points, redemptions_referred)
    VALUES (referrer_user_id, current_week_start, 3, 1)
    ON CONFLICT (user_id, week_start_date)
    DO UPDATE SET 
      points = weekly_leaderboard.points + 3,
      redemptions_referred = weekly_leaderboard.redemptions_referred + 1,
      updated_at = now();
  END IF;
END;
$$;

-- Update existing profiles to have referral codes
UPDATE public.profiles 
SET referral_code = public.generate_referral_code(first_name, last_name)
WHERE referral_code IS NULL;

-- Update the handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := public.generate_referral_code(
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  INSERT INTO public.profiles (user_id, first_name, last_name, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    new_referral_code
  );
  RETURN NEW;
END;
$$;