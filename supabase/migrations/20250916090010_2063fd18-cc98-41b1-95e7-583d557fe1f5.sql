-- Add missing columns to organizations table for gun branch settings and other organization data
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS nsf_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS dfs_enabled boolean DEFAULT true, 
ADD COLUMN IF NOT EXISTS dssn_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS activity_types jsonb DEFAULT '["NSF", "DFS", "DSSN", "Pistol", "Rifle", "Shotgun"]'::jsonb,
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#FFFFFF';