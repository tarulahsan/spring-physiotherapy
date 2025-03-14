-- Update invoice_items to ensure therapy_type_id is set correctly
DO $$ 
DECLARE
    problem_count INTEGER;
    r RECORD;
BEGIN
    -- First, let's check if there are any invoice items with null therapy_type_id
    RAISE NOTICE 'Checking for invoice items with null therapy_type_id...';
    
    SELECT COUNT(*) INTO problem_count
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE ii.therapy_type_id IS NULL;

    RAISE NOTICE 'Found % invoice items with null therapy_type_id', problem_count;

    -- Let's see what therapy types we have
    RAISE NOTICE 'Available therapy types:';
    FOR r IN (
        SELECT id, name 
        FROM therapy_types 
        ORDER BY name
    )
    LOOP
        RAISE NOTICE 'Therapy Type: % - %', r.name, r.id;
    END LOOP;

    -- Show the problematic invoice items
    RAISE NOTICE 'Problematic invoice items:';
    FOR r IN (
        SELECT 
            ii.id as item_id,
            i.id as invoice_id,
            i.patient_id,
            ii.quantity,
            ii.unit_price,
            ii.total_amount,
            ii.days,
            i.status
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE ii.therapy_type_id IS NULL
        ORDER BY i.created_at DESC
    )
    LOOP
        RAISE NOTICE 'Invoice Item: % (Invoice: %, Patient: %, Qty: %, Days: %, Price: %, Total: %, Status: %)',
            r.item_id, r.invoice_id, r.patient_id, r.quantity, r.days, r.unit_price, r.total_amount, r.status;
    END LOOP;
END $$;
