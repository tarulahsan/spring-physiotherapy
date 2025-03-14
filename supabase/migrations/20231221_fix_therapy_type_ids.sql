-- Add therapy_type_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'therapy_type_id'
    ) THEN
        ALTER TABLE invoice_items 
        ADD COLUMN therapy_type_id UUID REFERENCES therapy_types(id);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invoice_items_therapy_type' 
        AND table_name = 'invoice_items'
    ) THEN
        ALTER TABLE invoice_items 
        ADD CONSTRAINT fk_invoice_items_therapy_type 
        FOREIGN KEY (therapy_type_id) 
        REFERENCES therapy_types(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- Update invoice_items to set therapy_type_id from therapy_session
UPDATE invoice_items ii
SET therapy_type_id = ts.therapy_type_id
FROM therapy_sessions ts
WHERE ii.therapy_session_id = ts.id
AND ii.therapy_type_id IS NULL;
