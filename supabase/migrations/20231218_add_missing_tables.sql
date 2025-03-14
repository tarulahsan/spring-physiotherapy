-- Create discount_givers table if it doesn't exist
DROP TABLE IF EXISTS discount_givers CASCADE;
CREATE TABLE IF NOT EXISTS discount_givers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discount_giver_id FOREIGN KEY (id) REFERENCES discount_givers(id) ON DELETE CASCADE
);

-- Enable RLS for discount_givers
ALTER TABLE discount_givers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON discount_givers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON discount_givers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON discount_givers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON discount_givers FOR DELETE TO authenticated USING (true);

-- Create therapy_sessions table if it doesn't exist
DROP TABLE IF EXISTS therapy_sessions CASCADE;
CREATE TABLE IF NOT EXISTS therapy_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapy_id UUID REFERENCES therapies(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_therapy FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Enable RLS for therapy_sessions
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON therapy_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON therapy_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON therapy_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON therapy_sessions FOR DELETE TO authenticated USING (true);

-- Create invoices table if it doesn't exist
DROP TABLE IF EXISTS invoices CASCADE;
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    discount_giver_id UUID REFERENCES discount_givers(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    due_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_invoice FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_invoice FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    CONSTRAINT fk_discount_giver_invoice FOREIGN KEY (discount_giver_id) REFERENCES discount_givers(id) ON DELETE SET NULL
);

-- Enable RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON invoices FOR DELETE TO authenticated USING (true);

-- Create invoice_items table if it doesn't exist
DROP TABLE IF EXISTS invoice_items CASCADE;
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    therapy_id UUID REFERENCES therapies(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_therapy_item FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE SET NULL
);

-- Enable RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON invoice_items FOR DELETE TO authenticated USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_discount_givers_updated_at
    BEFORE UPDATE ON discount_givers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
    BEFORE UPDATE ON therapy_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add doctor_id to patients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'doctor_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
    END IF;
END $$;
