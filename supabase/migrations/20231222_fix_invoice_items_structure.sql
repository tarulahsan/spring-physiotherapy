-- Fix invoice items structure by merging discount rows into therapy rows
DO $$ 
DECLARE
    r RECORD;
    therapy_id UUID;
    updated_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    -- First, add discount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'discount'
    ) THEN
        ALTER TABLE invoice_items 
        ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added discount column to invoice_items';
    END IF;

    -- Find pairs of rows where one is a discount row and one is a therapy row
    FOR r IN (
        SELECT 
            i1.id as discount_row_id,
            i2.id as therapy_row_id,
            i1.invoice_id,
            i2.therapy_type_id,
            i1.total_amount as discount_amount,
            i2.unit_price,
            COALESCE(tt.name, 'Unknown') as therapy_name
        FROM invoice_items i1
        JOIN invoice_items i2 ON i1.invoice_id = i2.invoice_id
        LEFT JOIN therapy_types tt ON tt.id = i2.therapy_type_id
        WHERE i1.unit_price = 0 
        AND i1.total_amount < 0  -- This is the discount row
        AND i2.unit_price > 0    -- This is the therapy row
        AND i1.id != i2.id
    ) LOOP
        -- If therapy type doesn't exist for this price point, create it
        IF r.therapy_type_id IS NULL THEN
            INSERT INTO therapy_types (name, description, price, is_active)
            VALUES (
                'Therapy ' || r.unit_price::text, 
                'Therapy with price ' || r.unit_price::text,
                r.unit_price,
                true
            )
            RETURNING id INTO therapy_id;
            
            RAISE NOTICE 'Created therapy type % with price %', 
                'Therapy ' || r.unit_price::text, r.unit_price;
        ELSE
            therapy_id := r.therapy_type_id;
        END IF;

        -- Update the therapy row to include the discount
        UPDATE invoice_items
        SET 
            discount = ABS(r.discount_amount),
            therapy_type_id = therapy_id,
            total_amount = (unit_price * quantity * days) - ABS(r.discount_amount)
        WHERE id = r.therapy_row_id;

        updated_count := updated_count + 1;

        -- Delete the discount row
        DELETE FROM invoice_items
        WHERE id = r.discount_row_id;

        deleted_count := deleted_count + 1;

        RAISE NOTICE 'Updated invoice % item % (%) with discount % and deleted row %', 
            r.invoice_id, r.therapy_row_id, r.therapy_name, ABS(r.discount_amount), r.discount_row_id;
    END LOOP;

    RAISE NOTICE 'Total updates: %, Total deletions: %', updated_count, deleted_count;

    -- Update any remaining items without therapy types
    UPDATE invoice_items ii
    SET therapy_type_id = (
        SELECT id 
        FROM therapy_types 
        WHERE price = ii.unit_price 
        LIMIT 1
    )
    WHERE therapy_type_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM therapy_types 
        WHERE price = ii.unit_price
    );

    -- Create therapy types for any remaining items
    INSERT INTO therapy_types (name, description, price, is_active)
    SELECT DISTINCT
        'Therapy ' || ii.unit_price::text,
        'Therapy with price ' || ii.unit_price::text,
        ii.unit_price,
        true
    FROM invoice_items ii
    WHERE ii.therapy_type_id IS NULL
    AND ii.unit_price > 0
    AND NOT EXISTS (
        SELECT 1 
        FROM therapy_types 
        WHERE price = ii.unit_price
    );

    -- Update remaining items with new therapy types
    WITH new_types AS (
        SELECT id, price 
        FROM therapy_types 
        WHERE name LIKE 'Therapy %'
    )
    UPDATE invoice_items ii
    SET therapy_type_id = nt.id
    FROM new_types nt
    WHERE ii.therapy_type_id IS NULL
    AND ii.unit_price = nt.price;
END $$;

-- Verify the changes
SELECT 
    ii.id,
    ii.invoice_id,
    ii.therapy_type_id,
    tt.name as therapy_name,
    ii.quantity,
    ii.days,
    ii.unit_price,
    ii.discount,
    ii.total_amount,
    i.status,
    i.patient_id
FROM invoice_items ii
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
JOIN invoices i ON i.id = ii.invoice_id
WHERE ii.therapy_type_id IS NULL
   OR ii.discount > 0
ORDER BY i.created_at DESC;
