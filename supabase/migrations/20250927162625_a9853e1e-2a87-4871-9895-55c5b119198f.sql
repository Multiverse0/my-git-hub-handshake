-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic phone number validation: starts with + and has 10-15 digits
  RETURN phone ~ '^\+[1-9]\d{9,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;