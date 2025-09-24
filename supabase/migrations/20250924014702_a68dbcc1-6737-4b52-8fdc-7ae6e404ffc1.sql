-- Enable Row Level Security on all tables that have RLS policies
-- This is critical for the Profile page and all other functionality to work properly

-- Enable RLS on organization_members (critical for Profile page)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table (backup profile table)  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_admins (admin permissions)
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on super_users (super admin access)
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on member_training_sessions (training data)
ALTER TABLE public.member_training_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organizations (organization info)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training locations
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training session details
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session target images
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email delivery logs
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email settings
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on target images
ALTER TABLE public.target_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training details
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training sessions
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on range locations (if policies are added later)
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;

-- Update the set_user_context function to ensure proper email context setting
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