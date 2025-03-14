-- First, drop existing constraints
DO $$ 
BEGIN
    -- Drop unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_patient_therapy'
    ) THEN
        ALTER TABLE patient_therapies DROP CONSTRAINT unique_patient_therapy;
    END IF;
END $$;

-- First, rename existing tables to _old
ALTER TABLE IF EXISTS therapy_sessions RENAME TO therapy_sessions_old;
ALTER TABLE IF EXISTS invoice_items RENAME TO invoice_items_old;
ALTER TABLE IF EXISTS patient_therapies RENAME TO patient_therapies_old;
ALTER TABLE IF EXISTS therapies RENAME TO therapies_old;

-- Drop dependent tables if they exist
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS therapy_sessions CASCADE;
DROP TABLE IF EXISTS patient_therapies CASCADE;
DROP TABLE IF EXISTS therapy_types CASCADE;

-- Create therapy_types table
CREATE TABLE therapy_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Copy data from therapies to therapy_types
INSERT INTO therapy_types (name, description, price, status, created_at, updated_at)
SELECT 
    name,
    description,
    price,
    CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
    created_at,
    updated_at
FROM therapies_old;

-- Create therapy_sessions table
CREATE TABLE therapy_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapy_type_id UUID REFERENCES therapy_types(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES doctors(id) ON DELETE RESTRICT,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
    progress_level INTEGER CHECK (progress_level BETWEEN 0 AND 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    discount_giver_id UUID REFERENCES discount_givers(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    due_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    therapy_session_id UUID REFERENCES therapy_sessions(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create patient_therapies table
CREATE TABLE patient_therapies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    therapy_type_id UUID NOT NULL REFERENCES therapy_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create temporary table to store therapy mappings
CREATE TEMP TABLE therapy_mapping AS
SELECT t_old.id as old_id, t_new.id as new_id
FROM therapies_old t_old
JOIN therapy_types t_new ON t_old.name = t_new.name;

-- Migrate data from old tables to new tables
DO $$ 
BEGIN
    -- Migrate therapy sessions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'therapy_sessions_old') THEN
        INSERT INTO therapy_sessions (
            patient_id, therapy_type_id, doctor_id, session_date, 
            status, pain_level, progress_level, notes, 
            created_at, updated_at
        )
        SELECT 
            ts.patient_id,
            tm.new_id,
            ts.doctor_id,
            ts.session_date,
            ts.status,
            NULL as pain_level,
            NULL as progress_level,
            ts.notes,
            ts.created_at,
            ts.updated_at
        FROM therapy_sessions_old ts
        JOIN therapy_mapping tm ON ts.therapy_id = tm.old_id;
    END IF;

    -- Migrate invoice items - now linking to therapy_sessions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items_old') THEN
        INSERT INTO invoice_items (
            invoice_id, therapy_session_id, quantity, unit_price,
            discount_amount, total_amount, created_at, updated_at
        )
        SELECT 
            ii.invoice_id,
            ii.therapy_session_id,
            COALESCE(ii.quantity, 1),
            ii.unit_price,
            COALESCE(ii.discount_amount, 0),
            ii.total_amount,
            ii.created_at,
            ii.updated_at
        FROM invoice_items_old ii;
    END IF;

    -- Migrate patient therapies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'patient_therapies_old') THEN
        INSERT INTO patient_therapies (
            patient_id, therapy_type_id, created_at, updated_at
        )
        SELECT 
            pt.patient_id,
            tm.new_id,
            pt.created_at,
            pt.updated_at
        FROM patient_therapies_old pt
        JOIN therapy_mapping tm ON pt.therapy_id = tm.old_id;
    END IF;
END $$;

-- Add unique constraint after data migration
ALTER TABLE patient_therapies 
ADD CONSTRAINT unique_patient_therapy UNIQUE (patient_id, therapy_type_id);

-- Drop temporary tables and old tables
DROP TABLE IF EXISTS therapy_mapping;
DROP TABLE IF EXISTS therapy_sessions_old CASCADE;
DROP TABLE IF EXISTS invoice_items_old CASCADE;
DROP TABLE IF EXISTS patient_therapies_old CASCADE;
DROP TABLE IF EXISTS therapies_old CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_therapy_types_status ON therapy_types(status);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_therapy_type_id ON therapy_sessions(therapy_type_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient_id ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_id ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_therapy_session_id ON invoice_items(therapy_session_id);
CREATE INDEX IF NOT EXISTS idx_patient_therapies_therapy_type_id ON patient_therapies(therapy_type_id);

-- Enable RLS
ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_therapies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for therapy_types
CREATE POLICY "Enable read access for authenticated users" ON therapy_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON therapy_types
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON therapy_types
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON therapy_types
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for therapy_sessions
CREATE POLICY "Enable read access for authenticated users" ON therapy_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON therapy_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON therapy_sessions
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON therapy_sessions
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for invoice_items
CREATE POLICY "Enable read access for authenticated users" ON invoice_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON invoice_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON invoice_items
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON invoice_items
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for patient_therapies
CREATE POLICY "Enable read access for authenticated users" ON patient_therapies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON patient_therapies
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON patient_therapies
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON patient_therapies
    FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_therapy_types_updated_at
    BEFORE UPDATE ON therapy_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
    BEFORE UPDATE ON therapy_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_therapies_updated_at
    BEFORE UPDATE ON patient_therapies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
