-- Begin transaction
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for therapy_types
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
