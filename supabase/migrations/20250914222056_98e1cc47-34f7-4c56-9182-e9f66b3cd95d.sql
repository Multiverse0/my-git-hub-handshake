-- Fix critical RLS security issues that are causing loading problems

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

-- 4. Add missing RLS policies for tables that need them
CREATE POLICY "Organization members can view training locations" 
ON public.training_locations 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE email = current_setting('app.current_user_email', true)
  ) 
  OR EXISTS (
    SELECT 1 FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND active = true
  )
);

CREATE POLICY "Range locations are publicly viewable" 
ON public.range_locations 
FOR SELECT 
USING (true);

-- 5. Add policy to allow super users to manage training locations
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

-- 6. Add policy to allow admins to manage training locations for their organization
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