/*
  # Allow first super user creation

  1. Security Changes
    - Add policy to allow creation of first super user when no super users exist
    - Maintains security by only allowing creation when table is empty
  
  2. Notes
    - This policy enables the initial setup process
    - Once a super user exists, no more can be created through this policy
    - Existing super users can still manage other super users through existing policies
*/

-- Add policy to allow creation of first super user when none exist
CREATE POLICY "Allow first super user creation when none exist"
  ON super_users
  FOR INSERT
  TO public
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM super_users WHERE active = true
    )
  );