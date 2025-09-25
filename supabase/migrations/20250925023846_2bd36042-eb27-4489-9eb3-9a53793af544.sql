-- Fix infinite recursion in RLS policies - Part 1: Drop dependent policies first
-- This migration carefully handles dependencies to avoid cascade issues

-- First, drop all policies that depend on the old functions
DROP POLICY IF EXISTS "Admins can view org email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Organization admins can manage email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Super users can manage all email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Organization admins viewable by super users and org admins" ON public.organization_admins;
DROP POLICY IF EXISTS "Super users can manage organization admins" ON public.organization_admins;
DROP POLICY IF EXISTS "Admins can manage organization training locations" ON public.training_locations;
DROP POLICY IF EXISTS "Training locations viewable by organization members" ON public.training_locations;
DROP POLICY IF EXISTS "Super users can manage training locations" ON public.training_locations;
DROP POLICY IF EXISTS "Users can insert own training session details" ON public.training_session_details;
DROP POLICY IF EXISTS "Users can update own training session details" ON public.training_session_details;
DROP POLICY IF EXISTS "Users can view own training session details" ON public.training_session_details;
DROP POLICY IF EXISTS "Users can insert own session target images" ON public.session_target_images;
DROP POLICY IF EXISTS "Users can view own session target images" ON public.session_target_images;
DROP POLICY IF EXISTS "Organization admins can view email delivery logs" ON public.email_delivery_logs;

-- Now drop the problematic functions
DROP FUNCTION IF EXISTS public.get_user_email_preferences(uuid);
DROP FUNCTION IF EXISTS public.get_organization_admins(uuid);
DROP FUNCTION IF EXISTS public.get_user_member_id();
DROP FUNCTION IF EXISTS public.get_current_user_organization_id();
DROP FUNCTION IF EXISTS public.is_user_organization_admin();
DROP FUNCTION IF EXISTS public.get_current_user_email();
DROP FUNCTION IF EXISTS public.set_user_context(text);

-- Create new security definer functions using auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_member_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_uuid uuid;
BEGIN
  SELECT id INTO member_uuid
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN member_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_uuid uuid;
BEGIN
  SELECT organization_id INTO org_uuid
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_organization_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organization_admins oa ON om.id = oa.member_id
    WHERE om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.approved = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_super_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_super boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.super_users su
    JOIN auth.users u ON u.email = su.email
    WHERE u.id = auth.uid()
      AND su.active = true
  ) INTO is_super;
  
  RETURN is_super;
END;
$$;