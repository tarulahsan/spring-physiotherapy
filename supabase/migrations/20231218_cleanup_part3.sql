-- Part 3: Create patient_therapies junction table

-- Drop existing table if it exists
DROP TABLE IF EXISTS patient_therapies CASCADE;

-- Create patient_therapies junction table
CREATE TABLE patient_therapies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapy_id UUID REFERENCES therapies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, therapy_id)
);

-- Enable RLS
ALTER TABLE patient_therapies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON patient_therapies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON patient_therapies
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON patient_therapies
    FOR DELETE TO authenticated USING (true);
