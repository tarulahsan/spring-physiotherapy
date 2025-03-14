-- Add foreign key relationships for invoice_items table
ALTER TABLE invoice_items
ADD CONSTRAINT fk_invoice_items_therapy
FOREIGN KEY (therapy_id) REFERENCES therapy_types(id);

-- Add foreign key for invoice relationship if not exists
ALTER TABLE invoice_items
ADD CONSTRAINT fk_invoice_items_invoice
FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_therapy_id ON invoice_items(therapy_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
