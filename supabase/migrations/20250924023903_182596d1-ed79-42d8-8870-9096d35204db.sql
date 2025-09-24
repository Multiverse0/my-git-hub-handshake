-- Phase 1: Complete RLS Architecture Redesign
-- Add user_id column to organization_members and update RLS policies to use auth.uid()

-- Step 1: Add user_id column to organization_members table
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id 
ON public.organization_members(user_id);

-- Step 3: Migrate existing data - populate user_id from auth.users using email matching
UPDATE public.organization_members 
SET user_id = auth.users.id
FROM auth.users
WHERE organization_members.email = auth.users.email 
AND organization_members.user_id IS NULL;

-- Step 4: Update RLS policies to use auth.uid() instead of email context

-- Drop existing RLS policies that use email context
DROP POLICY IF EXISTS "Members can view own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Members can update own profile" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Super users can manage all members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can register as organization members" ON public.organization_members;

-- Create new RLS policies using auth.uid()
CREATE POLICY "Members can view own profile" 
ON public.organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Members can update own profile" 
ON public.organization_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  -- Allow if user is admin of the same organization
  EXISTS (
    SELECT 1 FROM public.organization_members admin_member
    JOIN public.organization_admins admin_role ON admin_member.id = admin_role.member_id
    WHERE admin_member.user_id = auth.uid()
      AND admin_member.organization_id = organization_members.organization_id
      AND admin_member.role = 'admin'
      AND admin_member.approved = true
  )
  OR
  -- Allow if user is super user  
  EXISTS (
    SELECT 1 FROM public.super_users
    WHERE super_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND super_users.active = true
  )
);

CREATE POLICY "Admins can manage organization members" 
ON public.organization_members 
FOR ALL
USING (
  -- Allow if user is admin of the same organization
  EXISTS (
    SELECT 1 FROM public.organization_members admin_member
    JOIN public.organization_admins admin_role ON admin_member.id = admin_role.member_id
    WHERE admin_member.user_id = auth.uid()
      AND admin_member.organization_id = organization_members.organization_id
      AND admin_member.role = 'admin'
      AND admin_member.approved = true
  )
  OR
  -- Allow if user is super user
  EXISTS (
    SELECT 1 FROM public.super_users
    WHERE super_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND super_users.active = true
  )
);

CREATE POLICY "Super users can manage all members" 
ON public.organization_members 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.super_users
    WHERE super_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND super_users.active = true
  )
);

CREATE POLICY "Users can register as organization members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Step 5: Update member_training_sessions RLS policies to use auth-based approach
-- Drop existing policies
DROP POLICY IF EXISTS "Members can view own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can insert own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Members can update own training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Admins can update training sessions" ON public.member_training_sessions;
DROP POLICY IF EXISTS "Admins can delete training sessions" ON public.member_training_sessions;

-- Create new auth-based policies for training sessions
CREATE POLICY "Members can view own training sessions" 
ON public.member_training_sessions 
FOR SELECT 
USING (
  -- Allow if user owns the session
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.id = member_training_sessions.member_id 
      AND om.user_id = auth.uid()
  )
  OR
  -- Allow if user is admin of the same organization
  EXISTS (
    SELECT 1 FROM public.organization_members admin_member
    JOIN public.organization_admins admin_role ON admin_member.id = admin_role.member_id
    WHERE admin_member.user_id = auth.uid()
      AND admin_member.organization_id = member_training_sessions.organization_id
      AND admin_member.role = 'admin'
      AND admin_member.approved = true
  )
  OR
  -- Allow if user is super user
  EXISTS (
    SELECT 1 FROM public.super_users
    WHERE super_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND super_users.active = true
  )
);

CREATE POLICY "Members can insert own training sessions" 
ON public.member_training_sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.id = member_training_sessions.member_id 
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update own training sessions" 
ON public.member_training_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.id = member_training_sessions.member_id 
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage training sessions" 
ON public.member_training_sessions 
FOR ALL
USING (
  -- Allow if user is admin of the same organization
  EXISTS (
    SELECT 1 FROM public.organization_members admin_member
    JOIN public.organization_admins admin_role ON admin_member.id = admin_role.member_id
    WHERE admin_member.user_id = auth.uid()
      AND admin_member.organization_id = member_training_sessions.organization_id
      AND admin_member.role = 'admin'
      AND admin_member.approved = true
  )
  OR
  -- Allow if user is super user
  EXISTS (
    SELECT 1 FROM public.super_users
    WHERE super_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND super_users.active = true
  )
);