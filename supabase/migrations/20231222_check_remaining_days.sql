-- Check remaining days calculation for a specific patient
CREATE OR REPLACE FUNCTION debug_remaining_days(p_patient_id UUID, p_therapy_id UUID, p_date DATE)
RETURNS TABLE (
    total_therapy_days INTEGER,
    used_days INTEGER,
    remaining_days INTEGER,
    invoice_details JSONB,
    daily_records_details JSONB
) AS $$
DECLARE
    v_total_days INTEGER;
    v_used_days INTEGER;
    v_remaining_days INTEGER;
    v_invoice_details JSONB;
    v_daily_records_details JSONB;
BEGIN
    -- Get total therapy days from invoices
    SELECT 
        COALESCE(SUM(ii.days * ii.quantity), 0),
        jsonb_agg(jsonb_build_object(
            'invoice_id', i.id,
            'invoice_status', i.status,
            'therapy_days', ii.days,
            'quantity', ii.quantity,
            'total_days', ii.days * ii.quantity
        ))
    INTO v_total_days, v_invoice_details
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.patient_id = p_patient_id
    AND ii.therapy_type_id = p_therapy_id
    AND i.status IN ('paid', 'partially_paid');

    -- Get used days from daily records
    SELECT 
        COALESCE(COUNT(*), 0),
        jsonb_agg(jsonb_build_object(
            'therapy_date', dr.therapy_date,
            'therapy_time', dr.therapy_time,
            'therapy_type_id', dr.therapy_type_id
        ))
    INTO v_used_days, v_daily_records_details
    FROM daily_therapy_records dr
    WHERE dr.patient_id = p_patient_id
    AND dr.therapy_type_id = p_therapy_id
    AND dr.therapy_date <= p_date;

    -- Calculate remaining days
    v_remaining_days := v_total_days - v_used_days;

    RETURN QUERY 
    SELECT 
        v_total_days as total_therapy_days,
        v_used_days as used_days,
        v_remaining_days as remaining_days,
        v_invoice_details as invoice_details,
        v_daily_records_details as daily_records_details;
END;
$$ LANGUAGE plpgsql;

-- Test the function with a specific patient
SELECT * FROM debug_remaining_days(
    '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34'::UUID, -- Emon Ahsan
    '28e5be72-bc30-4701-8087-d5f18224d366'::UUID, -- Backpain
    CURRENT_DATE
);

-- Check daily records for this patient
SELECT 
    dr.id,
    dr.patient_id,
    p.name as patient_name,
    dr.therapy_type_id,
    tt.name as therapy_name,
    dr.therapy_date,
    dr.therapy_time,
    dr.created_at
FROM daily_therapy_records dr
JOIN patients p ON p.id = dr.patient_id
JOIN therapy_types tt ON tt.id = dr.therapy_type_id
WHERE dr.patient_id = '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34'
ORDER BY dr.therapy_date DESC, dr.therapy_time DESC;
