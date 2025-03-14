-- Fix business settings table
BEGIN;

-- Drop existing table and related objects
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create business settings table
CREATE TABLE business_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL DEFAULT 'Spring Physiotherapy',
    address TEXT DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    website VARCHAR(100) DEFAULT '',
    tax_id VARCHAR(50) DEFAULT '',
    logo_url TEXT DEFAULT '',
    currency VARCHAR(10) DEFAULT 'BDT',
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_starting_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger
CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" 
    ON business_settings 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Insert default settings
INSERT INTO business_settings (
    business_name,
    address,
    phone,
    email,
    website,
    tax_id,
    logo_url,
    currency,
    timezone,
    invoice_prefix,
    invoice_starting_number
) VALUES (
    'Spring Physiotherapy',
    '',
    '',
    '',
    '',
    '',
    '',
    'BDT',
    'Asia/Dhaka',
    'INV',
    1
);

COMMIT;
