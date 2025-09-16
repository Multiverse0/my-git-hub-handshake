-- Add discipline field to member_training_sessions table
ALTER TABLE public.member_training_sessions 
ADD COLUMN discipline TEXT;

-- Add index for better performance on discipline queries
CREATE INDEX idx_member_training_sessions_discipline ON public.member_training_sessions(discipline);

-- Add comment to explain the field
COMMENT ON COLUMN public.member_training_sessions.discipline IS 'The shooting discipline used for this training session (nsf, dfs, dssn)';