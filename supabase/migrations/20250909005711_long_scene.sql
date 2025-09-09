/*
  # Enable Realtime for Tables

  1. Realtime Publications
    - Enable realtime for member_training_sessions
    - Enable realtime for organization_members
    - Enable realtime for training_locations

  2. Security
    - Realtime respects RLS policies
    - Only authenticated users can subscribe
*/

-- Enable realtime for training sessions
ALTER PUBLICATION supabase_realtime ADD TABLE member_training_sessions;

-- Enable realtime for organization members
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;

-- Enable realtime for training locations
ALTER PUBLICATION supabase_realtime ADD TABLE training_locations;

-- Enable realtime for training session details
ALTER PUBLICATION supabase_realtime ADD TABLE training_session_details;

-- Enable realtime for session target images
ALTER PUBLICATION supabase_realtime ADD TABLE session_target_images;