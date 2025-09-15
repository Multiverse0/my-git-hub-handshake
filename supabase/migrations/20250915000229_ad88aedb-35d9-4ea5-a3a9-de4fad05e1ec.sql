-- Fix RLS policy for organization member registration
-- Allow users to register themselves as organization members

-- First, drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Members can insert own registration" ON public.organization_members;

-- Create a policy that allows users to register themselves
CREATE POLICY "Users can register as organization members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (true);

-- Also ensure admins/super users can still manage members
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members" 
ON public.organization_members 
FOR ALL
USING (
  -- Super users can manage all
  (EXISTS (
    SELECT 1 FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND active = true
  ))
  OR
  -- Organization admins can manage members in their org
  (organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    JOIN organization_admins oa ON om.id = oa.member_id
    WHERE om.email = current_setting('app.current_user_email', true)
  ))
);