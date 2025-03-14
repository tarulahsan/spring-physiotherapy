-- Enable RLS
ALTER TABLE daily_therapy_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON daily_therapy_records
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON daily_therapy_records
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create daily_therapy_records table
CREATE TABLE IF NOT EXISTS daily_therapy_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    therapy_id UUID REFERENCES therapy_types(id) NOT NULL,
    therapy_date DATE NOT NULL,
    therapy_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, therapy_id, therapy_date)
);

-- Add foreign key indexes
CREATE INDEX IF NOT EXISTS idx_daily_therapy_records_patient_id ON daily_therapy_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_daily_therapy_records_therapy_id ON daily_therapy_records(therapy_id);

-- Add foreign key relationships
ALTER TABLE daily_therapy_records 
    ADD CONSTRAINT fk_daily_therapy_records_patient 
    FOREIGN KEY (patient_id) 
    REFERENCES patients(id) 
    ON DELETE CASCADE;

ALTER TABLE daily_therapy_records 
    ADD CONSTRAINT fk_daily_therapy_records_therapy 
    FOREIGN KEY (therapy_id) 
    REFERENCES therapy_types(id) 
    ON DELETE CASCADE;

-- Create function to get remaining therapy days
CREATE OR REPLACE FUNCTION get_remaining_therapy_days(
    p_patient_id UUID,
    p_therapy_id UUID,
    p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    used_days INTEGER;
BEGIN
    -- Get total days from invoice_items
    SELECT COALESCE(SUM(days), 0)
    INTO total_days
    FROM invoice_items
    WHERE patient_id = p_patient_id 
    AND therapy_type_id = p_therapy_id;

    -- Get used days from daily_therapy_records
    SELECT COUNT(*)
    INTO used_days
    FROM daily_therapy_records
    WHERE patient_id = p_patient_id 
    AND therapy_id = p_therapy_id
    AND therapy_date <= p_date;

    RETURN total_days - used_days;
END;
$$ LANGUAGE plpgsql;
