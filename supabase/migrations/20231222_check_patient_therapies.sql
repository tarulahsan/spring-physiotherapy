-- Check therapy data for a specific patient
WITH patient_data AS (
  SELECT 
    p.id as patient_id,
    p.name as patient_name,
    i.id as invoice_id,
    i.status as invoice_status,
    ii.id as invoice_item_id,
    ii.therapy_type_id,
    ii.days,
    ii.quantity,
    tt.name as therapy_name,
    tt.status as therapy_status
  FROM patients p
  JOIN invoices i ON i.patient_id = p.id
  JOIN invoice_items ii ON ii.invoice_id = i.id
  JOIN therapy_types tt ON tt.id = ii.therapy_type_id
  WHERE i.status IN ('paid', 'partially_paid')
  AND tt.status = 'active'
)
SELECT 
  patient_id,
  patient_name,
  jsonb_agg(jsonb_build_object(
    'invoice_id', invoice_id,
    'invoice_status', invoice_status,
    'therapy_type_id', therapy_type_id,
    'therapy_name', therapy_name,
    'days', days,
    'quantity', quantity,
    'total_days', days * quantity
  )) as therapy_details
FROM patient_data
GROUP BY patient_id, patient_name;
