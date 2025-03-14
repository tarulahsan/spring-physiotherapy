-- Update the get_remaining_therapy_days function to handle paid and partially paid invoices
CREATE OR REPLACE FUNCTION get_remaining_therapy_days(
    p_patient_id UUID,
    p_therapy_id UUID,
    p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    used_days INTEGER;
BEGIN
    -- Get total days from invoice_items for the specific therapy type
    -- Include both paid and partially paid invoices
    SELECT COALESCE(SUM(ii.days * ii.quantity), 0)
    INTO total_days
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.patient_id = p_patient_id 
    AND ii.therapy_type_id = p_therapy_id
    AND i.status IN ('paid', 'partially_paid');

    -- Get used days from daily_therapy_records up to the given date
    SELECT COUNT(*)
    INTO used_days
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_type_id = p_therapy_id
    AND therapy_date <= p_date;

    -- Return remaining days, minimum 0
    RETURN GREATEST(total_days - used_days, 0);
END;
$$ LANGUAGE plpgsql;
