-- Set up storage policies for logo uploads
BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give public access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for public access to logos (SELECT)
CREATE POLICY "Give public access to logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Policy for authenticated users to upload logos (INSERT)
CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'logos'
    AND (auth.role() = 'authenticated'::text)
);

-- Policy for authenticated users to update logos (UPDATE)
CREATE POLICY "Allow authenticated users to update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'logos'
    AND (auth.role() = 'authenticated'::text)
)
WITH CHECK (
    bucket_id = 'logos'
    AND (auth.role() = 'authenticated'::text)
);

-- Policy for authenticated users to delete logos (DELETE)
CREATE POLICY "Allow authenticated users to delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'logos'
    AND (auth.role() = 'authenticated'::text)
);

-- Create a single policy for authenticated users with full access
CREATE POLICY "Allow full access to authenticated users"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
