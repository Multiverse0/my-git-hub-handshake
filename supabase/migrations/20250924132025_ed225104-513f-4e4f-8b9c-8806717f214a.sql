-- Clean up orphaned organization_members and add missing components

-- Delete orphaned organization_members that don't have corresponding auth users
DELETE FROM organization_members 
WHERE user_id IS NULL 
AND email NOT IN (
  SELECT email FROM auth.users
);

-- Create a function to automatically link organization_members to auth users on registration
CREATE OR REPLACE FUNCTION link_organization_member_to_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new auth user is created, try to link them to an existing organization_member
  UPDATE organization_members 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link users on auth registration
DROP TRIGGER IF EXISTS on_auth_user_created_link_member ON auth.users;
CREATE TRIGGER on_auth_user_created_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_organization_member_to_auth_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_email ON organization_members(email);