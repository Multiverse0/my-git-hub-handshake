/*
  # Fix super_users RLS policy for first user creation

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Add new policy that allows first super user creation when table is empty
    - Policy only allows INSERT when no active super users exist
    - Maintains security after first user is created

  This ensures the first super user can be created while maintaining security.
*/

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Allow first super user creation when none exist" ON super_users;

-- Create a new policy that allows INSERT only when no active super users exist
CREATE POLICY "Allow first super user creation when none exist"
  ON super_users
  FOR INSERT
  TO public
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 
      FROM super_users 
      WHERE active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;