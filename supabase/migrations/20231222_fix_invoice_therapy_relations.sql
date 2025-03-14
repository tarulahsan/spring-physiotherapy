-- First, let's check and fix the foreign key relationship
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoice_items_therapy_type_id_fkey'
        AND table_name = 'invoice_items'
    ) THEN
        ALTER TABLE invoice_items DROP CONSTRAINT invoice_items_therapy_type_id_fkey;
    END IF;

    -- Add the correct foreign key constraint
    ALTER TABLE invoice_items
    ADD CONSTRAINT invoice_items_therapy_type_id_fkey
    FOREIGN KEY (therapy_type_id)
    REFERENCES therapy_types(id)
    ON DELETE RESTRICT;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_invoice_items_therapy_type_id 
    ON invoice_items(therapy_type_id);
END $$;

-- Create or replace the function to get remaining therapy days
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
    AND ii.therapy_type_id = p_therapy_id
    AND i.status != 'cancelled';

    -- Get used days from daily_therapy_records
    SELECT COUNT(*)
    INTO used_days
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_id = p_therapy_id
    AND therapy_date <= p_date;

    -- Log the calculation
    RAISE NOTICE 'Patient: %, Therapy: %, Total Days: %, Used Days: %', 
                 p_patient_id, p_therapy_id, total_days, used_days;

    RETURN GREATEST(total_days - used_days, 0);
END;
$$ LANGUAGE plpgsql;
