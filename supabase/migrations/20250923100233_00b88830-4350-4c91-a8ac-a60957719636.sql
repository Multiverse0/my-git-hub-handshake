-- Create email preferences table
CREATE TABLE public.email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  training_notifications BOOLEAN NOT NULL DEFAULT true,
  role_change_notifications BOOLEAN NOT NULL DEFAULT true,
  password_notifications BOOLEAN NOT NULL DEFAULT true,
  organization_announcements BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent', -- sent, failed, bounced
  error_message TEXT,
  organization_id UUID,
  member_id UUID,
  retry_count INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on email preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email preferences
CREATE POLICY "Users can view own email preferences" 
ON public.email_preferences 
FOR SELECT 
USING (member_id IN (
  SELECT id FROM organization_members 
  WHERE email = current_setting('app.current_user_email', true)
));

CREATE POLICY "Users can update own email preferences" 
ON public.email_preferences 
FOR UPDATE 
USING (member_id IN (
  SELECT id FROM organization_members 
  WHERE email = current_setting('app.current_user_email', true)
));

CREATE POLICY "Users can insert own email preferences" 
ON public.email_preferences 
FOR INSERT 
WITH CHECK (member_id IN (
  SELECT id FROM organization_members 
  WHERE email = current_setting('app.current_user_email', true)
));

CREATE POLICY "Admins can view org email preferences" 
ON public.email_preferences 
FOR SELECT 
USING (
  is_user_organization_admin() = true OR 
  EXISTS (
    SELECT 1 FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) AND active = true
  )
);

-- RLS policies for email logs
CREATE POLICY "Admins can view email logs" 
ON public.email_logs 
FOR SELECT 
USING (
  is_user_organization_admin() = true OR 
  EXISTS (
    SELECT 1 FROM super_users 
    WHERE email = current_setting('app.current_user_email', true) AND active = true
  )
);

CREATE POLICY "System can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating email preferences timestamp
CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user email preferences
CREATE OR REPLACE FUNCTION public.get_user_email_preferences(user_member_id UUID)
RETURNS TABLE(
  training_notifications BOOLEAN,
  role_change_notifications BOOLEAN,
  password_notifications BOOLEAN,
  organization_announcements BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.training_notifications,
    ep.role_change_notifications,
    ep.password_notifications,
    ep.organization_announcements
  FROM public.email_preferences ep
  WHERE ep.member_id = user_member_id;
  
  -- If no preferences exist, return defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT true, true, true, true;
  END IF;
END;
$$;