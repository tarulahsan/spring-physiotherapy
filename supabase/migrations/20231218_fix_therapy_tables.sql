-- Drop existing tables if they exist
-- DROP TABLE IF EXISTS therapy_sessions;
-- DROP TABLE IF EXISTS therapy_types;

-- Create therapy_types table (renamed from therapies for consistency)
-- CREATE TABLE IF NOT EXISTS therapy_types (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     price DECIMAL(10,2) NOT NULL,
--     duration INTEGER NULL, -- made duration optional
--     status VARCHAR(50) DEFAULT 'active',
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
-- );

-- Update therapy_types table to make duration optional and add status
DO $$ 
BEGIN
    -- Make duration optional
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'therapy_types' 
        AND column_name = 'duration' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE therapy_types ALTER COLUMN duration DROP NOT NULL;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'therapy_types' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE therapy_types ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- Create therapy_sessions table with additional fields
CREATE TABLE IF NOT EXISTS therapy_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapy_id UUID REFERENCES therapy_types(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES doctors(id) ON DELETE RESTRICT,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
    progress_level INTEGER CHECK (progress_level BETWEEN 0 AND 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_therapy_types_status ON therapy_types(status);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient_id ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_therapy_id ON therapy_sessions(therapy_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_id ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status ON therapy_sessions(status);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_session_date ON therapy_sessions(session_date);

-- Enable RLS if not already enabled
ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for therapy_types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_types' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON therapy_types
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_types' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON therapy_types
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_types' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON therapy_types
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_types' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON therapy_types
            FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Create policies for therapy_sessions if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_sessions' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON therapy_sessions
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_sessions' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON therapy_sessions
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_sessions' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON therapy_sessions
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'therapy_sessions' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON therapy_sessions
            FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_therapy_types_updated_at ON therapy_types;
CREATE TRIGGER update_therapy_types_updated_at
    BEFORE UPDATE ON therapy_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_therapy_sessions_updated_at ON therapy_sessions;
CREATE TRIGGER update_therapy_sessions_updated_at
    BEFORE UPDATE ON therapy_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
