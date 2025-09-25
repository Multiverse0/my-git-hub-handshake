-- Step 1: Enable RLS on organization_members table (CRITICAL SECURITY FIX)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Update organization_members RLS policies for consistency
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can update own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Users can register as organization members" ON public.organization_members;

-- Create comprehensive RLS policies for organization_members
CREATE POLICY "Super users can manage all organization members" 
ON public.organization_members 
FOR ALL 
USING (is_current_user_super_user() = true);

CREATE POLICY "Organization admins can manage their org members" 
ON public.organization_members 
FOR ALL 
USING (
  (is_current_user_organization_admin() = true AND organization_id = get_current_user_organization_id()) 
  OR (is_current_user_super_user() = true)
);

CREATE POLICY "Members can view and update own profile" 
ON public.organization_members 
FOR SELECT 
USING (auth.uid() = user_id OR is_current_user_organization_admin() = true OR is_current_user_super_user() = true);

CREATE POLICY "Members can update own profile data" 
ON public.organization_members 
FOR UPDATE 
USING (auth.uid() = user_id OR is_current_user_organization_admin() = true OR is_current_user_super_user() = true);

CREATE POLICY "New users can register as organization members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Step 3: Fix storage policies for logos bucket
-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Organization admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Organization admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'logos' AND 
  (is_current_user_organization_admin() = true OR is_current_user_super_user() = true)
);

CREATE POLICY "Organization admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'logos' AND 
  (is_current_user_organization_admin() = true OR is_current_user_super_user() = true)
);

CREATE POLICY "Logos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

-- Step 4: Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_email ON public.organization_members(email);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);

-- Step 5: Create helper function for getting member profile with fallback
CREATE OR REPLACE FUNCTION public.get_current_user_member_profile()
RETURNS SETOF public.organization_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.organization_members
  WHERE user_id = auth.uid()
  AND approved = true
  AND active = true
  LIMIT 1;
END;
$$;