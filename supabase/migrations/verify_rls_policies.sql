-- Test RLS policies by checking what a normal user would see
BEGIN;

-- First, enable RLS testing mode
SET SESSION ROLE authenticated;

-- Check what records are visible to normal users
SELECT 'patients' as table_name, COUNT(*) as visible_records 
FROM patients
UNION ALL
SELECT 'therapy_sessions', COUNT(*) 
FROM therapy_sessions
UNION ALL
SELECT 'therapy_types', COUNT(*) 
FROM therapy_types
UNION ALL
SELECT 'invoice_items', COUNT(*) 
FROM invoice_items;

-- Reset role
RESET ROLE;

COMMIT;
