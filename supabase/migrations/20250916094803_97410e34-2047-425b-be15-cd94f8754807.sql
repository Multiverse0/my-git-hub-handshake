-- Add shooting discipline columns to training_locations table
ALTER TABLE public.training_locations 
ADD COLUMN nsf_enabled boolean DEFAULT true,
ADD COLUMN dfs_enabled boolean DEFAULT false,
ADD COLUMN dssn_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.training_locations.nsf_enabled IS 'Whether NSF (Norges Skytterforbund) disciplines are enabled at this location';
COMMENT ON COLUMN public.training_locations.dfs_enabled IS 'Whether DFS (Dynamisk Feltskyting) disciplines are enabled at this location';  
COMMENT ON COLUMN public.training_locations.dssn_enabled IS 'Whether DSSN (Dynamisk Sportskyting Norge) disciplines are enabled at this location';