-- Fix settings tables and ensure initial data
BEGIN;

-- Fix doctors table
ALTER TABLE doctors DROP COLUMN IF EXISTS is_active;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Fix discount_givers table
ALTER TABLE discount_givers DROP COLUMN IF EXISTS is_active;
ALTER TABLE discount_givers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Ensure business_settings has the correct structure
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BDT';
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Dhaka';
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV';
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS invoice_starting_number INTEGER DEFAULT 1;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Insert default business settings if not exists
INSERT INTO business_settings (
    business_name,
    address,
    phone,
    email,
    currency,
    timezone,
    invoice_prefix,
    invoice_starting_number
)
SELECT
    'Spring Physiotherapy',
    'Dhaka, Bangladesh',
    '+880123456789',
    'info@springphysiotherapy.com',
    'BDT',
    'Asia/Dhaka',
    'INV',
    1
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- Create storage bucket for logos if not exists
-- Note: This needs to be done through the Supabase dashboard or API

COMMIT;
