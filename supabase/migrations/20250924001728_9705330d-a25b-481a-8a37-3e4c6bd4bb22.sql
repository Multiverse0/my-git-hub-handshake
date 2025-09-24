-- Enable Row Level Security on all required tables
-- This ensures the existing RLS policies can take effect

-- Enable RLS on organization_members (critical for profile functionality)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table 
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on member_training_sessions
ALTER TABLE public.member_training_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_admins
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organizations (should be enabled but ensuring it)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on super_users
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training_locations
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training_session_details
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session_target_images
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_delivery_logs
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_settings
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Verify user context function is working properly by updating it
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