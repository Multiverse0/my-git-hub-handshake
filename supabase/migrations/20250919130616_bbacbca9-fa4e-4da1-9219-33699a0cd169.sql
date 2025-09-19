-- Clean up test training sessions with 00:00:00 timestamps
DELETE FROM member_training_sessions 
WHERE start_time = '2025-09-18 00:00:00+00' 
AND manual_entry = true;