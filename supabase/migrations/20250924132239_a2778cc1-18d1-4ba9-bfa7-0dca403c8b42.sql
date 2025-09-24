-- Enable Row Level Security on tables that need it

-- Enable RLS on organization_admins table
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_members table  
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on super_users table
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;

-- Update the link_organization_member_to_auth_user function to have proper search_path
CREATE OR REPLACE FUNCTION link_organization_member_to_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new auth user is created, try to link them to an existing organization_member
  UPDATE organization_members 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;