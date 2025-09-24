-- Fix: Ensure Row Level Security is enabled on organization_members table
-- This is critical for the Profile page to work properly with RLS policies

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Verify the table structure and ensure it's ready for RLS
-- The existing policies should work once RLS is enabled:
-- - Members can view own profile (email = current_setting('app.current_user_email'))
-- - Admins can manage organization members (is_user_organization_admin() = true)  
-- - Super users can manage all members

-- Double-check that the user context function exists and works properly
CREATE OR REPLACE FUNCTION public.set_user_context(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set the user email context for RLS policies  
  PERFORM set_config('app.current_user_email', user_email, true);
  
  -- Log for debugging
  RAISE NOTICE 'User context set for email: %', user_email;
END;
$$;