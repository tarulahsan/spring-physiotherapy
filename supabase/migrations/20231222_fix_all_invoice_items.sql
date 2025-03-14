BEGIN;

-- First, add discount column if it doesn't exist
DO $$ 
BEGIN
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
END $$;

-- Create temporary table to store invoice groups
CREATE TEMP TABLE invoice_groups AS
WITH ordered_items AS (
    SELECT 
        i.id as invoice_id,
        i.patient_id,
        i.status,
        ii.id as item_id,
        ii.unit_price,
        ii.total_amount,
        ii.quantity,
        ii.days,
        ii.therapy_type_id,
        ROW_NUMBER() OVER (PARTITION BY i.id ORDER BY ii.unit_price = 0 DESC) as rn
    FROM invoices i
    JOIN invoice_items ii ON i.id = ii.invoice_id
    WHERE EXISTS (
        SELECT 1 
        FROM invoice_items ii2 
        WHERE ii2.invoice_id = i.id 
        AND ii2.unit_price = 0 
        AND ii2.total_amount < 0
    )
)
SELECT 
    invoice_id,
    patient_id,
    status,
    FIRST_VALUE(CASE WHEN unit_price = 0 AND total_amount < 0 THEN item_id END) 
        OVER (PARTITION BY invoice_id) as discount_row_id,
    FIRST_VALUE(CASE WHEN unit_price = 0 AND total_amount < 0 THEN ABS(total_amount) END) 
        OVER (PARTITION BY invoice_id) as discount_amount,
    FIRST_VALUE(CASE WHEN unit_price > 0 THEN item_id END) 
        OVER (PARTITION BY invoice_id) as therapy_row_id,
    FIRST_VALUE(CASE WHEN unit_price > 0 THEN unit_price END) 
        OVER (PARTITION BY invoice_id) as therapy_price,
    FIRST_VALUE(CASE WHEN unit_price > 0 THEN quantity END) 
        OVER (PARTITION BY invoice_id) as therapy_quantity,
    FIRST_VALUE(CASE WHEN unit_price > 0 THEN days END) 
        OVER (PARTITION BY invoice_id) as therapy_days,
    FIRST_VALUE(CASE WHEN unit_price > 0 THEN therapy_type_id END) 
        OVER (PARTITION BY invoice_id) as therapy_type_id
FROM ordered_items
WHERE rn = 1;

-- Create therapy types for items that don't have them
INSERT INTO therapy_types (name, description, price)
SELECT DISTINCT
    CASE 
        WHEN therapy_price = 1500.00 THEN 'Knee Pain'
        ELSE 'Therapy ' || therapy_price::text
    END,
    CASE 
        WHEN therapy_price = 1500.00 THEN 'Knee Pain Treatment'
        ELSE 'Therapy with price ' || therapy_price::text
    END,
    therapy_price
FROM invoice_groups ig
WHERE NOT EXISTS (
    SELECT 1 FROM therapy_types tt 
    WHERE tt.price = ig.therapy_price
);

-- Update therapy rows with correct data
WITH therapy_mapping AS (
    SELECT id, price 
    FROM therapy_types
)
UPDATE invoice_items ii
SET 
    therapy_type_id = COALESCE(ii.therapy_type_id, tm.id),
    discount = ig.discount_amount,
    total_amount = (ii.unit_price * ii.quantity * ii.days) - COALESCE(ig.discount_amount, 0)
FROM invoice_groups ig
JOIN therapy_mapping tm ON tm.price = ig.therapy_price
WHERE ii.id = ig.therapy_row_id;

-- Delete the discount rows
DELETE FROM invoice_items
WHERE id IN (
    SELECT discount_row_id 
    FROM invoice_groups 
    WHERE discount_row_id IS NOT NULL
);

-- Clean up
DROP TABLE invoice_groups;

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
    (ii.unit_price * ii.quantity * ii.days) as subtotal,
    ii.discount as discount_amount,
    ii.total_amount,
    i.status,
    i.patient_id
FROM invoice_items ii
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
JOIN invoices i ON i.id = ii.invoice_id
ORDER BY i.created_at DESC;

COMMIT;
