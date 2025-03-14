-- Check foreign key relationships
SELECT 
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
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
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('invoice_items', 'daily_therapy_records');

-- Check if any invoice items have invalid therapy_type_ids
SELECT ii.id, ii.therapy_type_id, tt.id as therapy_id, tt.name, tt.status
FROM invoice_items ii
LEFT JOIN therapy_types tt ON tt.id = ii.therapy_type_id
WHERE tt.id IS NULL OR tt.status != 'active';

-- Check if any daily records have invalid therapy_type_ids
SELECT dtr.id, dtr.therapy_type_id, tt.id as therapy_id, tt.name, tt.status
FROM daily_therapy_records dtr
LEFT JOIN therapy_types tt ON tt.id = dtr.therapy_type_id
WHERE tt.id IS NULL OR tt.status != 'active';
