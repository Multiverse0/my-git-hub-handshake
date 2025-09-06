/*
  # Add training details and target images

  1. New Tables
    - `training_details`
      - `id` (uuid, primary key)
      - `training_session_id` (uuid, references training_sessions)
      - `training_type` (text)
      - `results` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `target_images`
      - `id` (uuid, primary key)
      - `training_session_id` (uuid, references training_sessions)
      - `image_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

-- Create training_details table
CREATE TABLE IF NOT EXISTS training_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid REFERENCES training_sessions(id) NOT NULL,
  training_type text,
  results text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create target_images table
CREATE TABLE IF NOT EXISTS target_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid REFERENCES training_sessions(id) NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_images ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for training_details
CREATE POLICY "Users can read own training details"
  ON training_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_details.training_session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own training details"
  ON training_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own training details"
  ON training_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_details.training_session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

-- Add RLS policies for target_images
CREATE POLICY "Users can read own target images"
  ON target_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = target_images.training_session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own target images"
  ON target_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_training_details_updated_at
  BEFORE UPDATE ON training_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();