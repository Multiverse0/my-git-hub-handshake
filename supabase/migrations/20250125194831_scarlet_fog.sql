/*
  # Add default range locations

  1. New Data
    - Add default range locations for indoor and outdoor ranges
    - Each location has a unique QR code ID
  
  2. Changes
    - Insert two default range locations:
      - Indoor 25m range
      - Outdoor 25m range
*/

-- Insert default range locations if they don't exist
INSERT INTO range_locations (name, qr_code_id)
VALUES 
  ('Innendørs 25m', 'svpk-indoor-25m'),
  ('Utendørs 25m', 'svpk-outdoor-25m')
ON CONFLICT (qr_code_id) DO NOTHING;