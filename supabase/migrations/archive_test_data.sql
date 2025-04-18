-- Begin transaction
BEGIN;

-- 1. Add archived column to tables
ALTER TABLE IF EXISTS patients 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS therapy_sessions 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS therapy_types 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS invoice_items 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_archived 
  ON patients(archived);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_archived 
  ON therapy_sessions(archived);

CREATE INDEX IF NOT EXISTS idx_therapy_types_archived 
  ON therapy_types(archived);

CREATE INDEX IF NOT EXISTS idx_invoice_items_archived 
  ON invoice_items(archived);

-- 3. Archive all existing data
UPDATE patients SET archived = TRUE;
UPDATE therapy_sessions SET archived = TRUE;
UPDATE therapy_types SET archived = TRUE;
UPDATE invoice_items SET archived = TRUE;

-- 4. Create or replace policies
-- Patients table policies
DROP POLICY IF EXISTS "Show only non-archived patients" ON patients;
CREATE POLICY "Show only non-archived patients" ON patients
  FOR ALL USING (archived = FALSE);

-- Therapy sessions table policies
DROP POLICY IF EXISTS "Show only non-archived therapy sessions" ON therapy_sessions;
CREATE POLICY "Show only non-archived therapy sessions" ON therapy_sessions
  FOR ALL USING (archived = FALSE);

-- Therapy types table policies
DROP POLICY IF EXISTS "Show only non-archived therapy types" ON therapy_types;
CREATE POLICY "Show only non-archived therapy types" ON therapy_types
  FOR ALL USING (archived = FALSE);

-- Invoice items table policies
DROP POLICY IF EXISTS "Show only non-archived invoice items" ON invoice_items;
CREATE POLICY "Show only non-archived invoice items" ON invoice_items
  FOR ALL USING (archived = FALSE);

-- 5. Create helper functions for managing archived data
CREATE OR REPLACE FUNCTION unarchive_record(
    p_table_name text,
    p_record_id uuid
) RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET archived = FALSE WHERE id = $1', p_table_name)
    USING p_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION view_archived_records(
    p_table_name text
) RETURNS SETOF record AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT * FROM %I WHERE archived = TRUE', p_table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
