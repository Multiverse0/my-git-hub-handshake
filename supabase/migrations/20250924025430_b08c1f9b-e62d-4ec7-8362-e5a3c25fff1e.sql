-- Migration to populate user_id for existing organization members
-- This fixes the issue where approved users still see "Awaiting approval"

-- Update organization_members to populate user_id by matching email with auth.users
UPDATE public.organization_members 
SET user_id = auth.users.id
FROM auth.users 
WHERE organization_members.email = auth.users.email 
  AND organization_members.user_id IS NULL;