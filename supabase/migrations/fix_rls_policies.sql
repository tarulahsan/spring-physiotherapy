-- Begin transaction
BEGIN;

-- First, ensure RLS is enabled on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Show only non-archived patients" ON patients;
DROP POLICY IF EXISTS "Show only non-archived therapy sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Show only non-archived therapy types" ON therapy_types;
DROP POLICY IF EXISTS "Show only non-archived invoice items" ON invoice_items;

-- Create stricter policies
CREATE POLICY "Show only non-archived patients" ON patients
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND archived = FALSE
    );

CREATE POLICY "Show only non-archived therapy sessions" ON therapy_sessions
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND archived = FALSE
    );

CREATE POLICY "Show only non-archived therapy types" ON therapy_types
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND archived = FALSE
    );

CREATE POLICY "Show only non-archived invoice items" ON invoice_items
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND archived = FALSE
    );

-- Double-check that all existing records are archived
UPDATE patients SET archived = TRUE WHERE archived IS NULL OR archived = FALSE;
UPDATE therapy_sessions SET archived = TRUE WHERE archived IS NULL OR archived = FALSE;
UPDATE therapy_types SET archived = TRUE WHERE archived IS NULL OR archived = FALSE;
UPDATE invoice_items SET archived = TRUE WHERE archived IS NULL OR archived = FALSE;

COMMIT;
