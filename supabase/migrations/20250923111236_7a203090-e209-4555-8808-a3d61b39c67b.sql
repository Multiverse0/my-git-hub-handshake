-- Create email_settings table for organization-specific email configurations
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, setting_key)
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for email settings
CREATE POLICY "Organization admins can manage email settings"
ON public.email_settings
FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    JOIN organization_admins oa ON om.id = oa.member_id
    WHERE om.email = current_setting('app.current_user_email', true)
  )
);

CREATE POLICY "Super users can manage all email settings"
ON public.email_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM super_users
    WHERE email = current_setting('app.current_user_email', true)
    AND active = true
  )
);

-- Create email_delivery_logs table for tracking
CREATE TABLE public.email_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  member_id UUID,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  tracking_id TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email delivery logs
CREATE POLICY "Organization admins can view email delivery logs"
ON public.email_delivery_logs
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    JOIN organization_admins oa ON om.id = oa.member_id
    WHERE om.email = current_setting('app.current_user_email', true)
  ) OR
  EXISTS (
    SELECT 1
    FROM super_users
    WHERE email = current_setting('app.current_user_email', true)
    AND active = true
  )
);

CREATE POLICY "System can insert email delivery logs"
ON public.email_delivery_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update email delivery logs"
ON public.email_delivery_logs
FOR UPDATE
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_delivery_logs_updated_at
  BEFORE UPDATE ON public.email_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email settings for existing organizations
INSERT INTO public.email_settings (organization_id, setting_key, setting_value)
SELECT 
  id,
  'url_config',
  jsonb_build_object(
    'base_url', 'https://lovable.app',
    'custom_domain', null,
    'enable_tracking', true,
    'reset_password_path', '/reset-password',
    'login_path', '/login',
    'email_preferences_path', '/profile/email-preferences'
  )
FROM public.organizations
ON CONFLICT (organization_id, setting_key) DO NOTHING;

INSERT INTO public.email_settings (organization_id, setting_key, setting_value)
SELECT 
  id,
  'branding',
  jsonb_build_object(
    'custom_template', false,
    'header_color', primary_color,
    'footer_text', name || ' - Powered by AktivLogg',
    'logo_url', logo_url
  )
FROM public.organizations
ON CONFLICT (organization_id, setting_key) DO NOTHING;