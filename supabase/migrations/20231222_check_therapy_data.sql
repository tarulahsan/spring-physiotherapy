-- Check invoice items data
SELECT 
    ii.id,
    ii.invoice_id,
    ii.therapy_type_id,
    ii.quantity,
    ii.days,
    ii.unit_price,
    ii.discount,
    ii.total_amount,
    i.patient_id,
    i.status as invoice_status,
    tt.name as therapy_name,
    tt.status as therapy_status
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE i.status != 'cancelled'
ORDER BY i.created_at DESC
LIMIT 10;

-- Check daily therapy records
SELECT 
    dtr.*,
    tt.name as therapy_name
FROM daily_therapy_records dtr
LEFT JOIN therapy_types tt ON tt.id = dtr.therapy_type_id
ORDER BY therapy_date DESC
LIMIT 10;

-- Check therapy types
SELECT *
FROM therapy_types
WHERE status = 'active'
ORDER BY name;
