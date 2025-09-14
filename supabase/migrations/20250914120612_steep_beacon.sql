/*
  # Create RLS Helper Functions

  1. Functions
    - `set_user_context(user_email text)` - Sets the current user email for RLS policies
    - `get_current_user_email()` - Gets the current user email from context
    - `update_updated_at_column()` - Trigger function to automatically update updated_at timestamps

  2. Security
    - Functions are created with proper security definer context
    - Used by RLS policies to enforce data access controls
*/

-- Function to set user context for RLS
CREATE OR REPLACE FUNCTION set_user_context(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_email', user_email, true);
END;
$$;

-- Function to get current user email from context
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$$;

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;