-- Add archived column to tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE therapy_sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE therapy_types ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Drop existing RLS policies that might conflict
DROP POLICY IF EXISTS "Show only non-archived patients" ON patients;
DROP POLICY IF EXISTS "Show only non-archived therapy sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Show only non-archived therapy types" ON therapy_types;
DROP POLICY IF EXISTS "Show only non-archived invoice items" ON invoice_items;

-- Create new RLS policies to filter out archived records
CREATE POLICY "Show only non-archived patients" ON patients
FOR SELECT USING (archived = FALSE);

CREATE POLICY "Show only non-archived therapy sessions" ON therapy_sessions
FOR SELECT USING (archived = FALSE);

CREATE POLICY "Show only non-archived therapy types" ON therapy_types
FOR SELECT USING (archived = FALSE);

CREATE POLICY "Show only non-archived invoice items" ON invoice_items
FOR SELECT USING (archived = FALSE);

-- Mark all existing records as archived (test data)
UPDATE patients SET archived = TRUE;
UPDATE therapy_sessions SET archived = TRUE;
UPDATE therapy_types SET archived = TRUE;
UPDATE invoice_items SET archived = TRUE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_archived ON patients(archived);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_archived ON therapy_sessions(archived);
CREATE INDEX IF NOT EXISTS idx_therapy_types_archived ON therapy_types(archived);
CREATE INDEX IF NOT EXISTS idx_invoice_items_archived ON invoice_items(archived);

-- Function to unarchive specific records if needed
CREATE OR REPLACE FUNCTION unarchive_record(
    table_name text,
    record_id uuid
) RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET archived = FALSE WHERE id = $1', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
