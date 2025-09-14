-- Add missing fields to profiles table to match code expectations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS startkort_url TEXT,
ADD COLUMN IF NOT EXISTS diploma_url TEXT,
ADD COLUMN IF NOT EXISTS startkort_file_name TEXT,
ADD COLUMN IF NOT EXISTS diploma_file_name TEXT,
ADD COLUMN IF NOT EXISTS other_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Enable RLS on tables that need it but don't have it enabled
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for session_target_images
CREATE POLICY "Users can view own session target images" 
ON public.session_target_images 
FOR SELECT 
USING (session_id IN (
  SELECT id FROM member_training_sessions 
  WHERE member_id IN (
    SELECT id FROM organization_members 
    WHERE email = current_setting('app.current_user_email', true)
  )
));

CREATE POLICY "Users can insert own session target images" 
ON public.session_target_images 
FOR INSERT 
WITH CHECK (session_id IN (
  SELECT id FROM member_training_sessions 
  WHERE member_id IN (
    SELECT id FROM organization_members 
    WHERE email = current_setting('app.current_user_email', true)
  )
));

-- Add missing RLS policies for training_session_details  
CREATE POLICY "Users can view own training session details" 
ON public.training_session_details 
FOR SELECT 
USING (session_id IN (
  SELECT id FROM member_training_sessions 
  WHERE member_id IN (
    SELECT id FROM organization_members 
    WHERE email = current_setting('app.current_user_email', true)
  )
));

CREATE POLICY "Users can insert own training session details" 
ON public.training_session_details 
FOR INSERT 
WITH CHECK (session_id IN (
  SELECT id FROM member_training_sessions 
  WHERE member_id IN (
    SELECT id FROM organization_members 
    WHERE email = current_setting('app.current_user_email', true)
  )
));

-- Add missing RLS policies for range_locations
CREATE POLICY "Range locations are publicly viewable" 
ON public.range_locations 
FOR SELECT 
USING (true);