-- Remove phone number format validation constraint
ALTER TABLE public.organization_members 
DROP CONSTRAINT IF EXISTS phone_number_format_check;

-- Remove the phone number validation function (no longer needed)
DROP FUNCTION IF EXISTS public.validate_phone_number(text);