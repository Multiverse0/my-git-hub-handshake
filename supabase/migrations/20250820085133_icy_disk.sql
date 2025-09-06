/*
  # Fix range locations INSERT policy

  1. Security Updates
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy for authenticated users
    - Ensure policy allows all authenticated users to insert range locations

  This resolves the RLS policy violation error when creating new range locations.
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert range locations" ON range_locations;

-- Create new INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert range locations"
  ON range_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);