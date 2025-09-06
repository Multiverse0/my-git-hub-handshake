/*
  # Add INSERT policy for range_locations table

  1. Security
    - Add policy for authenticated users to insert range locations
    - This allows admins to create new range locations from the profile page

  2. Changes
    - Create INSERT policy for range_locations table
    - Allow authenticated users to insert new range locations
*/

CREATE POLICY "Authenticated users can insert range locations"
  ON range_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);