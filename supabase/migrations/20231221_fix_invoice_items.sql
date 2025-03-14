-- First, drop the existing therapy_id foreign key if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_therapy_item' 
        AND table_name = 'invoice_items'
    ) THEN
        ALTER TABLE invoice_items DROP CONSTRAINT fk_therapy_item;
    END IF;
END $$;

-- Add therapy_type_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'therapy_type_id'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN therapy_type_id UUID REFERENCES therapy_types(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Migrate data from therapy_id to therapy_type_id if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'therapy_id'
    ) THEN
        UPDATE invoice_items 
        SET therapy_type_id = therapy_id;
        
        ALTER TABLE invoice_items DROP COLUMN therapy_id;
    END IF;
END $$;

-- Add or update columns to match the new schema
DO $$ 
BEGIN
    -- Add unit_price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN unit_price DECIMAL(10, 2);
        UPDATE invoice_items SET unit_price = price WHERE price IS NOT NULL;
    END IF;

    -- Add discount_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add total_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN total_amount DECIMAL(10, 2);
        UPDATE invoice_items SET total_amount = amount WHERE amount IS NOT NULL;
    END IF;

    -- Drop old columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE invoice_items DROP COLUMN price;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE invoice_items DROP COLUMN amount;
    END IF;
END $$;
