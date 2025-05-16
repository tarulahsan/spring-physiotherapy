-- Comprehensive fix for therapy display issues

-- 1. First, identify Naheed Ahsan's records
WITH naheed_records AS (
  SELECT 
    dtr.id,
    dtr.therapy_date,
    dtr.therapy_time,
    dtr.therapy_type_id,
    dtr.patient_id
  FROM 
    daily_therapy_records dtr
  JOIN 
    patients p ON dtr.patient_id = p.id
  WHERE 
    p.name ILIKE '%Naheed Ahsan%'
)

-- 2. Check which therapy types are associated with these records
SELECT 
  nr.id AS record_id,
  nr.therapy_type_id,
  tt.name AS therapy_name
FROM 
  naheed_records nr
LEFT JOIN 
  therapy_types tt ON nr.therapy_type_id = tt.id;

-- 3. Check if the specific therapies exist in the therapy_types table
SELECT * FROM therapy_types 
WHERE name ILIKE '%Focus Shock Wave%' OR name ILIKE '%Erectile%' OR name ILIKE '%Magneto%';

-- 4. Check if there are multiple therapy types with similar names (which could cause confusion)
SELECT * FROM therapy_types
WHERE name ILIKE '%Shock%' OR name ILIKE '%Wave%' OR name ILIKE '%Magneto%';

-- 5. Fix: If the specific therapies don't exist in the therapy_types table, add them
/*
-- Only uncomment and run this if the therapies are missing

-- First check if the specific therapies already exist
DO $$
DECLARE
  focus_exists BOOLEAN;
  magneto_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM therapy_types WHERE name ILIKE '%Focus Shock Wave%') INTO focus_exists;
  SELECT EXISTS(SELECT 1 FROM therapy_types WHERE name ILIKE '%Magneto Therapy Level 1%') INTO magneto_exists;
  
  -- Insert Focus Shock Wave Therapy if it doesn't exist
  IF NOT focus_exists THEN
    INSERT INTO therapy_types (id, name, description, price, created_at, updated_at)
    VALUES 
      (uuid_generate_v4(), 'Focus Shock Wave Therapy For Erectile Dysfunction', 'Specialized shock wave therapy treatment', 5000, NOW(), NOW());
  END IF;
  
  -- Insert Magneto Therapy if it doesn't exist
  IF NOT magneto_exists THEN
    INSERT INTO therapy_types (id, name, description, price, created_at, updated_at)
    VALUES 
      (uuid_generate_v4(), 'Magneto Therapy Level 1', 'Magnetic field therapy treatment', 2500, NOW(), NOW());
  END IF;
END
$$;
*/

-- 6. After adding the therapies (if needed), check if Naheed's records need to be updated to point to the correct therapy_type_id
/*
-- Only uncomment and run this if therapy types exist but the records are not correctly linked

-- First get the IDs of the specific therapies
WITH focus_id AS (
  SELECT id FROM therapy_types WHERE name ILIKE '%Focus Shock Wave%' LIMIT 1
),
magneto_id AS (
  SELECT id FROM therapy_types WHERE name ILIKE '%Magneto Therapy Level 1%' LIMIT 1
),
naheed_id AS (
  SELECT id FROM patients WHERE name ILIKE '%Naheed Ahsan%' LIMIT 1
)

-- Update the records that should have Focus Shock Wave Therapy
UPDATE daily_therapy_records
SET therapy_type_id = (SELECT id FROM focus_id)
WHERE 
  patient_id = (SELECT id FROM naheed_id)
  AND therapy_date = '2025-04-15'  -- Update this to the actual date
  AND id = '12345678-abcd-efgh-ijkl-mnopqrstuvwx';  -- Update this to the actual record ID

-- Update the records that should have Magneto Therapy
UPDATE daily_therapy_records
SET therapy_type_id = (SELECT id FROM magneto_id)
WHERE 
  patient_id = (SELECT id FROM naheed_id)
  AND therapy_date = '2025-04-16'  -- Update this to the actual date
  AND id = '98765432-abcd-efgh-ijkl-mnopqrstuvwx';  -- Update this to the actual record ID
*/
