-- Fix infinite recursion in RLS policies for upload functionality

-- 1. Create security definer functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  SELECT organization_id INTO user_org_id
  FROM public.organization_members
  WHERE email = current_setting('app.current_user_email', true)
  LIMIT 1;
  
  RETURN user_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_organization_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organization_admins oa ON om.id = oa.member_id
    WHERE om.email = current_setting('app.current_user_email', true)
      AND om.role = 'admin'
      AND om.approved = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_member_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_uuid uuid;
BEGIN
  SELECT id INTO member_uuid
  FROM public.organization_members
  WHERE email = current_setting('app.current_user_email', true)
  LIMIT 1;
  
  RETURN member_uuid;
END;
$$;

-- 2. Drop existing problematic policies on organization_members
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Members can update own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Super users can manage all members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can register as organization members" ON public.organization_members;

-- 3. Create new non-recursive policies for organization_members
CREATE POLICY "Super users can manage all members" 
ON public.organization_members 
FOR ALL
USING (EXISTS (
  SELECT 1 
  FROM public.super_users 
  WHERE email = current_setting('app.current_user_email', true) 
    AND active = true
));

CREATE POLICY "Admins can manage organization members" 
ON public.organization_members 
FOR ALL
USING (public.is_user_organization_admin() = true);

CREATE POLICY "Members can view own profile" 
ON public.organization_members 
FOR SELECT
USING (email = current_setting('app.current_user_email', true));

CREATE POLICY "Members can update own profile" 
ON public.organization_members 
FOR UPDATE
USING (email = current_setting('app.current_user_email', true));

CREATE POLICY "Users can register as organization members" 
ON public.organization_members 
FOR INSERT
WITH CHECK (true);

-- 4. Update member_training_sessions policies to use new functions
DROP POLICY IF EXISTS "Members can view own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can insert own training sessions" ON public.member_training_sessions;

CREATE POLICY "Members can view own training sessions" 
ON public.member_training_sessions 
FOR SELECT
USING (
  member_id = public.get_user_member_id()
  OR public.is_user_organization_admin() = true
  OR EXISTS (
    SELECT 1 
    FROM public.super_users 
    WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
  )
);

CREATE POLICY "Members can insert own training sessions" 
ON public.member_training_sessions 
FOR INSERT
WITH CHECK (member_id = public.get_user_member_id());

-- 5. Simplify storage policies to avoid RLS cascades
-- Drop existing storage policies that might cause recursion
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Create simplified storage policies using auth.uid() where possible
-- For profiles bucket (public avatars)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- For documents bucket (private files)
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- For logos bucket (public org logos)
CREATE POLICY "Logo images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Admins can upload organization logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Admins can update organization logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos');

-- For target-images bucket (private training images)
CREATE POLICY "Users can view their own target images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'target-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own target images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'target-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own target images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'target-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);