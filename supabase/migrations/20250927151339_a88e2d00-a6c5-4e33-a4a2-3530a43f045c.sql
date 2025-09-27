-- Fix RLS security issues
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get member ID for current user
CREATE OR REPLACE FUNCTION public.get_current_user_member_id_for_storage()
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
  WHERE user_id = auth.uid()
  AND approved = true
  AND active = true
  LIMIT 1;
  
  RETURN member_uuid;
END;
$$;

-- Drop existing conflicting storage policies for profiles bucket
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can view profile images" ON storage.objects;

-- Create new storage policies that properly handle member ID mapping
CREATE POLICY "Members can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can view profile images"
ON storage.objects FOR SELECT  
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can update profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can delete profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);