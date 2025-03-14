-- First, ensure we have the required columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_id TEXT;

-- Create a sequence for patient numbering
CREATE SEQUENCE IF NOT EXISTS patient_number_seq;

-- Function to generate patient ID in YYYY-MM-DD-N format
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
    formatted_date TEXT;
    daily_number INTEGER;
BEGIN
    -- Get today's date in YYYY-MM-DD format
    formatted_date := to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD');
    
    -- Get the next number for today
    SELECT COALESCE(MAX(CAST(SPLIT_PART(patient_id, '-', 4) AS INTEGER)), 0) + 1
    INTO daily_number
    FROM patients
    WHERE patient_id LIKE formatted_date || '-%';
    
    -- Set the new patient_id
    NEW.patient_id := formatted_date || '-' || LPAD(daily_number::TEXT, 3, '0');
    
    -- Ensure created_at is set
    IF NEW.created_at IS NULL THEN
        NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_patient_id ON patients;

-- Create trigger for new patient IDs
CREATE TRIGGER set_patient_id
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION generate_patient_id();

-- Update existing patients with new format IDs
DO $$
DECLARE
    r RECORD;
    new_id TEXT;
    counter INTEGER;
    formatted_date TEXT;
    last_date TEXT := '';
BEGIN
    -- First ensure all patients have created_at
    UPDATE patients 
    SET created_at = CURRENT_TIMESTAMP 
    WHERE created_at IS NULL;

    -- Then update patient_ids
    FOR r IN (
        SELECT id, created_at
        FROM patients
        ORDER BY created_at
    )
    LOOP
        formatted_date := to_char(r.created_at AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD');
        
        IF formatted_date = last_date THEN
            counter := counter + 1;
        ELSE
            counter := 1;
            last_date := formatted_date;
        END IF;
        
        new_id := formatted_date || '-' || LPAD(counter::TEXT, 3, '0');
        
        UPDATE patients 
        SET patient_id = new_id
        WHERE id = r.id;
    END LOOP;
END $$;
