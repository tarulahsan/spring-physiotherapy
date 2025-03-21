-- First add registration_date with a default value
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;

-- Add diagnosis column
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS diagnosis TEXT;

-- Add remarks column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_name = 'patients' 
                   AND column_name = 'remarks') THEN
        ALTER TABLE patients ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Now make registration_date mandatory
ALTER TABLE patients
ALTER COLUMN registration_date SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN patients.diagnosis IS 'Optional field for patient diagnosis';
COMMENT ON COLUMN patients.remarks IS 'Optional field for additional notes';
COMMENT ON COLUMN patients.registration_date IS 'Mandatory field for patient registration date';
