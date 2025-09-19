-- Enable Row Level Security on profiles table
-- This is required because RLS policies exist but RLS is not enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify that existing policies are sufficient
-- The policies already exist and should work once RLS is enabled:
-- 1. "Allow authenticated users to create their own profile" - INSERT policy 
-- 2. "Users can read own profile" - SELECT policy
-- 3. "Users can update own profile" - UPDATE policy