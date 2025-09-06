/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Circular dependency between organizations and organization_members policies
    - Organizations policy checks organization_members
    - Organization_members policy checks organizations
    - This creates infinite recursion

  2. Solution
    - Remove circular references in policies
    - Use direct user email checks instead of cross-table lookups
    - Simplify policy logic to break recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organizations are manageable by admins" ON organizations;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Super users have full access" ON organizations;
DROP POLICY IF EXISTS "Members can view own organization members" ON organization_members;
DROP POLICY IF EXISTS "Members can update own profile" ON organization_members;

-- Create simplified policies for organizations table
CREATE POLICY "Super users can manage organizations"
  ON organizations
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
    )
  );

CREATE POLICY "Organizations are publicly viewable"
  ON organizations
  FOR SELECT
  TO public
  USING (active = true);

-- Create simplified policies for organization_members table  
CREATE POLICY "Super users can manage all members"
  ON organization_members
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
    )
  );

CREATE POLICY "Members can view own profile"
  ON organization_members
  FOR SELECT
  TO public
  USING (email = current_setting('app.current_user_email', true));

CREATE POLICY "Members can update own profile"
  ON organization_members
  FOR UPDATE
  TO public
  USING (email = current_setting('app.current_user_email', true));

-- Create policy for organization_admins
CREATE POLICY "Super users can manage organization admins"
  ON organization_admins
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
    )
  );

-- Create policy for organization_settings
CREATE POLICY "Super users can manage organization settings"
  ON organization_settings
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
    )
  );