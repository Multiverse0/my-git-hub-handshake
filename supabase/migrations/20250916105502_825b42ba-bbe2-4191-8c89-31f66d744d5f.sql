-- Fix security warnings by setting proper search_path for functions

-- Update manage_organization_admins function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_organization_admins function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;