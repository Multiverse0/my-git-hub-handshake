/*
  # Setup Storage Buckets

  1. Storage Buckets
    - `profiles` - User profile images and avatars
    - `documents` - Startkort, diplomas, and other member documents
    - `target-images` - Training session target images
    - `logos` - Organization logos

  2. Security
    - RLS policies for secure file access
    - Public read access for logos
    - Member-only access for personal documents
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('target-images', 'target-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('logos', 'logos', true, 2097152, ARRAY['image/svg+xml', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Profiles bucket policies
CREATE POLICY "Users can upload own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile images are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

-- Documents bucket policies
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Target images bucket policies
CREATE POLICY "Users can upload target images for own sessions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'target-images' AND
    EXISTS (
      SELECT 1 FROM member_training_sessions
      WHERE id::text = (storage.foldername(name))[1]
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can view target images for own sessions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'target-images' AND
    EXISTS (
      SELECT 1 FROM member_training_sessions
      WHERE id::text = (storage.foldername(name))[1]
      AND member_id = auth.uid()
    )
  );

-- Logos bucket policies
CREATE POLICY "Super users can upload logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM super_users
      WHERE email = current_setting('app.current_user_email', true)
      AND active = true
    )
  );

CREATE POLICY "Logos are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Super users can update logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM super_users
      WHERE email = current_setting('app.current_user_email', true)
      AND active = true
    )
  );

CREATE POLICY "Super users can delete logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM super_users
      WHERE email = current_setting('app.current_user_email', true)
      AND active = true
    )
  );