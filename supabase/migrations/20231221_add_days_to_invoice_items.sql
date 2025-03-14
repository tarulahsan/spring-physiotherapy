-- Add days column to invoice_items
ALTER TABLE invoice_items
ADD COLUMN days INTEGER NOT NULL DEFAULT 1;

-- Update the function to calculate invoice totals with days
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_id UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(price * sessions * days), 0)
        FROM invoice_items
        WHERE invoice_id = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Update the function to get patient financial history
CREATE OR REPLACE FUNCTION get_patient_financial_history(p_patient_id UUID)
RETURNS TABLE (
    invoice_id UUID,
    invoice_date TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL,
    paid_amount DECIMAL,
    due_amount DECIMAL,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as invoice_id,
        i.created_at as invoice_date,
        (SELECT calculate_invoice_total(i.id)) as total_amount,
        i.paid_amount,
        (SELECT calculate_invoice_total(i.id)) - i.paid_amount as due_amount,
        i.status
    FROM invoices i
    WHERE i.patient_id = p_patient_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the function to get therapy history
CREATE OR REPLACE FUNCTION get_patient_therapy_history(p_patient_id UUID)
RETURNS TABLE (
    therapy_name TEXT,
    total_sessions INTEGER,
    total_days INTEGER,
    total_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.name as therapy_name,
        SUM(ii.sessions) as total_sessions,
        SUM(ii.days) as total_days,
        SUM(ii.price * ii.sessions * ii.days) as total_amount
    FROM invoices i
    JOIN invoice_items ii ON i.id = ii.invoice_id
    JOIN therapy_types tt ON ii.therapy_type_id = tt.id
    WHERE i.patient_id = p_patient_id
    GROUP BY tt.name;
END;
$$ LANGUAGE plpgsql;
