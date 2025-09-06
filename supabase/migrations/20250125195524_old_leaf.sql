-- Insert default range locations if they don't exist
INSERT INTO range_locations (name, qr_code_id)
VALUES 
  ('Innendørs 25m', 'svpk-indoor-25m'),
  ('Utendørs 25m', 'svpk-outdoor-25m')
ON CONFLICT (qr_code_id) DO NOTHING;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_range_locations_qr_code_id ON range_locations(qr_code_id);