-- Add missing UPDATE RLS policy to training_session_details table
CREATE POLICY "Users can update own training session details" 
ON training_session_details 
FOR UPDATE 
USING (session_id IN (
  SELECT member_training_sessions.id
  FROM member_training_sessions
  WHERE member_training_sessions.member_id IN (
    SELECT organization_members.id
    FROM organization_members
    WHERE organization_members.email = current_setting('app.current_user_email', true)
  )
));