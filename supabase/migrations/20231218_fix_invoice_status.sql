-- Fix invoice status field
BEGIN;

-- First check if we need to preserve any existing data
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- Update status from payment_status if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_status'
    ) THEN
        UPDATE invoices 
        SET status = payment_status 
        WHERE status IS NULL;
        
        ALTER TABLE invoices 
        DROP COLUMN IF EXISTS payment_status;
    END IF;
END $$;

-- Set default value for status
UPDATE invoices 
SET status = 'UNPAID' 
WHERE status IS NULL;

-- Now modify the column to add NOT NULL constraint and default
ALTER TABLE invoices 
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'UNPAID';

COMMIT;
