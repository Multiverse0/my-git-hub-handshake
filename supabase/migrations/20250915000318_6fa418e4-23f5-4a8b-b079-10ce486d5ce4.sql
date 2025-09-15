-- Fix critical security issues from linter

-- Enable RLS on tables that need it
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_images ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean DEFAULT false)
RETURNS text
LANGUAGE sql
SET search_path = 'public'
AS $$
  SELECT set_config(setting_name, setting_value, is_local);
$$;

CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('app.current_user_id', true))::uuid
  );
$$;