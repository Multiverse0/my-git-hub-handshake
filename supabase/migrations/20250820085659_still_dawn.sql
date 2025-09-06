/*
  # Disable RLS for range_locations table

  This migration temporarily disables Row Level Security for the range_locations table
  to resolve the INSERT permission issues. This allows all users to read and insert
  range locations without authentication restrictions.

  1. Changes
     - Disable RLS on range_locations table
     - Drop existing policies that are causing conflicts

  Note: This is a temporary solution. In production, you should implement proper
  authentication and role-based policies.
*/

-- Drop all existing policies for range_locations
DROP POLICY IF EXISTS "Anyone can read range locations" ON range_locations;
DROP POLICY IF EXISTS "Allow authenticated users to insert range locations" ON range_locations;
DROP POLICY IF EXISTS "Authenticated users can insert range locations" ON range_locations;

-- Disable RLS for range_locations table
ALTER TABLE range_locations DISABLE ROW LEVEL SECURITY;