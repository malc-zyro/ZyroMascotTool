/*
  # Add user authentication, starring, and per-user RLS

  1. Modified Tables
    - `generations`
      - Add `user_id` (uuid, references auth.users) - ties each generation to a logged-in user
    - `generated_images`
      - Add `starred` (boolean, default false) - allows users to star/protect images from cleanup

  2. Security Changes
    - Drop old anon-based RLS policies on `generations` and `generated_images`
    - Add new authenticated-only policies:
      - Users can SELECT, INSERT, UPDATE, DELETE only their own generations
      - Users can SELECT, UPDATE their own generated_images (via generation ownership)
      - INSERT and DELETE on generated_images handled by service role (edge function)
    - Update storage policies for authenticated users

  3. Important Notes
    - Existing rows without user_id will not be accessible under new RLS policies
    - The edge function uses service_role and bypasses RLS for inserts
*/

-- Add user_id to generations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE generations ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add starred to generated_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_images' AND column_name = 'starred'
  ) THEN
    ALTER TABLE generated_images ADD COLUMN starred boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- Create index on starred for cleanup queries
CREATE INDEX IF NOT EXISTS idx_generated_images_starred ON generated_images(starred);

-- Drop old anon policies
DROP POLICY IF EXISTS "Anon can read recent generations" ON generations;
DROP POLICY IF EXISTS "Anon can read images for visible generations" ON generated_images;

-- Generations: authenticated users can read their own
CREATE POLICY "Users can read own generations"
  ON generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Generations: authenticated users can insert their own
CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Generations: authenticated users can delete their own
CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Generated images: authenticated users can read images from their own generations
CREATE POLICY "Users can read own generated images"
  ON generated_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = generated_images.generation_id
      AND generations.user_id = auth.uid()
    )
  );

-- Generated images: authenticated users can update starred status on their own images
CREATE POLICY "Users can update own generated images"
  ON generated_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = generated_images.generation_id
      AND generations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = generated_images.generation_id
      AND generations.user_id = auth.uid()
    )
  );

-- Allow service role to still insert (edge function uses service role, bypasses RLS)
-- No explicit policy needed for service role as it bypasses RLS

-- Update storage policies: allow authenticated users to view generated images
DROP POLICY IF EXISTS "Anon can view generated images in storage" ON storage.objects;
CREATE POLICY "Authenticated users can view generated images in storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'generated-images');

-- Keep reference images viewable by authenticated users
DROP POLICY IF EXISTS "Anon can view reference images in storage" ON storage.objects;
CREATE POLICY "Authenticated users can view reference images in storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reference-images');

-- Keep reference image upload for authenticated users
DROP POLICY IF EXISTS "Anon can upload core reference images" ON storage.objects;
CREATE POLICY "Authenticated users can upload reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images');

-- Keep reference image delete for authenticated users
DROP POLICY IF EXISTS "Anon can delete reference images" ON storage.objects;
CREATE POLICY "Authenticated users can delete reference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reference-images');
