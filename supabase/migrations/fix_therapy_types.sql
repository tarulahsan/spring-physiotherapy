-- Begin transaction
BEGIN;

-- First, check current RLS status
SELECT tablename, hasrls 
FROM pg_tables 
WHERE tablename = 'therapy_types';

-- Ensure RLS is enabled
ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for therapy_types
DROP POLICY IF EXISTS "Show only non-archived therapy types" ON therapy_types;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON therapy_types;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON therapy_types;

-- Create new strict policy
CREATE POLICY "Show only non-archived therapy types" ON therapy_types
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND archived = FALSE
    );

-- Make sure all existing therapy types are archived
UPDATE therapy_types 
SET archived = TRUE 
WHERE archived IS NULL OR archived = FALSE;

COMMIT;
