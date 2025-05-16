-- Comprehensive therapy relationship analysis
-- This script safely analyzes therapy data across the system without making any changes

-- 1. Check how many patients have therapy records with missing/unknown therapy types
WITH therapy_issues AS (
  SELECT 
    dtr.patient_id,
    dtr.therapy_type_id,
    COUNT(*) as record_count,
    MAX(dtr.therapy_date) as latest_therapy_date
  FROM 
    daily_therapy_records dtr
  LEFT JOIN 
    therapy_types tt ON dtr.therapy_type_id = tt.id
  WHERE 
    tt.id IS NULL  -- This identifies records where therapy_type_id doesn't match any therapy type
  GROUP BY 
    dtr.patient_id, dtr.therapy_type_id
)

SELECT 
  p.name as patient_name,
  ti.therapy_type_id,
  ti.record_count,
  ti.latest_therapy_date
FROM 
  therapy_issues ti
JOIN 
  patients p ON ti.patient_id = p.id
ORDER BY 
  ti.record_count DESC, p.name;

-- 2. Check for the specific therapies we're looking for across all patients
WITH focus_therapy_records AS (
  SELECT 
    dtr.id,
    dtr.therapy_date,
    dtr.therapy_time,
    dtr.patient_id,
    dtr.therapy_type_id,
    tt.name as therapy_name
  FROM 
    daily_therapy_records dtr
  JOIN 
    therapy_types tt ON dtr.therapy_type_id = tt.id
  WHERE 
    tt.name ILIKE '%Focus Shock Wave%' OR 
    tt.name ILIKE '%Erectile%' OR 
    tt.name ILIKE '%Magneto%'
)

SELECT 
  ftr.*,
  p.name as patient_name
FROM 
  focus_therapy_records ftr
JOIN 
  patients p ON ftr.patient_id = p.id
ORDER BY 
  ftr.therapy_date DESC;

-- 3. Find all unique therapy types that exist in the therapy_types table
SELECT id, name, description, price
FROM therapy_types
ORDER BY name;

-- 4. Check which therapy types have the most records associated with them
SELECT 
  tt.id,
  tt.name,
  COUNT(dtr.id) as record_count
FROM 
  therapy_types tt
LEFT JOIN 
  daily_therapy_records dtr ON tt.id = dtr.therapy_type_id
GROUP BY 
  tt.id, tt.name
ORDER BY 
  record_count DESC;

-- 5. Check which patients have the most therapy records
SELECT 
  p.id,
  p.name,
  COUNT(dtr.id) as therapy_count
FROM 
  patients p
LEFT JOIN 
  daily_therapy_records dtr ON p.id = dtr.patient_id
GROUP BY 
  p.id, p.name
ORDER BY 
  therapy_count DESC
LIMIT 20;

-- 6. Analyze all foreign key relationships that might be affected
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_type
FROM
  information_schema.table_constraints AS tc
JOIN
  information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN
  information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE
  (tc.table_name = 'daily_therapy_records' OR 
   tc.table_name = 'therapy_types' OR
   ccu.table_name = 'daily_therapy_records' OR
   ccu.table_name = 'therapy_types')
ORDER BY
  tc.table_name, tc.constraint_name;

-- 7. Look for other tables that might reference therapy_types
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM
  information_schema.table_constraints AS tc
JOIN
  information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN
  information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE
  tc.constraint_type = 'FOREIGN KEY' AND
  (ccu.table_name = 'therapy_types')
ORDER BY
  tc.table_name;

-- 8. Find all tables that have columns with "therapy" in their name
SELECT
  table_name,
  column_name,
  data_type
FROM
  information_schema.columns
WHERE
  table_schema = 'public' AND
  column_name ILIKE '%therapy%'
ORDER BY
  table_name, column_name;
