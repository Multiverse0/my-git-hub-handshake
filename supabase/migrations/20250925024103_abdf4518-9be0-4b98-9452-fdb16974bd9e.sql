-- Fix infinite recursion in RLS policies - Part 3: Complete cleanup and recreation
-- This migration drops ALL policies from ALL tables and recreates them properly

-- Drop ALL policies from ALL tables to ensure complete cleanup

-- Organization members
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can update own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Super users can manage all members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can register as organization members" ON public.organization_members;

-- Member training sessions
DROP POLICY IF EXISTS "Admins can manage training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can insert own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can update own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can view own training sessions" ON public.member_training_sessions;

-- Email preferences
DROP POLICY IF EXISTS "Admins can view org email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can view own email preferences" ON public.email_preferences;

-- Email settings
DROP POLICY IF EXISTS "Organization admins can manage email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Super users can manage all email settings" ON public.email_settings;

-- Email logs
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

-- Email delivery logs
DROP POLICY IF EXISTS "Organization admins can view email delivery logs" ON public.email_delivery_logs;
DROP POLICY IF EXISTS "System can insert email delivery logs" ON public.email_delivery_logs;
DROP POLICY IF EXISTS "System can update email delivery logs" ON public.email_delivery_logs;

-- Training locations
DROP POLICY IF EXISTS "Admins can manage organization training locations" ON public.training_locations;
DROP POLICY IF EXISTS "Super users can manage training locations" ON public.training_locations;
DROP POLICY IF EXISTS "Training locations viewable by organization members" ON public.training_locations;

-- Training session details
DROP POLICY IF EXISTS "Users can insert own training session details" ON public.training_session_details;
DROP POLICY IF EXISTS "Users can update own training session details" ON public.training_session_details;
DROP POLICY IF EXISTS "Users can view own training session details" ON public.training_session_details;

-- Session target images
DROP POLICY IF EXISTS "Users can insert own session target images" ON public.session_target_images;
DROP POLICY IF EXISTS "Users can view own session target images" ON public.session_target_images;

-- Organization admins
DROP POLICY IF EXISTS "Organization admins viewable by super users and org admins" ON public.organization_admins;
DROP POLICY IF EXISTS "Super users can manage organization admins" ON public.organization_admins;

-- Organization settings
DROP POLICY IF EXISTS "Super users can manage organization settings" ON public.organization_settings;

-- Organizations
DROP POLICY IF EXISTS "Organizations are publicly viewable" ON public.organizations;
DROP POLICY IF EXISTS "Super users can manage organizations" ON public.organizations;

-- Training sessions (old table)
DROP POLICY IF EXISTS "Users can insert own training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can read own training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can update own training sessions" ON public.training_sessions;

-- Training details
DROP POLICY IF EXISTS "Users can insert own training details" ON public.training_details;
DROP POLICY IF EXISTS "Users can read own training details" ON public.training_details;
DROP POLICY IF EXISTS "Users can update own training details" ON public.training_details;

-- Target images
DROP POLICY IF EXISTS "Users can insert own target images" ON public.target_images;
DROP POLICY IF EXISTS "Users can read own target images" ON public.target_images;

-- Profiles
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Range locations
DROP POLICY IF EXISTS "Range locations are publicly viewable" ON public.range_locations;

-- Super users
DROP POLICY IF EXISTS "Allow first super user creation when none exist" ON public.super_users;