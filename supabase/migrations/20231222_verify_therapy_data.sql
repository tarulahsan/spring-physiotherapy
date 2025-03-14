-- Verify therapy data is correct
WITH therapy_summary AS (
  SELECT 
    i.patient_id,
    p.name as patient_name,
    tt.id as therapy_type_id,
    tt.name as therapy_name,
    tt.status as therapy_status,
    COUNT(*) as invoice_item_count,
    SUM(ii.days * ii.quantity) as total_days,
    STRING_AGG(i.status, ', ') as invoice_statuses
  FROM invoice_items ii
  JOIN invoices i ON i.id = ii.invoice_id
  JOIN patients p ON p.id = i.patient_id
  JOIN therapy_types tt ON tt.id = ii.therapy_type_id
  WHERE i.status IN ('paid', 'partially_paid')
  AND tt.status = 'active'
  GROUP BY 
    i.patient_id, 
    p.name,
    tt.id,
    tt.name,
    tt.status
)
SELECT 
  patient_id,
  patient_name,
  therapy_type_id,
  therapy_name,
  therapy_status,
  invoice_item_count,
  total_days,
  invoice_statuses
FROM therapy_summary
ORDER BY patient_name, therapy_name;
