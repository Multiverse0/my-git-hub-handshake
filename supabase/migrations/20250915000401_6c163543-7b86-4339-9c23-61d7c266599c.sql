-- Check if RLS is actually enabled on the remaining tables
SELECT 
  t.tablename,
  c.relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('organization_members', 'profiles', 'super_users')
ORDER BY t.tablename;