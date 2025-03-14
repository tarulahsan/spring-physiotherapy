-- Create logos bucket if it doesn't exist
BEGIN;

-- Create the logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the logos bucket
CREATE POLICY "Give public access to logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to manage logos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

COMMIT;
