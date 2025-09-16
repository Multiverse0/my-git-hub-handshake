-- Enable Row Level Security on all tables that have policies defined
-- This fixes the critical security issue where policies exist but RLS is disabled

ALTER TABLE public.member_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;