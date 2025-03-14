-- Check invoice_items table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Check foreign key relationships
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='invoice_items';

-- Check sample data
SELECT 
    ii.id,
    ii.invoice_id,
    ii.therapy_type_id,
    tt.name as therapy_name,
    i.patient_id,
    ii.quantity,
    ii.days,
    ii.unit_price,
    ii.total_amount,
    i.status
FROM invoice_items ii
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
JOIN invoices i ON i.id = ii.invoice_id
ORDER BY i.created_at DESC
LIMIT 10;
