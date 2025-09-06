/*
  # Fix range locations RLS INSERT policy

  1. Security Updates
    - Drop and recreate the INSERT policy for range_locations table
    - Ensure authenticated users can insert new range locations
    - Fix the policy condition to allow proper INSERT operations

  2. Changes
    - Remove existing INSERT policy that may be too restrictive
    - Create new INSERT policy with proper permissions for authenticated users
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert range locations" ON range_locations;

-- Create a new INSERT policy that allows authenticated users to insert range locations
CREATE POLICY "Allow authenticated users to insert range locations"
  ON range_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);