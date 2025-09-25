-- Comprehensive fix for email case-sensitivity issues
-- This migration fixes all email matching problems permanently

-- Step 1: Update link_member_to_auth_user function to use case-insensitive matching
CREATE OR REPLACE FUNCTION public.link_member_to_auth_user(member_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Find auth user by email (case-insensitive)
  SELECT au.id INTO auth_user_id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(member_email);
  
  -- Update organization_members with the auth user_id
  IF auth_user_id IS NOT NULL THEN
    UPDATE organization_members 
    SET user_id = auth_user_id, updated_at = now()
    WHERE LOWER(email) = LOWER(member_email) AND user_id IS NULL;
  END IF;
  
  RETURN auth_user_id;
END;
$function$;

-- Step 2: Update repair_unlinked_members function to use case-insensitive matching
CREATE OR REPLACE FUNCTION public.repair_unlinked_members()
RETURNS TABLE(member_id uuid, member_email text, auth_user_id uuid, linked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_record record;
  found_auth_id uuid;
BEGIN
  -- Find all approved members without user_id
  FOR member_record IN 
    SELECT id, email, full_name
    FROM organization_members 
    WHERE approved = true AND user_id IS NULL
  LOOP
    -- Try to find matching auth user (case-insensitive)
    SELECT au.id INTO found_auth_id
    FROM auth.users au
    WHERE LOWER(au.email) = LOWER(member_record.email);
    
    IF found_auth_id IS NOT NULL THEN
      -- Link the member to auth user
      UPDATE organization_members 
      SET user_id = found_auth_id, updated_at = now()
      WHERE id = member_record.id;
      
      RETURN QUERY SELECT 
        member_record.id,
        member_record.email,
        found_auth_id,
        true;
    ELSE
      RETURN QUERY SELECT 
        member_record.id,
        member_record.email,
        NULL::uuid,
        false;
    END IF;
  END LOOP;
END;
$function$;

-- Step 3: Update auto_link_new_auth_user trigger function to use case-insensitive matching
CREATE OR REPLACE FUNCTION public.auto_link_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When a new auth user is created, try to link them to existing organization_member (case-insensitive)
  UPDATE organization_members 
  SET user_id = NEW.id, updated_at = now()
  WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Normalize all existing email addresses to lowercase
UPDATE organization_members 
SET email = LOWER(email), updated_at = now() 
WHERE email != LOWER(email);

-- Step 5: Create comprehensive repair function that fixes all existing issues
CREATE OR REPLACE FUNCTION public.fix_all_member_links()
RETURNS TABLE(member_id uuid, member_email text, auth_user_id uuid, linked boolean, action_taken text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_record record;
  found_auth_id uuid;
BEGIN
  -- Process all approved members regardless of current user_id status
  FOR member_record IN 
    SELECT id, email, full_name, user_id, approved
    FROM organization_members 
    WHERE approved = true
  LOOP
    -- Try to find matching auth user (case-insensitive)
    SELECT au.id INTO found_auth_id
    FROM auth.users au
    WHERE LOWER(au.email) = LOWER(member_record.email);
    
    IF found_auth_id IS NOT NULL THEN
      IF member_record.user_id IS NULL THEN
        -- Link unlinked member to auth user
        UPDATE organization_members 
        SET user_id = found_auth_id, updated_at = now()
        WHERE id = member_record.id;
        
        RETURN QUERY SELECT 
          member_record.id,
          member_record.email,
          found_auth_id,
          true,
          'linked_new'::text;
      ELSIF member_record.user_id != found_auth_id THEN
        -- Fix incorrect link
        UPDATE organization_members 
        SET user_id = found_auth_id, updated_at = now()
        WHERE id = member_record.id;
        
        RETURN QUERY SELECT 
          member_record.id,
          member_record.email,
          found_auth_id,
          true,
          'fixed_link'::text;
      ELSE
        -- Already correctly linked
        RETURN QUERY SELECT 
          member_record.id,
          member_record.email,
          found_auth_id,
          true,
          'already_linked'::text;
      END IF;
    ELSE
      -- No matching auth user found
      RETURN QUERY SELECT 
        member_record.id,
        member_record.email,
        NULL::uuid,
        false,
        'no_auth_user'::text;
    END IF;
  END LOOP;
END;
$function$;

-- Step 6: Run the comprehensive repair function to fix all existing issues
SELECT * FROM fix_all_member_links();