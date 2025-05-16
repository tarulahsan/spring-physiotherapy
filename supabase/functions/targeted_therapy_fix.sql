-- TARGETED THERAPY NAME FIX SCRIPT
-- This script safely identifies and optionally updates only the specific therapy records
-- that need fixing, without disrupting other database relationships

-- PART 1: ANALYSIS - Identifies specific records to fix
-- First, look for Naheed's records to see what therapies are stored and displayed
WITH naheed_patient AS (
  SELECT id 
  FROM patients 
  WHERE name ILIKE '%Naheed Ahsan%' 
  LIMIT 1
)

SELECT 
  dtr.id AS record_id,
  dtr.therapy_date,
  dtr.therapy_time,
  dtr.therapy_type_id,
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

-- Check if the specific therapies exist in the therapy_types table
SELECT 
  id AS therapy_id, 
  name AS therapy_name,
  price
FROM 
  therapy_types
WHERE 
  name ILIKE '%Focus Shock Wave%' OR 
  name ILIKE '%Erectile%' OR 
  name ILIKE '%Magneto Therapy%';

-- PART 2: Specific therapy types for reference (to find ID mismatches)
-- List all therapy types to find potential matches or duplicates
SELECT 
  id, 
  name
FROM 
  therapy_types
ORDER BY 
  name;

-- PART 3: FIX (only run after reviewing PART 1 & 2 results)
-- ⚠️ READ CAREFULLY BEFORE RUNNING ⚠️
-- These UPDATE statements only affect specific records for Naheed Ahsan
-- DO NOT RUN THIS SECTION without first checking the IDs from PART 1 & 2
-- Uncomment ONLY after confirming the IDs, dates, and target therapy types

/*
-- Identify the target variables first (from your PART 1 & 2 analysis)
DO $$
DECLARE
  naheed_id UUID;                                      -- Patient ID 
  focus_therapy_id UUID;                               -- Focus Shock Wave therapy ID
  magneto_therapy_id UUID;                             -- Magneto Therapy ID
  focus_record_id UUID;                                -- Record ID needing Focus therapy
  magneto_record_id UUID;                              -- Record ID needing Magneto therapy
BEGIN
  -- Set the IDs based on your analysis results above
  -- REPLACE THESE VALUES with the actual IDs from your database
  naheed_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';              -- REPLACE with Naheed's ID
  focus_therapy_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';       -- REPLACE with Focus Therapy ID 
  magneto_therapy_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';     -- REPLACE with Magneto Therapy ID
  focus_record_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';        -- REPLACE with record ID that should have Focus therapy
  magneto_record_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';      -- REPLACE with record ID that should have Magneto therapy
  
  -- First, verify the patient ID is correct
  IF (SELECT COUNT(*) FROM patients WHERE id = naheed_id AND name ILIKE '%Naheed%') = 0 THEN
    RAISE EXCEPTION 'Patient ID does not match Naheed Ahsan';
  END IF;
  
  -- Verify therapy IDs exist
  IF (SELECT COUNT(*) FROM therapy_types WHERE id = focus_therapy_id) = 0 THEN
    RAISE EXCEPTION 'Focus therapy ID not found';
  END IF;
  
  IF (SELECT COUNT(*) FROM therapy_types WHERE id = magneto_therapy_id) = 0 THEN
    RAISE EXCEPTION 'Magneto therapy ID not found';
  END IF;
  
  -- Verify record IDs exist and belong to Naheed
  IF (SELECT COUNT(*) FROM daily_therapy_records WHERE id = focus_record_id AND patient_id = naheed_id) = 0 THEN
    RAISE EXCEPTION 'Focus record ID not found or does not belong to Naheed';
  END IF;
  
  IF (SELECT COUNT(*) FROM daily_therapy_records WHERE id = magneto_record_id AND patient_id = naheed_id) = 0 THEN
    RAISE EXCEPTION 'Magneto record ID not found or does not belong to Naheed';
  END IF;
  
  -- All checks passed, now update the records
  UPDATE daily_therapy_records 
  SET therapy_type_id = focus_therapy_id
  WHERE id = focus_record_id;
  
  UPDATE daily_therapy_records 
  SET therapy_type_id = magneto_therapy_id
  WHERE id = magneto_record_id;
  
  -- Output confirmation
  RAISE NOTICE 'Updates completed successfully';
END
$$;

-- Verify the changes worked by re-running the first query from PART 1
*/
