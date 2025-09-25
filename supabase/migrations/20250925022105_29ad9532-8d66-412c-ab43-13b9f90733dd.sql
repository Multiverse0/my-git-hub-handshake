-- Enable RLS on all remaining tables that have policies or are in public schema

-- Enable RLS on email and logging tables
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training-related tables
ALTER TABLE public.member_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;

-- Enable RLS on image and file tables
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization-related tables
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on location tables
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;