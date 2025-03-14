-- First, let's see what data we have
DO $$ 
DECLARE 
    item_count INTEGER;
    session_count INTEGER;
    therapy_count INTEGER;
    item RECORD;
BEGIN
    -- Check invoice_items
    SELECT COUNT(*) INTO item_count FROM invoice_items;
    RAISE NOTICE 'Invoice items count: %', item_count;
    
    -- Check therapy_sessions
    SELECT COUNT(*) INTO session_count FROM therapy_sessions;
    RAISE NOTICE 'Therapy sessions count: %', session_count;
    
    -- Check therapy_types
    SELECT COUNT(*) INTO therapy_count FROM therapy_types;
    RAISE NOTICE 'Therapy types count: %', therapy_count;
    
    -- Show invoice items without therapy type
    FOR item IN
        SELECT 
            ii.id as item_id,
            ii.invoice_id,
            ii.therapy_type_id,
            ii.therapy_session_id,
            i.patient_id,
            i.invoice_date
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE ii.therapy_type_id IS NULL
    LOOP
        RAISE NOTICE 'Item ID: %, Invoice: %, Session: %, Patient: %, Date: %',
            item.item_id, item.invoice_id, item.therapy_session_id, item.patient_id, item.invoice_date;
    END LOOP;
END $$;

-- Now let's fix the data
DO $$ 
DECLARE
    item RECORD;
BEGIN
    -- First try to get therapy_type_id from therapy_sessions
    UPDATE invoice_items ii
    SET therapy_type_id = ts.therapy_type_id
    FROM therapy_sessions ts
    WHERE ii.therapy_session_id = ts.id
    AND ii.therapy_type_id IS NULL;

    -- For any remaining items without therapy_type_id, try to find matching therapy type
    WITH invoice_therapy_mapping AS (
        SELECT DISTINCT ON (ii.id)
            ii.id as item_id,
            tt.id as therapy_id
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        CROSS JOIN therapy_types tt
        WHERE ii.therapy_type_id IS NULL
        ORDER BY ii.id, tt.created_at ASC
    )
    UPDATE invoice_items ii
    SET therapy_type_id = itm.therapy_id
    FROM invoice_therapy_mapping itm
    WHERE ii.id = itm.item_id
    AND ii.therapy_type_id IS NULL;

    -- Show remaining items without therapy type
    FOR item IN
        SELECT 
            ii.id as item_id,
            ii.invoice_id,
            ii.therapy_type_id,
            ii.therapy_session_id,
            i.patient_id,
            i.invoice_date
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE ii.therapy_type_id IS NULL
    LOOP
        RAISE NOTICE 'Item ID: %, Invoice: %, Session: %, Patient: %, Date: %',
            item.item_id, item.invoice_id, item.therapy_session_id, item.patient_id, item.invoice_date;
    END LOOP;
END $$;
