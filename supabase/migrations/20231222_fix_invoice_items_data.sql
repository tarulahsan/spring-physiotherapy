-- Update invoice items with null therapy_type_id
WITH therapy_mapping AS (
  SELECT DISTINCT ON (ii.unit_price)
    ii.unit_price,
    tt.id as therapy_type_id
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
AND ii.unit_price = tm.unit_price;

-- Delete any remaining invoice items with null therapy_type_id
DELETE FROM invoice_items
WHERE therapy_type_id IS NULL;

-- Verify the update
SELECT 
    i.patient_id,
    p.name as patient_name,
    i.id as invoice_id,
    i.status as invoice_status,
    ii.therapy_type_id,
    tt.name as therapy_name,
    tt.status as therapy_status,
    ii.days,
    ii.quantity,
    ii.unit_price
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
JOIN patients p ON p.id = i.patient_id
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE i.status IN ('paid', 'partially_paid')
ORDER BY i.created_at DESC;
