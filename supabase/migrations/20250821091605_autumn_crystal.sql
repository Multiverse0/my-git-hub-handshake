/*
  # Create set_config function for RLS

  1. New Functions
    - `set_config` - Function to set session-level configuration variables
      - Used for Row Level Security (RLS) to set user context
      - Allows setting both local and global configuration variables
      - Required for the application's authentication system

  2. Security
    - Function is accessible to all users as it's needed for authentication
    - Uses proper parameter validation and formatting
*/

CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean DEFAULT true)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF is_local THEN
    EXECUTE format('SET LOCAL %I = %L', setting_name, setting_value);
  ELSE
    EXECUTE format('SET %I = %L', setting_name, setting_value);
  END IF;
  RETURN setting_value;
END;
$function$;