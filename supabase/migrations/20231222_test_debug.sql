-- Test debug function for specific patient and therapy
SELECT * FROM debug_remaining_days(
    '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34', -- Emon Ahsan
    '28e5be72-bc30-4701-8087-d5f18224d366', -- Backpain
    CURRENT_DATE
);

-- Check invoice items directly
SELECT 
    i.id as invoice_id,
    i.status as invoice_status,
    ii.days,
    ii.quantity,
    ii.days * ii.quantity as total_days,
    tt.name as therapy_name,
    tt.status as therapy_status,
    (
        SELECT COUNT(*)
        FROM daily_therapy_records dr
        WHERE dr.patient_id = i.patient_id
        AND dr.therapy_type_id = ii.therapy_type_id
        AND dr.therapy_date <= CURRENT_DATE
    ) as used_days
FROM invoices i
JOIN invoice_items ii ON ii.invoice_id = i.id
JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE i.patient_id = '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34'
AND i.status IN ('paid', 'partially_paid')
AND tt.id = '28e5be72-bc30-4701-8087-d5f18224d366'
ORDER BY i.created_at DESC;
