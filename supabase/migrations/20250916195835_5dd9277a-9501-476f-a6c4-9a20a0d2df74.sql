-- Clean up existing duplicate sessions first
-- Keep only the earliest session per member per location per day
DELETE FROM member_training_sessions 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY member_id, location_id, start_time::date 
                   ORDER BY start_time
               ) as rn
        FROM member_training_sessions
    ) t 
    WHERE t.rn > 1
);