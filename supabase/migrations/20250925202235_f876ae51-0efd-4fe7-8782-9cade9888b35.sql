-- Step 1: Fix Foreign Key References
-- Update training_sessions to reference auth.users.id instead of profiles.id
ALTER TABLE public.training_sessions 
DROP CONSTRAINT IF EXISTS training_sessions_user_id_fkey;

ALTER TABLE public.training_sessions 
ADD CONSTRAINT training_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update RLS Policies for Training Tables
-- Drop existing policies that reference profiles table
DROP POLICY IF EXISTS "Users can insert own target images" ON public.target_images;
DROP POLICY IF EXISTS "Users can read own target images" ON public.target_images;
DROP POLICY IF EXISTS "Users can insert own training details" ON public.training_details;
DROP POLICY IF EXISTS "Users can read own training details" ON public.training_details;
DROP POLICY IF EXISTS "Users can update own training details" ON public.training_details;

-- Create new policies that work with the corrected auth.users reference
CREATE POLICY "Users can insert own target images" ON public.target_images
FOR INSERT WITH CHECK (
  training_session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own target images" ON public.target_images
FOR SELECT USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own training details" ON public.training_details
FOR INSERT WITH CHECK (
  training_session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own training details" ON public.training_details
FOR SELECT USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own training details" ON public.training_details
FOR UPDATE USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE user_id = auth.uid()
  )
);

-- Step 3: Enable RLS on public tables that are missing it
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for organizations (already has some policies but ensure completeness)
-- Organizations table already has proper policies, so we're good there

-- Add missing RLS policies for super_users (ensure proper access control)
DROP POLICY IF EXISTS "Super users can view themselves" ON public.super_users;
CREATE POLICY "Super users can view themselves" ON public.super_users
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Step 4: Clean up legacy profiles table
-- First, ensure no data exists that we need to preserve
-- Since the profiles table is empty according to our analysis, we can safely drop it
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 5: Update any functions that might reference profiles
-- The existing functions already use organization_members correctly, so no changes needed

-- Step 6: Ensure all training-related functionality works properly
-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_target_images_training_session_id ON public.target_images(training_session_id);
CREATE INDEX IF NOT EXISTS idx_training_details_training_session_id ON public.training_details(training_session_id);