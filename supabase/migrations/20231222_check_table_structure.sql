-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_therapy_records'
ORDER BY ordinal_position;

-- Check a sample of records
SELECT *
FROM daily_therapy_records
LIMIT 5;
