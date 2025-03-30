-- Check if archived columns exist and their current state
SELECT 
  table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN archived THEN 1 ELSE 0 END) as archived_records,
  SUM(CASE WHEN NOT archived THEN 1 ELSE 0 END) as active_records
FROM (
  SELECT 'patients' as table_name, archived FROM patients
  UNION ALL
  SELECT 'therapy_sessions', archived FROM therapy_sessions
  UNION ALL
  SELECT 'therapy_types', archived FROM therapy_types
  UNION ALL
  SELECT 'invoice_items', archived FROM invoice_items
) t
GROUP BY table_name;
