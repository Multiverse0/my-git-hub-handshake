-- Add unique constraint to prevent duplicate training sessions per member per location per day
-- This will prevent users from registering multiple sessions on the same location on the same day

-- First, let's clean up any existing duplicates by keeping only the first session per member per location per day
DELETE FROM member_training_sessions 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY member_id, location_id, DATE(start_time) 
                   ORDER BY start_time
               ) as rn
        FROM member_training_sessions
    ) t 
    WHERE t.rn > 1
);

-- Create a partial unique index to prevent duplicate sessions per member per location per day
-- We use a partial index on DATE(start_time) to ensure uniqueness per day
CREATE UNIQUE INDEX CONCURRENTLY idx_unique_training_session_per_day 
ON member_training_sessions (member_id, location_id, DATE(start_time));