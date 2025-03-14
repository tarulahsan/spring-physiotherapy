-- Check invoice items for a specific patient
WITH patient_invoices AS (
  SELECT DISTINCT i.id as invoice_id, i.patient_id, i.status as invoice_status
  FROM invoices i 
  WHERE i.status != 'cancelled'
)
SELECT 
  ii.id as invoice_item_id,
  ii.invoice_id,
  ii.therapy_type_id,
  ii.days,
  ii.quantity,
  ii.unit_price,
  ii.discount,
  ii.total_amount,
  tt.name as therapy_name,
  tt.status as therapy_status,
  i.patient_id,
  i.invoice_status,
  p.name as patient_name
FROM patient_invoices i
JOIN invoice_items ii ON ii.invoice_id = i.invoice_id
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
LEFT JOIN patients p ON p.id = i.patient_id
WHERE tt.status = 'active'
ORDER BY i.patient_id, ii.invoice_id;

-- Check daily therapy records for the same patient
SELECT 
  dtr.id,
  dtr.patient_id,
  dtr.therapy_type_id,
  dtr.therapy_date,
  dtr.therapy_time,
  tt.name as therapy_name,
  p.name as patient_name
FROM daily_therapy_records dtr
JOIN therapy_types tt ON tt.id = dtr.therapy_type_id
JOIN patients p ON p.id = dtr.patient_id
ORDER BY dtr.therapy_date DESC, dtr.therapy_time DESC;
