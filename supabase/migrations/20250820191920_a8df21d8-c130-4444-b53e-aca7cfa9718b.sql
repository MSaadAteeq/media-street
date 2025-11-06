-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.get_store_names_for_autocomplete(search_term TEXT DEFAULT '')
RETURNS TABLE(store_name TEXT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;