-- Fix relationships in tables
BEGIN;

-- First drop the problematic self-referencing constraint in discount_givers
ALTER TABLE discount_givers DROP CONSTRAINT IF EXISTS fk_discount_giver_id;

-- Recreate invoices table with proper relationships
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID,
    discount_giver_id UUID,
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
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    FOREIGN KEY (discount_giver_id) REFERENCES discount_givers(id) ON DELETE SET NULL
);

-- Recreate invoice_items table
CREATE TABLE invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    therapy_session_id UUID,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (therapy_session_id) REFERENCES therapy_sessions(id) ON DELETE SET NULL
);

-- Enable RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON invoices FOR DELETE TO authenticated USING (true);

-- Enable RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON invoice_items FOR DELETE TO authenticated USING (true);

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
