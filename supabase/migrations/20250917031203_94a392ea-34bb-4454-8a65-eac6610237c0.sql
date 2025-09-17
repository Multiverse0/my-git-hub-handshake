-- Add UPDATE and DELETE policies for member_training_sessions
-- Allow organization admins and super users to update training sessions
CREATE POLICY "Admins can update training sessions" 
ON public.member_training_sessions 
FOR UPDATE 
USING (
  (is_user_organization_admin() = true) OR 
  (EXISTS (
    SELECT 1 
    FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND active = true
  ))
);

-- Allow organization admins and super users to delete training sessions  
CREATE POLICY "Admins can delete training sessions" 
ON public.member_training_sessions 
FOR DELETE 
USING (
  (is_user_organization_admin() = true) OR 
  (EXISTS (
    SELECT 1 
    FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND active = true
  ))
);

-- Allow members to update their own training sessions
CREATE POLICY "Members can update own training sessions" 
ON public.member_training_sessions 
FOR UPDATE 
USING (member_id = get_user_member_id());