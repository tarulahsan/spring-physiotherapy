-- Update invoice items with missing therapy types
WITH therapy_mapping AS (
  SELECT DISTINCT ON (ii.unit_price)
    ii.unit_price,
    tt.id as therapy_type_id,
    tt.name as therapy_name
  FROM invoice_items ii
  CROSS JOIN therapy_types tt
  WHERE ii.therapy_type_id IS NULL
  AND tt.price = ii.unit_price
  AND tt.status = 'active'
)
UPDATE invoice_items ii
SET therapy_type_id = tm.therapy_type_id
FROM therapy_mapping tm
WHERE ii.therapy_type_id IS NULL
AND ii.unit_price = tm.unit_price
RETURNING 
    ii.id, 
    ii.invoice_id, 
    ii.therapy_type_id,
    tm.therapy_name,
    ii.unit_price;

-- Check remaining null therapy_type_ids
SELECT 
    ii.id,
    i.patient_id,
    p.name as patient_name,
    i.status as invoice_status,
    ii.therapy_type_id,
    ii.unit_price,
    ii.days,
    ii.quantity,
    tt.name as therapy_name
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
JOIN patients p ON p.id = i.patient_id
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE ii.therapy_type_id IS NULL;
