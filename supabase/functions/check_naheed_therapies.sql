-- This script checks for therapies specifically associated with Naheed Ahsan
-- and checks for Focus Shock Wave Therapy and Magneto Therapy

-- First, get Naheed's patient ID
WITH naheed_patient AS (
  SELECT id 
  FROM patients 
  WHERE name ILIKE '%Naheed Ahsan%' 
  LIMIT 1
)

-- Check all of Naheed's therapy records
SELECT 
  dtr.id,
  dtr.therapy_date,
  dtr.therapy_time,
  dtr.therapy_type_id,
  tt.id AS therapy_type_id_from_join,
  tt.name AS therapy_name,
  p.name AS patient_name
FROM 
  daily_therapy_records dtr
JOIN 
  patients p ON dtr.patient_id = p.id 
LEFT JOIN 
  therapy_types tt ON dtr.therapy_type_id = tt.id
WHERE 
  dtr.patient_id = (SELECT id FROM naheed_patient)
ORDER BY 
  dtr.therapy_date DESC;

-- Check if these specific therapies exist in the therapy_types table
SELECT 
  id, 
  name, 
  description, 
  price
FROM 
  therapy_types
WHERE 
  name ILIKE '%Focus Shock Wave%' OR 
  name ILIKE '%Erectile%' OR 
  name ILIKE '%Magneto Therapy%';

-- Check for any foreign key constraints/relationships between tables
SELECT
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
JOIN
  information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN
  information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE
  tc.table_name = 'daily_therapy_records' AND
  tc.constraint_type = 'FOREIGN KEY';
