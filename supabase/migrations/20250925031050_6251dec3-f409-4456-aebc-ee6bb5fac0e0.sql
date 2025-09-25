-- Fix member approval and auto-linking system
-- This migration adds auto-linking functionality and repairs existing data

-- 1. Create function to automatically link members to auth users by email
CREATE OR REPLACE FUNCTION public.link_member_to_auth_user(member_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Find auth user by email
  SELECT au.id INTO auth_user_id
  FROM auth.users au
  WHERE au.email = member_email;
  
  -- Update organization_members with the auth user_id
  IF auth_user_id IS NOT NULL THEN
    UPDATE organization_members 
    SET user_id = auth_user_id, updated_at = now()
    WHERE email = member_email AND user_id IS NULL;
  END IF;
  
  RETURN auth_user_id;
END;
$$;

-- 2. Create improved trigger for auto-linking new auth users
CREATE OR REPLACE FUNCTION public.auto_link_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new auth user is created, try to link them to existing organization_member
  UPDATE organization_members 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_new_auth_user();

-- 3. Create data repair function to fix existing unlinked approved members
CREATE OR REPLACE FUNCTION public.repair_unlinked_members()
RETURNS TABLE(
  member_id uuid,
  member_email text,
  auth_user_id uuid,
  linked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Try to find matching auth user
    SELECT au.id INTO found_auth_id
    FROM auth.users au
    WHERE au.email = member_record.email;
    
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
$$;

-- 4. Run the repair function to fix existing data
SELECT * FROM public.repair_unlinked_members();