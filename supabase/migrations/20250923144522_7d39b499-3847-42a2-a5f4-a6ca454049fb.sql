-- Create promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for promo codes (admin only for management)
CREATE POLICY "Admin can manage all promo codes" 
ON public.promo_codes 
FOR ALL
USING (auth.email() = 'admin@offerave.com');

-- Create policy for users to view active promo codes (for validation)
CREATE POLICY "Users can view active promo codes for validation" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);

-- Create function to validate and track promo code usage
CREATE OR REPLACE FUNCTION public.validate_promo_code(promo_code_text TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  code TEXT,
  description TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Find the promo code
  SELECT pc.code, pc.description, pc.is_active, pc.max_uses, pc.current_uses
  INTO promo_record
  FROM public.promo_codes pc
  WHERE UPPER(pc.code) = UPPER(promo_code_text);
  
  -- Check if code exists and is valid
  IF promo_record.code IS NOT NULL 
     AND promo_record.is_active = true 
     AND (promo_record.max_uses IS NULL OR promo_record.current_uses < promo_record.max_uses) THEN
    RETURN QUERY SELECT true, promo_record.code, promo_record.description;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Create function to increment promo code usage
CREATE OR REPLACE FUNCTION public.use_promo_code(promo_code_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Increment usage count
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE UPPER(code) = UPPER(promo_code_text)
    AND is_active = true
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default promo codes
INSERT INTO public.promo_codes (code, description, max_uses) VALUES 
('FREEPARTNER', 'Free partnership activation', NULL),
('WAIVE10', 'Waive $10 partnership fee', NULL),
('NOCHARGE', 'No charge for partnership', NULL),
('PARTNERSHIP', 'Partnership fee waiver', NULL),
('FREE2024', '2024 partnership promotion', 100);