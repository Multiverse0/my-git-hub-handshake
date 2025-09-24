-- Fix RLS security issues by enabling RLS on tables that have policies
-- This addresses linter warnings about policies existing without RLS enabled

-- Enable RLS on organization_members (has policies but RLS disabled)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_admins (has policies but RLS disabled) 
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on super_users (has policies but RLS disabled)
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- Verify RLS is now enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organization_members', 'organization_admins', 'super_users');