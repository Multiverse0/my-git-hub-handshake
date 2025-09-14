-- Fix critical RLS security issues (skip existing policies)

-- 1. Enable RLS on tables that have policies but RLS disabled  
ALTER TABLE public.member_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on tables that don't have it but should
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;

-- 3. Fix function search paths for security
ALTER FUNCTION public.get_current_user_email() SET search_path = public;
ALTER FUNCTION public.set_user_context(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.uid() SET search_path = public;

-- 4. Add missing policies (create only if they don't exist)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'training_locations' 
    AND policyname = 'Super users can manage training locations'
  ) THEN
    CREATE POLICY "Super users can manage training locations" 
    ON public.training_locations 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM super_users 
        WHERE email = current_setting('app.current_user_email', true) 
        AND active = true
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'training_locations' 
    AND policyname = 'Admins can manage organization training locations'
  ) THEN
    CREATE POLICY "Admins can manage organization training locations" 
    ON public.training_locations 
    FOR ALL 
    USING (
      organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        JOIN organization_admins oa ON om.id = oa.member_id
        WHERE om.email = current_setting('app.current_user_email', true)
      )
    );
  END IF;
END
$$;