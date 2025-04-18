-- Create manual_invoices table to store only PDF files, not actual invoice data
CREATE TABLE manual_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT,
  invoice_date DATE NOT NULL,
  invoice_number VARCHAR(50) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE manual_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON manual_invoices
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON manual_invoices
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON manual_invoices
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON manual_invoices
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create an index on invoice_date for efficient filtering
CREATE INDEX idx_manual_invoices_date ON manual_invoices(invoice_date);
