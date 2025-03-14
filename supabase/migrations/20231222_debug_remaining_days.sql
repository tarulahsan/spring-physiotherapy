-- Debug function to check remaining days calculation
CREATE OR REPLACE FUNCTION debug_remaining_days(
    p_patient_id UUID,
    p_therapy_id UUID,
    p_date DATE
)
RETURNS TABLE (
    total_days INTEGER,
    used_days INTEGER,
    remaining_days INTEGER,
    invoice_items_details JSONB,
    daily_records_details JSONB
) AS $$
DECLARE
    total_days INTEGER;
    used_days INTEGER;
    remaining_days INTEGER;
    invoice_items_details JSONB;
    daily_records_details JSONB;
BEGIN
    -- Get invoice items details
    SELECT jsonb_agg(jsonb_build_object(
        'invoice_id', i.id,
        'invoice_status', i.status,
        'days', ii.days,
        'quantity', ii.quantity,
        'total_days', ii.days * ii.quantity
    ))
    INTO invoice_items_details
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.patient_id = p_patient_id 
    AND ii.therapy_type_id = p_therapy_id
    AND i.status IN ('paid', 'partially_paid');

    -- Get total days
    SELECT COALESCE(SUM(ii.days * ii.quantity), 0)
    INTO total_days
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.patient_id = p_patient_id 
    AND ii.therapy_type_id = p_therapy_id
    AND i.status IN ('paid', 'partially_paid');

    -- Get daily records details
    SELECT jsonb_agg(jsonb_build_object(
        'therapy_date', therapy_date,
        'therapy_time', therapy_time
    ))
    INTO daily_records_details
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_type_id = p_therapy_id
    AND therapy_date <= p_date;

    -- Get used days
    SELECT COUNT(*)
    INTO used_days
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_type_id = p_therapy_id
    AND therapy_date <= p_date;

    -- Calculate remaining days
    remaining_days := GREATEST(total_days - used_days, 0);

    RETURN QUERY
    SELECT 
        total_days,
        used_days,
        remaining_days,
        COALESCE(invoice_items_details, '[]'::jsonb),
        COALESCE(daily_records_details, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
