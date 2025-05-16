-- Comprehensive analysis of therapy data in the database

-- 1. First, let's examine the structure of the therapy_types table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'therapy_types'
ORDER BY 
  ordinal_position;

-- 2. Check the structure of daily_therapy_records table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'daily_therapy_records'
ORDER BY 
  ordinal_position;

-- 3. Check if there are multiple foreign key constraints between daily_therapy_records and therapy_types
SELECT
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
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'daily_therapy_records'
  AND ccu.table_name = 'therapy_types';

-- 4. Look for Naheed Ahsan's patient record
SELECT 
  id, 
  name, 
  patient_id
FROM 
  patients
WHERE 
  name ILIKE '%Naheed Ahsan%';

-- 5. Look at Naheed Ahsan's therapy records specifically
WITH naheed_patient AS (
  SELECT 
    id 
  FROM 
    patients 
  WHERE 
    name ILIKE '%Naheed Ahsan%'
  LIMIT 1
)
SELECT 
  dtr.*,
  tt.name AS therapy_name,
  tt.id AS therapy_type_direct_id
FROM 
  daily_therapy_records dtr
LEFT JOIN 
  therapy_types tt ON dtr.therapy_type_id = tt.id
WHERE 
  dtr.patient_id IN (SELECT id FROM naheed_patient);

-- 6. Check if there's a different therapy_types table or view being used
SELECT 
  table_name
FROM 
  information_schema.tables
WHERE 
  table_name LIKE '%therapy%'
  AND table_schema = 'public';

-- 7. Check if there are any therapy types with the mentioned names
SELECT 
  * 
FROM 
  therapy_types
WHERE 
  name ILIKE '%Focus Shock Wave%'
  OR name ILIKE '%Magneto Therapy%';

-- 8. Check if therapy records might be stored in a different location or have a different structure
-- This is a general purpose query to find columns that might contain the therapy info
SELECT
  t.table_schema,
  t.table_name,
  c.column_name
FROM
  information_schema.tables t
JOIN
  information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE
  t.table_schema = 'public'
  AND (
    c.column_name ILIKE '%therapy%'
    OR c.column_name ILIKE '%treatment%'
  );
