-- Add function to calculate total amount with discount
CREATE OR REPLACE FUNCTION calculate_invoice_item_total(
    p_unit_price DECIMAL,
    p_quantity INTEGER,
    p_days INTEGER,
    p_discount DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (p_unit_price * p_quantity * p_days) - COALESCE(p_discount, 0);
END;
$$ LANGUAGE plpgsql;

-- Update total_amount for all invoice items to account for discount
DO $$ 
BEGIN
    UPDATE invoice_items
    SET total_amount = calculate_invoice_item_total(
        unit_price,
        quantity,
        days,
        discount
    )
    WHERE id IN (
        SELECT ii.id
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE i.status != 'cancelled'
        AND discount > 0
    );

    RAISE NOTICE 'Updated total amounts for invoice items with discounts';
END $$;

-- Verify the changes for our specific invoice
SELECT 
    ii.id,
    ii.invoice_id,
    tt.name as therapy_name,
    ii.quantity,
    ii.days,
    ii.unit_price,
    ii.discount,
    ii.total_amount as old_total,
    calculate_invoice_item_total(
        ii.unit_price,
        ii.quantity,
        ii.days,
        ii.discount
    ) as calculated_total
FROM invoice_items ii
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.id = 'c3d67760-b8b7-4a7f-aaf9-10962fbd9c05'  -- The invoice from the image
ORDER BY i.created_at DESC;

BEGIN;

-- First ensure all therapy types exist
INSERT INTO therapy_types (name, description, price)
SELECT DISTINCT
    CASE 
        WHEN unit_price = 1500.00 THEN 'Knee Pain'
        WHEN unit_price = 1300.00 THEN 'Back Pain Advanced'
        WHEN unit_price = 1200.00 THEN 'Back Pain Medium'
        WHEN unit_price = 1000.00 THEN 'Back Pain Basic'
        WHEN unit_price = 500.00 THEN 'Basic Therapy'
        ELSE 'Therapy ' || unit_price::text
    END,
    CASE 
        WHEN unit_price = 1500.00 THEN 'Knee Pain Treatment'
        WHEN unit_price = 1300.00 THEN 'Advanced Back Pain Treatment'
        WHEN unit_price = 1200.00 THEN 'Medium Back Pain Treatment'
        WHEN unit_price = 1000.00 THEN 'Basic Back Pain Treatment'
        WHEN unit_price = 500.00 THEN 'Basic Therapy Treatment'
        ELSE 'Therapy with price ' || unit_price::text
    END,
    unit_price
FROM invoice_items
WHERE unit_price > 0
AND NOT EXISTS (
    SELECT 1 FROM therapy_types tt 
    WHERE tt.price = invoice_items.unit_price
);

-- Link all items to their therapy types
WITH therapy_mapping AS (
    SELECT id, price FROM therapy_types
)
UPDATE invoice_items ii
SET 
    therapy_type_id = tm.id,
    total_amount = (ii.unit_price * ii.quantity * ii.days) - COALESCE(ii.discount, 0)
FROM therapy_mapping tm
WHERE tm.price = ii.unit_price
AND ii.unit_price > 0;

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
