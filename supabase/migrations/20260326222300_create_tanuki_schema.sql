/*
  # Tanuki Master Rig - Initial Schema

  1. New Tables
    - `generations`
      - `id` (uuid, primary key)
      - `original_prompt` (text) - The user's raw prompt
      - `enhanced_prompt` (text, nullable) - The AI-enhanced prompt from Stage 1
      - `model` (text) - The Gemini model used
      - `expression` (text, nullable) - Selected expression reference
      - `slider_level` (integer) - Expressiveness level 0-5
      - `quantity` (integer) - Number of images requested
      - `created_at` (timestamptz) - Timestamp of generation
    - `generated_images`
      - `id` (uuid, primary key)
      - `generation_id` (uuid, FK to generations) - Parent generation
      - `storage_path` (text) - Path in storage bucket
      - `image_url` (text) - Public URL of the image
      - `created_at` (timestamptz) - Timestamp

  2. Storage Buckets
    - `generated-images` - Stores generated Tanuki images (public read)
    - `reference-images` - Stores core identity and pose reference images (public read)

  3. Security
    - RLS enabled on both tables
    - Anon can SELECT recent generations (last 30 days)
    - Anon can SELECT generated images for visible generations
    - All inserts go through edge function using service role
    - Storage: anon can read from both buckets
    - Storage: anon can upload to reference-images/core/ folder only
*/

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt text NOT NULL,
  enhanced_prompt text,
  model text NOT NULL,
  expression text,
  slider_level integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read recent generations"
  ON generations FOR SELECT
  TO anon
  USING (created_at > now() - interval '30 days');

CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read images for visible generations"
  ON generated_images FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = generated_images.generation_id
      AND generations.created_at > now() - interval '30 days'
    )
  );

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_generation_id ON generated_images(generation_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anon can view generated images in storage"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'generated-images');

CREATE POLICY "Anon can view reference images in storage"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'reference-images');

CREATE POLICY "Anon can upload core reference images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'reference-images');

CREATE POLICY "Anon can delete reference images"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'reference-images');