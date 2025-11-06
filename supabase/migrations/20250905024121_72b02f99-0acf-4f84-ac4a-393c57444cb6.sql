-- Create partner_requests table
CREATE TABLE public.partner_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for partner requests
CREATE POLICY "Users can view their own partner requests" 
ON public.partner_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create partner requests" 
ON public.partner_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update partner requests" 
ON public.partner_requests 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_partner_requests_updated_at
BEFORE UPDATE ON public.partner_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();