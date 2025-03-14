-- First, let's see which invoice items have null therapy_type_id
SELECT 
    ii.id as invoice_item_id,
    i.id as invoice_id,
    i.patient_id,
    p.name as patient_name,
    ii.therapy_type_id,
    ii.days,
    ii.quantity,
    ii.unit_price
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
JOIN patients p ON p.id = i.patient_id
WHERE ii.therapy_type_id IS NULL;

-- Drop existing constraint if it exists
ALTER TABLE invoice_items 
    DROP CONSTRAINT IF EXISTS fk_invoice_items_therapy_type;

-- Add NOT NULL constraint if not already present
DO $$ 
BEGIN
    ALTER TABLE invoice_items ALTER COLUMN therapy_type_id SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Add foreign key constraint
ALTER TABLE invoice_items 
    ADD CONSTRAINT fk_invoice_items_therapy_type
    FOREIGN KEY (therapy_type_id) 
    REFERENCES therapy_types(id)
    ON DELETE RESTRICT;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_therapy_type_active ON invoice_items;
DROP FUNCTION IF EXISTS check_therapy_type_active();

-- Add trigger to ensure therapy_type exists and is active
CREATE OR REPLACE FUNCTION check_therapy_type_active()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if therapy type exists and is active
    IF NOT EXISTS (
        SELECT 1 
        FROM therapy_types 
        WHERE id = NEW.therapy_type_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Therapy type must exist and be active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_therapy_type_active
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION check_therapy_type_active();
