-- Add some initial training sessions for testing with real members
INSERT INTO member_training_sessions (
  organization_id, 
  member_id, 
  location_id, 
  start_time, 
  end_time, 
  verified, 
  verified_by, 
  verification_time,
  manual_entry,
  duration_minutes,
  notes
) VALUES 
-- Get organization and location IDs from existing data
(
  (SELECT id FROM organizations WHERE slug = 'svpk' LIMIT 1),
  (SELECT id FROM organization_members WHERE full_name = 'Ken' AND approved = true LIMIT 1),
  (SELECT id FROM training_locations WHERE name = 'Innendørs 25m' LIMIT 1),
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '1 hour',
  true,
  'Magne Angelsen',
  NOW() - INTERVAL '1 day',
  true,
  60,
  'Standard trening'
),
(
  (SELECT id FROM organizations WHERE slug = 'svpk' LIMIT 1),
  (SELECT id FROM organization_members WHERE full_name = 'New Ken' AND approved = true LIMIT 1),
  (SELECT id FROM training_locations WHERE name = 'Utendørs 25m' LIMIT 1),
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
  false,
  NULL,
  NULL,
  true,
  45,
  'Trening utendørs'
),
(
  (SELECT id FROM organizations WHERE slug = 'svpk' LIMIT 1),
  (SELECT id FROM organization_members WHERE full_name = 'Multivers' AND approved = true LIMIT 1),
  (SELECT id FROM training_locations WHERE name = 'Innendørs 25m' LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '90 minutes',
  true,
  'Kenneth S. Fahle',
  NOW() - INTERVAL '12 hours',
  false,
  90,
  'Dugnad og trening'
);