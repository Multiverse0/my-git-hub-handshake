-- Complete the user_id population for remaining users
-- This ensures all approved organization members have proper user_id links

UPDATE public.organization_members 
SET user_id = auth.users.id
FROM auth.users 
WHERE organization_members.email = auth.users.email 
  AND organization_members.user_id IS NULL
  AND organization_members.approved = true;

-- Verify the update
SELECT COUNT(*) as remaining_null_user_ids FROM organization_members WHERE user_id IS NULL;