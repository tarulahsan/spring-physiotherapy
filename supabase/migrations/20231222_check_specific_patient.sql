-- Check specific patient's data
SELECT 
    p.id as patient_id,
    p.name as patient_name,
    i.id as invoice_id,
    i.status as invoice_status,
    ii.therapy_type_id,
    tt.name as therapy_name,
    tt.status as therapy_status,
    ii.days,
    ii.quantity,
    ii.days * ii.quantity as total_days,
    (
        SELECT COUNT(*)
        FROM daily_therapy_records dr
        WHERE dr.patient_id = p.id
        AND dr.therapy_type_id = ii.therapy_type_id
        AND dr.therapy_date <= CURRENT_DATE
    ) as used_days
FROM patients p
JOIN invoices i ON i.patient_id = p.id
JOIN invoice_items ii ON ii.invoice_id = i.id
JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE p.id = '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34' -- Emon Ahsan
AND i.status IN ('paid', 'partially_paid')
AND tt.status = 'active'
ORDER BY i.created_at DESC;

-- Check daily records for this patient
SELECT 
    dr.therapy_date,
    dr.therapy_time,
    tt.name as therapy_name,
    i.status as invoice_status,
    ii.days * ii.quantity as total_days
FROM daily_therapy_records dr
JOIN therapy_types tt ON tt.id = dr.therapy_type_id
LEFT JOIN invoice_items ii ON ii.therapy_type_id = dr.therapy_type_id
LEFT JOIN invoices i ON i.id = ii.invoice_id
WHERE dr.patient_id = '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34' -- Emon Ahsan
ORDER BY dr.therapy_date DESC, dr.therapy_time DESC;
