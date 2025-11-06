-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_id UUID NOT NULL,
  call_to_action TEXT NOT NULL,
  offer_image_url TEXT,
  brand_logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create offer_redemptions table
CREATE TABLE public.offer_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL,
  location_id UUID NOT NULL,
  referring_store TEXT,
  redemption_code TEXT NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offers
CREATE POLICY "Users can view their own offers" 
ON public.offers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offers" 
ON public.offers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers" 
ON public.offers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for offer_redemptions
CREATE POLICY "Users can view redemptions for their offers" 
ON public.offer_redemptions 
FOR SELECT 
USING (
  offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create redemptions" 
ON public.offer_redemptions 
FOR INSERT 
WITH CHECK (true);

-- Admin policies
CREATE POLICY "Admin can view all offers" 
ON public.offers 
FOR SELECT 
USING (auth.email() = 'admin@offerave.com');

CREATE POLICY "Admin can view all redemptions" 
ON public.offer_redemptions 
FOR SELECT 
USING (auth.email() = 'admin@offerave.com');

-- Create foreign key relationships
ALTER TABLE public.offers 
ADD CONSTRAINT offers_location_id_fkey 
FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.offer_redemptions 
ADD CONSTRAINT offer_redemptions_offer_id_fkey 
FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;

ALTER TABLE public.offer_redemptions 
ADD CONSTRAINT offer_redemptions_location_id_fkey 
FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_offers_location_id ON public.offers(location_id);
CREATE INDEX idx_offer_redemptions_offer_id ON public.offer_redemptions(offer_id);
CREATE INDEX idx_offer_redemptions_location_id ON public.offer_redemptions(location_id);
CREATE INDEX idx_offer_redemptions_redeemed_at ON public.offer_redemptions(redeemed_at);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure unique constraint: one offer per location per user
ALTER TABLE public.offers 
ADD CONSTRAINT unique_offer_per_location_per_user 
UNIQUE (user_id, location_id);