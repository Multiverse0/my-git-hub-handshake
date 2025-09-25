-- Fix infinite recursion in RLS policies - Part 4: Final recreation
-- This migration creates all necessary RLS policies using auth.uid()-based functions

-- Organization members policies (using auth.uid() directly - NO RECURSION)
CREATE POLICY "Members can view own profile"
ON public.organization_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Members can update own profile"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can register as organization members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR 
  public.is_current_user_super_user() = true
);

CREATE POLICY "Admins can manage organization members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR 
  public.is_current_user_super_user() = true
);

-- Organizations policies
CREATE POLICY "Organizations are publicly viewable"
ON public.organizations
FOR SELECT
USING (active = true);

CREATE POLICY "Super users can manage organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (public.is_current_user_super_user() = true);

-- Profiles policies
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Super users policies
CREATE POLICY "Allow first super user creation when none exist"
ON public.super_users
FOR INSERT
WITH CHECK (NOT EXISTS (SELECT 1 FROM public.super_users WHERE active = true));

-- Range locations policies
CREATE POLICY "Range locations are publicly viewable"
ON public.range_locations
FOR SELECT
USING (true);

-- Training sessions policies
CREATE POLICY "Members can view own training sessions"
ON public.member_training_sessions
FOR SELECT
TO authenticated
USING (
  member_id = public.get_current_user_member_id() OR
  public.is_current_user_organization_admin() = true OR
  public.is_current_user_super_user() = true
);

CREATE POLICY "Members can insert own training sessions"
ON public.member_training_sessions
FOR INSERT
TO authenticated
WITH CHECK (member_id = public.get_current_user_member_id());

CREATE POLICY "Members can update own training sessions"
ON public.member_training_sessions
FOR UPDATE
TO authenticated
USING (member_id = public.get_current_user_member_id());

CREATE POLICY "Admins can manage training sessions"
ON public.member_training_sessions
FOR ALL
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR
  public.is_current_user_super_user() = true
);

-- Training locations policies
CREATE POLICY "Training locations viewable by organization members"
ON public.training_locations
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id() OR
  public.is_current_user_super_user() = true
);

CREATE POLICY "Admins can manage organization training locations"
ON public.training_locations
FOR ALL
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR
  public.is_current_user_super_user() = true
);

-- Training session details policies
CREATE POLICY "Users can view own training session details"
ON public.training_session_details
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.member_training_sessions 
    WHERE member_id = public.get_current_user_member_id()
  )
);

CREATE POLICY "Users can insert own training session details"
ON public.training_session_details
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT id FROM public.member_training_sessions 
    WHERE member_id = public.get_current_user_member_id()
  )
);

CREATE POLICY "Users can update own training session details"
ON public.training_session_details
FOR UPDATE
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.member_training_sessions 
    WHERE member_id = public.get_current_user_member_id()
  )
);

-- Session target images policies
CREATE POLICY "Users can view own session target images"
ON public.session_target_images
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.member_training_sessions 
    WHERE member_id = public.get_current_user_member_id()
  )
);

CREATE POLICY "Users can insert own session target images"
ON public.session_target_images
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT id FROM public.member_training_sessions 
    WHERE member_id = public.get_current_user_member_id()
  )
);

-- Email preferences policies
CREATE POLICY "Users can view own email preferences"
ON public.email_preferences
FOR SELECT
TO authenticated
USING (member_id = public.get_current_user_member_id());

CREATE POLICY "Users can insert own email preferences"
ON public.email_preferences
FOR INSERT
TO authenticated
WITH CHECK (member_id = public.get_current_user_member_id());

CREATE POLICY "Users can update own email preferences"
ON public.email_preferences
FOR UPDATE
TO authenticated
USING (member_id = public.get_current_user_member_id());

CREATE POLICY "Admins can view org email preferences"
ON public.email_preferences
FOR SELECT
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR
  public.is_current_user_super_user() = true
);

-- Email settings policies
CREATE POLICY "Organization admins can manage email settings"
ON public.email_settings
FOR ALL
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id() OR
  public.is_current_user_super_user() = true
);

-- Email logs policies
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (
  public.is_current_user_organization_admin() = true OR
  public.is_current_user_super_user() = true
);

CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Email delivery logs policies
CREATE POLICY "Organization admins can view email delivery logs"
ON public.email_delivery_logs
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id() OR
  public.is_current_user_super_user() = true
);

CREATE POLICY "System can insert email delivery logs"
ON public.email_delivery_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update email delivery logs"
ON public.email_delivery_logs
FOR UPDATE
USING (true);

-- Organization admins policies
CREATE POLICY "Organization admins viewable by super users and org admins"
ON public.organization_admins
FOR SELECT
TO authenticated
USING (
  public.is_current_user_super_user() = true OR
  organization_id = public.get_current_user_organization_id()
);

CREATE POLICY "Super users can manage organization admins"
ON public.organization_admins
FOR ALL
TO authenticated
USING (public.is_current_user_super_user() = true);

-- Organization settings policies
CREATE POLICY "Super users can manage organization settings"
ON public.organization_settings
FOR ALL
TO authenticated
USING (public.is_current_user_super_user() = true);

-- Old training sessions table policies (if still used)
CREATE POLICY "Users can insert own training sessions"
ON public.training_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own training sessions"
ON public.training_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own training sessions"
ON public.training_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Training details policies
CREATE POLICY "Users can insert own training details"
ON public.training_details
FOR INSERT
TO authenticated
WITH CHECK (
  training_session_id IN (
    SELECT id FROM public.training_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own training details"
ON public.training_details
FOR SELECT
TO authenticated
USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own training details"
ON public.training_details
FOR UPDATE
TO authenticated
USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions WHERE user_id = auth.uid()
  )
);

-- Target images policies
CREATE POLICY "Users can insert own target images"
ON public.target_images
FOR INSERT
TO authenticated
WITH CHECK (
  training_session_id IN (
    SELECT id FROM public.training_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own target images"
ON public.target_images
FOR SELECT
TO authenticated
USING (
  training_session_id IN (
    SELECT id FROM public.training_sessions WHERE user_id = auth.uid()
  )
);