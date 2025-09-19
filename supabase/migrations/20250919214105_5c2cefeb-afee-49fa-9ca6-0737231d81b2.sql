-- Update storage RLS policies to work with organization_members system

-- First, drop existing document policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new storage policies that work with organization_members system
-- Policy for document uploads using member ID from organization_members
CREATE POLICY "Organization members can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE id::text = (storage.foldername(name))[1] 
    AND email = current_setting('app.current_user_email', true)
  )
);

-- Policy for viewing documents - members can view their own documents
CREATE POLICY "Organization members can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE id::text = (storage.foldername(name))[1] 
    AND email = current_setting('app.current_user_email', true)
  )
);

-- Policy for updating documents - members can update their own documents
CREATE POLICY "Organization members can update their own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE id::text = (storage.foldername(name))[1] 
    AND email = current_setting('app.current_user_email', true)
  )
);

-- Policy for deleting documents - members can delete their own documents
CREATE POLICY "Organization members can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE id::text = (storage.foldername(name))[1] 
    AND email = current_setting('app.current_user_email', true)
  )
);

-- Also ensure profiles bucket works correctly with auth.uid() for auth-based users
-- but also allow organization members to upload profile images
DROP POLICY IF EXISTS "Organization members can upload profile images" ON storage.objects;
CREATE POLICY "Organization members can upload profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE id::text = (storage.foldername(name))[1] 
      AND email = current_setting('app.current_user_email', true)
    )
  )
);

-- Update profile viewing policy to include organization members
DROP POLICY IF EXISTS "Organization members can view profile images" ON storage.objects;
CREATE POLICY "Organization members can view profile images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profiles' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE id::text = (storage.foldername(name))[1] 
      AND email = current_setting('app.current_user_email', true)
    )
  )
);