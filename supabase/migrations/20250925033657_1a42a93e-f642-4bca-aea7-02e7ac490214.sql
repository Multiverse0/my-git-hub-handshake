-- Fix security issues by enabling RLS on all public tables that need it

-- Check which tables in public schema don't have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Enable RLS on any public tables that don't have it enabled
-- Most common tables that should have RLS enabled:

-- Enable RLS on all public tables that should have it
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false
    LOOP
        -- Skip system tables or tables that shouldn't have RLS
        IF r.tablename NOT IN ('schema_migrations', 'spatial_ref_sys') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
        END IF;
    END LOOP; 
END $$;