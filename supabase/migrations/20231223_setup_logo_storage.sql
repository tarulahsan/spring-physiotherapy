-- Set up storage for logo uploads
BEGIN;

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON storage.objects;

-- Create new policies
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to manage avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

COMMIT;
