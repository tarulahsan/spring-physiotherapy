-- Enable storage for logo uploads
BEGIN;

-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false
);

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create the logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage
CREATE POLICY "Allow authenticated users full access to logos bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS objects_path_tokens_idx ON storage.objects USING gin (path_tokens);

COMMIT;
