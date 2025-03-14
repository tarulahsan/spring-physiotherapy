-- Add referrer_id and discount_giver_id to patients table if they don't exist
DO $$ 
BEGIN
    -- Add discount_giver_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'patients' AND column_name = 'discount_giver_id') THEN
        ALTER TABLE patients 
        ADD COLUMN discount_giver_id UUID REFERENCES discount_givers(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_patients_discount_giver_id ON patients(discount_giver_id);
    END IF;

    -- Add referrer_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'patients' AND column_name = 'referrer_id') THEN
        ALTER TABLE patients 
        ADD COLUMN referrer_id UUID REFERENCES referrers(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_patients_referrer_id ON patients(referrer_id);
    END IF;
END $$;
