-- Debug script to check all aspects of therapy availability

-- 1. Check invoice items and their therapy types
WITH invoice_data AS (
    SELECT 
        i.id as invoice_id,
        i.patient_id,
        p.name as patient_name,
        i.status as invoice_status,
        ii.id as invoice_item_id,
        ii.therapy_type_id,
        tt.name as therapy_name,
        tt.status as therapy_status,
        ii.days,
        ii.quantity,
        ii.days * ii.quantity as total_days,
        i.created_at
    FROM invoices i
    JOIN patients p ON p.id = i.patient_id
    JOIN invoice_items ii ON ii.invoice_id = i.id
    LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
    WHERE i.status IN ('paid', 'partially_paid')
    AND tt.status = 'active'
),
therapy_totals AS (
    SELECT 
        patient_id,
        therapy_type_id,
        therapy_name,
        SUM(total_days) as total_therapy_days
    FROM invoice_data
    GROUP BY patient_id, therapy_type_id, therapy_name
)
SELECT 
    id.patient_id,
    id.patient_name,
    COUNT(DISTINCT id.invoice_id) as invoice_count,
    COUNT(DISTINCT id.therapy_type_id) as therapy_type_count,
    jsonb_agg(DISTINCT jsonb_build_object(
        'therapy_type_id', tt.therapy_type_id,
        'therapy_name', tt.therapy_name,
        'total_days', tt.total_therapy_days
    )) as therapy_summary
FROM invoice_data id
JOIN therapy_totals tt ON tt.patient_id = id.patient_id 
    AND tt.therapy_type_id = id.therapy_type_id
GROUP BY id.patient_id, id.patient_name;

-- 2. Check daily therapy records
SELECT 
    dr.patient_id,
    p.name as patient_name,
    dr.therapy_type_id,
    tt.name as therapy_name,
    COUNT(*) as used_sessions,
    MIN(dr.therapy_date) as first_session,
    MAX(dr.therapy_date) as last_session
FROM daily_therapy_records dr
JOIN patients p ON p.id = dr.patient_id
JOIN therapy_types tt ON tt.id = dr.therapy_type_id
GROUP BY dr.patient_id, p.name, dr.therapy_type_id, tt.name
ORDER BY p.name, tt.name;

-- 3. Create a function to debug therapy availability
CREATE OR REPLACE FUNCTION debug_therapy_availability(
    p_patient_id UUID,
    p_therapy_type_id UUID,
    p_date DATE
) RETURNS TABLE (
    check_name TEXT,
    check_passed BOOLEAN,
    details JSONB
) AS $$
BEGIN
    -- Check 1: Valid patient
    RETURN QUERY
    SELECT 
        'Patient exists and is active'::TEXT,
        EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id),
        jsonb_build_object(
            'patient_id', p_patient_id
        );

    -- Check 2: Valid therapy type
    RETURN QUERY
    SELECT 
        'Therapy type exists and is active'::TEXT,
        EXISTS (SELECT 1 FROM therapy_types WHERE id = p_therapy_type_id AND status = 'active'),
        jsonb_build_object(
            'therapy_type_id', p_therapy_type_id
        );

    -- Check 3: Has valid invoice
    RETURN QUERY
    WITH invoice_check AS (
        SELECT 
            i.id,
            i.status,
            ii.days,
            ii.quantity
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        WHERE i.patient_id = p_patient_id
        AND ii.therapy_type_id = p_therapy_type_id
        AND i.status IN ('paid', 'partially_paid')
    )
    SELECT 
        'Has valid invoice with therapy'::TEXT,
        EXISTS (SELECT 1 FROM invoice_check),
        (SELECT jsonb_agg(jsonb_build_object(
            'invoice_id', id,
            'status', status,
            'days', days,
            'quantity', quantity
        ))
        FROM invoice_check);

    -- Check 4: Has remaining days
    RETURN QUERY
    WITH days_check AS (
        SELECT 
            COALESCE(SUM(ii.days * ii.quantity), 0) as total_days,
            (SELECT COUNT(*) 
             FROM daily_therapy_records dr 
             WHERE dr.patient_id = p_patient_id 
             AND dr.therapy_type_id = p_therapy_type_id
             AND dr.therapy_date <= p_date) as used_days
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        WHERE i.patient_id = p_patient_id
        AND ii.therapy_type_id = p_therapy_type_id
        AND i.status IN ('paid', 'partially_paid')
    )
    SELECT 
        'Has remaining therapy days'::TEXT,
        (total_days - used_days) > 0,
        jsonb_build_object(
            'total_days', total_days,
            'used_days', used_days,
            'remaining_days', total_days - used_days
        )
    FROM days_check;
END;
$$ LANGUAGE plpgsql;

-- Test the debug function
SELECT * FROM debug_therapy_availability(
    '94801d4f-ca9e-40bc-8e6c-05d52aa2dc34'::UUID, -- Emon Ahsan
    '28e5be72-bc30-4701-8087-d5f18224d366'::UUID, -- Backpain
    CURRENT_DATE
);
