/*
  # Add Range Locations

  1. New Data
    - Insert range location entries for indoor and outdoor 25m ranges
    - Each location has a unique QR code ID that the application expects
  
  2. Security
    - No changes to existing RLS policies
*/

-- Insert the range locations that the application expects
INSERT INTO range_locations (name, qr_code_id) VALUES
  ('Innendørs 25m', 'svpk-indoor-25m'),
  ('Utendørs 25m', 'svpk-outdoor-25m')
ON CONFLICT (qr_code_id) DO NOTHING;