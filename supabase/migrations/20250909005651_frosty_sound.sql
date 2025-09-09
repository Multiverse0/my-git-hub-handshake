/*
  # Create RLS Helper Functions

  1. Functions
    - `uid()` - Get current authenticated user ID
    - `set_config()` - Set configuration for RLS policies
    - `update_updated_at_column()` - Trigger function for updated_at columns

  2. Security
    - Functions are created with proper security context
    - RLS policies can use these functions for access control
*/

-- Function to get current user ID (compatible with auth.uid())
CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('app.current_user_id', true))::uuid
  );
$$;

-- Function to set configuration values for RLS
CREATE OR REPLACE FUNCTION public.set_config(
  setting_name text,
  setting_value text,
  is_local boolean DEFAULT false
)
RETURNS text
LANGUAGE sql
AS $$
  SELECT set_config(setting_name, setting_value, is_local);
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, anon;