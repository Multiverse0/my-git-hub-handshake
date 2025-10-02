-- Fix storage RLS policies to use member_id instead of auth.uid()
-- This aligns with the app's member-centric architecture

-- Drop existing policies for documents bucket
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new policies using member_id
CREATE POLICY "Members can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);

CREATE POLICY "Members can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
);