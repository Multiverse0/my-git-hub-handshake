-- Ensure realtime is enabled for member_training_sessions table
ALTER TABLE public.member_training_sessions REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already present
DO $$
BEGIN
  -- Check if publication exists and add table if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'member_training_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member_training_sessions;
  END IF;
END $$;