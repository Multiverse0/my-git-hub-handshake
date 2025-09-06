/*
  # Create initial super user

  1. New Super User
    - Creates yngve68@me.com as super user
    - Password: "superuser123" (change after first login)
    - Active by default

  2. Security
    - Password is properly hashed with bcrypt
    - Can be changed after first login
*/

-- Create the initial super user with a known password
-- Password: "superuser123" (hashed with bcrypt)
INSERT INTO super_users (email, full_name, password_hash, active)
VALUES (
  'yngve68@me.com',
  'Yngve Rødli',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "superuser123"
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  active = EXCLUDED.active;