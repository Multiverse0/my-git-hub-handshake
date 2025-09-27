-- Add phone number support to organization members
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add SMS notification preferences to email_preferences table
ALTER TABLE public.email_preferences 
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_training_notifications BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_role_change_notifications BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_organization_announcements BOOLEAN NOT NULL DEFAULT false;

-- Add phone number validation function
CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic phone number validation: starts with + and has 10-15 digits
  RETURN phone ~ '^\+[1-9]\d{9,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to validate phone number format if provided
ALTER TABLE public.organization_members 
ADD CONSTRAINT phone_number_format_check 
CHECK (phone_number IS NULL OR validate_phone_number(phone_number));

-- Update the update_updated_at trigger for organization_members (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'organization_members' 
    AND trigger_name = 'update_organization_members_updated_at'
  ) THEN
    CREATE TRIGGER update_organization_members_updated_at
      BEFORE UPDATE ON public.organization_members
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;