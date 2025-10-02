-- Fix 1: Update get_current_user_member_id_for_storage to not filter by approved/active
-- This allows all authenticated members to upload documents regardless of approval status
CREATE OR REPLACE FUNCTION public.get_current_user_member_id_for_storage()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_uuid uuid;
BEGIN
  -- Get member_id for current auth user without filtering by approved/active
  -- This allows uploads even before approval
  SELECT id INTO member_uuid
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN member_uuid;
END;
$function$;

-- Fix 2: Add transitional policy for documents bucket to support both path formats
-- This allows paths like "documents/{memberId}/file.pdf" and "{memberId}/file.pdf"
CREATE POLICY "Members can upload documents (transitional path support)"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (
    -- Support relative path: {memberId}/filename
    (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
    OR
    -- Support old path format temporarily: documents/{memberId}/filename  
    (name LIKE 'documents/%' AND (storage.foldername(name))[2] = get_current_user_member_id_for_storage()::text)
  )
);

-- Add transitional SELECT policy
CREATE POLICY "Members can view documents (transitional path support)"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
    OR
    (name LIKE 'documents/%' AND (storage.foldername(name))[2] = get_current_user_member_id_for_storage()::text)
  )
);

-- Add transitional UPDATE policy
CREATE POLICY "Members can update documents (transitional path support)"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
    OR
    (name LIKE 'documents/%' AND (storage.foldername(name))[2] = get_current_user_member_id_for_storage()::text)
  )
);

-- Add transitional DELETE policy
CREATE POLICY "Members can delete documents (transitional path support)"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    (storage.foldername(name))[1] = get_current_user_member_id_for_storage()::text
    OR
    (name LIKE 'documents/%' AND (storage.foldername(name))[2] = get_current_user_member_id_for_storage()::text)
  )
);