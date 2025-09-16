-- Fix admin creation by adding proper triggers and functions

-- Create function to automatically manage organization_admins table
CREATE OR REPLACE FUNCTION public.manage_organization_admins()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting/updating a member with admin role
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.role = 'admin' THEN
      -- Insert or update admin record
      INSERT INTO public.organization_admins (organization_id, member_id, permissions)
      VALUES (NEW.organization_id, NEW.id, '{"manage_members": true, "manage_settings": true, "manage_training": true}'::jsonb)
      ON CONFLICT (organization_id, member_id) 
      DO UPDATE SET permissions = EXCLUDED.permissions;
    ELSE
      -- Remove admin record if role changed from admin
      DELETE FROM public.organization_admins 
      WHERE member_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  -- If deleting a member, also delete admin record
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.organization_admins 
    WHERE member_id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on organization_members table
DROP TRIGGER IF EXISTS manage_admins_trigger ON public.organization_members;
CREATE TRIGGER manage_admins_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.manage_organization_admins();

-- Add unique constraint to prevent duplicate admin entries
ALTER TABLE public.organization_admins 
ADD CONSTRAINT unique_org_member_admin 
UNIQUE (organization_id, member_id);

-- Create function to get organization admins with member details
CREATE OR REPLACE FUNCTION public.get_organization_admins(org_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  active boolean,
  permissions jsonb,
  member_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.id,
    om.email,
    om.full_name,
    om.created_at,
    om.active,
    oa.permissions,
    oa.member_id
  FROM public.organization_members om
  JOIN public.organization_admins oa ON om.id = oa.member_id
  WHERE om.organization_id = org_id
    AND om.role = 'admin'
    AND om.approved = true
  ORDER BY om.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any existing admin members that don't have admin records
INSERT INTO public.organization_admins (organization_id, member_id, permissions)
SELECT 
  om.organization_id, 
  om.id, 
  '{"manage_members": true, "manage_settings": true, "manage_training": true}'::jsonb
FROM public.organization_members om
WHERE om.role = 'admin' 
  AND om.approved = true
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_admins oa 
    WHERE oa.member_id = om.id
  );

-- Update RLS policies for organization_admins to allow viewing
DROP POLICY IF EXISTS "Organization admins viewable by super users and org admins" ON public.organization_admins;
CREATE POLICY "Organization admins viewable by super users and org admins" 
ON public.organization_admins 
FOR SELECT 
USING (
  -- Super users can see all
  (EXISTS (
    SELECT 1 FROM public.super_users 
    WHERE email = current_setting('app.current_user_email', true) 
      AND active = true
  ))
  OR
  -- Organization admins can see their org's admins
  (organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    JOIN public.organization_admins oa ON om.id = oa.member_id
    WHERE om.email = current_setting('app.current_user_email', true)
  ))
);