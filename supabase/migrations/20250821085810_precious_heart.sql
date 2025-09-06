/*
  # Multi-Tenant SaaS Platform for Sports Clubs

  1. New Tables
    - `organizations` - Sports clubs/organizations
    - `organization_settings` - Club-specific settings and branding
    - `organization_members` - Members belonging to organizations
    - `organization_admins` - Admin users for organizations
    - `super_users` - Cross-organization super users
    - `training_locations` - QR code locations per organization
    - `member_training_sessions` - Training sessions per organization
    - `training_session_details` - Session details
    - `session_target_images` - Target images per session

  2. Security
    - Enable RLS on all tables
    - Organization-based access policies
    - Super user bypass policies
    - Admin role policies

  3. Features
    - Multi-tenant isolation
    - Custom branding per organization
    - Cross-organization super user access
    - Scalable architecture
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (sports clubs)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  website text,
  email text,
  phone text,
  address text,
  logo_url text,
  primary_color text DEFAULT '#FFD700',
  secondary_color text DEFAULT '#1F2937',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Organization settings and branding
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, setting_key)
);

-- Super users (cross-organization access)
CREATE TABLE IF NOT EXISTS super_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  member_number text,
  password_hash text,
  avatar_url text,
  startkort_url text,
  diploma_url text,
  role text DEFAULT 'member' CHECK (role IN ('member', 'admin', 'range_officer')),
  approved boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, member_number)
);

-- Organization admins (for easier querying)
CREATE TABLE IF NOT EXISTS organization_admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"manage_members": true, "manage_training": true, "manage_settings": false}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, member_id)
);

-- Training locations per organization
CREATE TABLE IF NOT EXISTS training_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  qr_code_id text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, qr_code_id)
);

-- Member training sessions
CREATE TABLE IF NOT EXISTS member_training_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer,
  verified boolean DEFAULT false,
  verified_by text,
  verification_time timestamptz,
  manual_entry boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Training session details
CREATE TABLE IF NOT EXISTS training_session_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES member_training_sessions(id) ON DELETE CASCADE,
  training_type text,
  results text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Session target images
CREATE TABLE IF NOT EXISTS session_target_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES member_training_sessions(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  filename text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_email ON organization_members(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member ON member_training_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_org ON member_training_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_locations_org ON training_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_locations_qr ON training_locations(organization_id, qr_code_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_session_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_target_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations
CREATE POLICY "Organizations are viewable by members" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

CREATE POLICY "Organizations are manageable by admins" ON organizations
  FOR ALL USING (
    id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN organization_admins oa ON om.id = oa.member_id
      WHERE om.email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

-- RLS Policies for Organization Members
CREATE POLICY "Members can view own organization members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

CREATE POLICY "Members can update own profile" ON organization_members
  FOR UPDATE USING (
    email = current_setting('app.current_user_email', true)
    OR organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN organization_admins oa ON om.id = oa.member_id
      WHERE om.email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

-- RLS Policies for Training Sessions
CREATE POLICY "Members can view own training sessions" ON member_training_sessions
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM organization_members 
      WHERE email = current_setting('app.current_user_email', true)
    )
    OR organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN organization_admins oa ON om.id = oa.member_id
      WHERE om.email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

CREATE POLICY "Members can insert own training sessions" ON member_training_sessions
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM organization_members 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- RLS Policies for Training Locations
CREATE POLICY "Training locations viewable by organization members" ON training_locations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE email = current_setting('app.current_user_email', true)
    )
    OR EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

-- Super user policies (bypass organization restrictions)
CREATE POLICY "Super users have full access" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_users 
      WHERE email = current_setting('app.current_user_email', true) AND active = true
    )
  );

-- Insert default super user (you)
INSERT INTO super_users (email, full_name, password_hash, active) VALUES 
('yngve68@me.com', 'Yngve Rødli', '$2b$10$encrypted_password_hash_here', true)
ON CONFLICT (email) DO NOTHING;

-- Insert demo organization (SVPK)
INSERT INTO organizations (name, slug, description, email, primary_color, secondary_color) VALUES 
('Svolvær Pistolklubb', 'svpk', 'Pistolklubb i Svolvær', 'post@svpk.no', '#FFD700', '#1F2937')
ON CONFLICT (slug) DO NOTHING;

-- Insert default training locations for SVPK
INSERT INTO training_locations (organization_id, name, qr_code_id) 
SELECT id, 'Innendørs 25m', 'svpk-innendors-25m' FROM organizations WHERE slug = 'svpk'
ON CONFLICT (organization_id, qr_code_id) DO NOTHING;

INSERT INTO training_locations (organization_id, name, qr_code_id) 
SELECT id, 'Utendørs 25m', 'svpk-utendors-25m' FROM organizations WHERE slug = 'svpk'
ON CONFLICT (organization_id, qr_code_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_super_users_updated_at BEFORE UPDATE ON super_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_locations_updated_at BEFORE UPDATE ON training_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_training_sessions_updated_at BEFORE UPDATE ON member_training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_session_details_updated_at BEFORE UPDATE ON training_session_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();