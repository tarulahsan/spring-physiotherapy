-- Enable RLS on all tables
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_givers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_therapies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON business_settings;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON business_settings;

-- Create a single unified policy for business_settings
CREATE POLICY "Enable full access for authenticated users" ON business_settings
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for doctors
CREATE POLICY "Enable read access for authenticated users" ON doctors
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON doctors
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for patients
CREATE POLICY "Enable read access for authenticated users" ON patients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON patients
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for therapy_sessions
CREATE POLICY "Enable read access for authenticated users" ON therapy_sessions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON therapy_sessions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for therapies
CREATE POLICY "Enable read access for authenticated users" ON therapies
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON therapies
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for invoices
CREATE POLICY "Enable read access for authenticated users" ON invoices
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON invoices
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for discount_givers
CREATE POLICY "Enable read access for authenticated users" ON discount_givers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON discount_givers
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for invoice_items
CREATE POLICY "Enable read access for authenticated users" ON invoice_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON invoice_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for patient_therapies
CREATE POLICY "Enable read access for authenticated users" ON patient_therapies
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON patient_therapies
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
