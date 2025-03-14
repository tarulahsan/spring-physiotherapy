-- Update patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS patient_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS sex VARCHAR(10),
ADD COLUMN IF NOT EXISTS address VARCHAR(300),
ADD COLUMN IF NOT EXISTS selected_therapies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS session_number INTEGER,
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id),
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES doctors(id),
ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Create a function to generate patient_id
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  counter INTEGER;
  new_id TEXT;
BEGIN
  -- Get the current date in YYYY-MM-DD format
  date_part := to_char(NEW.registration_date, 'YYYY-MM-DD');
  
  -- Get the current counter for this date
  SELECT COALESCE(MAX(CAST(SPLIT_PART(patient_id, '-', 4) AS INTEGER)), 0) + 1
  INTO counter
  FROM patients
  WHERE patient_id LIKE date_part || '-%';
  
  -- Generate the new ID
  new_id := date_part || '-' || LPAD(counter::TEXT, 3, '0');
  
  -- Set the patient_id
  NEW.patient_id := new_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient_id generation
DROP TRIGGER IF EXISTS set_patient_id ON patients;
CREATE TRIGGER set_patient_id
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION generate_patient_id();
