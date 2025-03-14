-- Add missing columns and fix schema issues
BEGIN;

-- Add date_of_birth to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Fix missing patient_id column and trigger
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS patient_id VARCHAR(20) UNIQUE;

-- Create trigger for patient_id generation
DROP TRIGGER IF EXISTS set_patient_id ON patients;
CREATE TRIGGER set_patient_id
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION generate_patient_id();

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON patients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add status column to doctors table if not exists
ALTER TABLE doctors DROP COLUMN IF EXISTS is_active;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Insert default business settings if not exists
INSERT INTO business_settings (
    business_name,
    address,
    phone,
    email,
    currency,
    timezone,
    invoice_prefix
)
SELECT
    'Spring Physiotherapy',
    'Your Address Here',
    'Your Phone',
    'your.email@example.com',
    'BDT',
    'Asia/Dhaka',
    'INV'
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- Add missing RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON business_settings;
CREATE POLICY "Enable read access for authenticated users"
    ON business_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON business_settings;
CREATE POLICY "Enable insert for authenticated users"
    ON business_settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON business_settings;
CREATE POLICY "Enable update for authenticated users"
    ON business_settings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;
