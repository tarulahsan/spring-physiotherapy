-- Create business_settings table if it doesn't exist
BEGIN;
DROP TABLE IF EXISTS business_settings CASCADE;

CREATE TABLE business_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'BDT',
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    invoice_starting_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated read business_settings" ON "public"."business_settings";
DROP POLICY IF EXISTS "Allow authenticated insert business_settings" ON "public"."business_settings";
DROP POLICY IF EXISTS "Allow authenticated update business_settings" ON "public"."business_settings";
DROP POLICY IF EXISTS "Allow authenticated delete business_settings" ON "public"."business_settings";

-- Create RLS policies for business_settings
CREATE POLICY "Allow authenticated read business_settings"
ON "public"."business_settings"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert business_settings"
ON "public"."business_settings"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update business_settings"
ON "public"."business_settings"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete business_settings"
ON "public"."business_settings"
FOR DELETE
TO authenticated
USING (true);

-- Insert default business settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM business_settings) THEN
        INSERT INTO business_settings (
            business_name,
            address,
            phone,
            email,
            currency,
            timezone,
            invoice_prefix,
            invoice_starting_number
        ) VALUES (
            'Spring Physiotherapy',
            'Dhaka, Bangladesh',
            '+880123456789',
            'info@springphysiotherapy.com',
            'BDT',
            'Asia/Dhaka',
            'INV',
            1
        );
    END IF;
END $$;
COMMIT;
