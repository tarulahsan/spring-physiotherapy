-- Add comment to invoice_items.quantity to clarify its purpose
COMMENT ON COLUMN invoice_items.quantity IS 'Number of therapy sessions for this invoice item';

-- Update get_remaining_therapy_days function to use quantity instead of sessions
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
    -- quantity represents number of sessions
    SELECT COALESCE(SUM(ii.days * ii.quantity), 0)
    INTO total_days
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.patient_id = p_patient_id 
    AND ii.therapy_id = p_therapy_id  -- Fix: use ii.therapy_id instead of ii.therapy_type_id
    AND i.status != 'cancelled';

    -- Get used days from daily_therapy_records
    SELECT COUNT(*)
    INTO used_days
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_id = p_therapy_id
    AND therapy_date <= p_date;

    RETURN GREATEST(total_days - used_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to update invoice_items total_amount
CREATE OR REPLACE FUNCTION update_invoice_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := (NEW.unit_price * NEW.quantity * NEW.days) - COALESCE(NEW.discount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_invoice_item_total ON invoice_items;
CREATE TRIGGER tr_update_invoice_item_total
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_item_total();
