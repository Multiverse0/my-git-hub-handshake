-- Fix the remaining trigger functions and remove the problematic auth.users access

-- Drop the problematic triggers first
DROP TRIGGER IF EXISTS sync_member_to_profile_trigger ON public.organization_members;
DROP TRIGGER IF EXISTS sync_profile_to_member_trigger ON public.profiles;

-- Drop the problematic functions
DROP FUNCTION IF EXISTS public.sync_member_to_profile();
DROP FUNCTION IF EXISTS public.sync_profile_to_member();

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- We no longer need the sync functions since we're using organization_members as the primary source
-- The profile data will be accessed directly from organization_members in the frontend