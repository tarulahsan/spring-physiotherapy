-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    total_patients BIGINT,
    total_invoices BIGINT,
    total_revenue DECIMAL,
    total_due DECIMAL,
    new_patients_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT id) FROM patients) as total_patients,
        (SELECT COUNT(*) FROM invoices WHERE created_at >= NOW() - INTERVAL '30 days') as total_invoices,
        COALESCE((
            SELECT SUM(calculate_invoice_total(id))
            FROM invoices 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        ), 0) as total_revenue,
        COALESCE((
            SELECT SUM(calculate_invoice_total(id) - paid_amount)
            FROM invoices 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        ), 0) as total_due,
        (SELECT COUNT(*) FROM patients WHERE created_at >= NOW() - INTERVAL '30 days') as new_patients_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top therapies
CREATE OR REPLACE FUNCTION get_top_therapies()
RETURNS TABLE (
    therapy_name TEXT,
    total_sessions BIGINT,
    total_days BIGINT,
    total_revenue DECIMAL,
    unique_patients BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.name,
        COUNT(ii.id) as total_sessions,
        SUM(ii.days) as total_days,
        SUM(ii.price * ii.sessions * ii.days) as total_revenue,
        COUNT(DISTINCT i.patient_id) as unique_patients
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    JOIN therapy_types tt ON tt.id = ii.therapy_type_id
    WHERE i.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY tt.name
    ORDER BY total_revenue DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue trend
CREATE OR REPLACE FUNCTION get_monthly_revenue_trend()
RETURNS TABLE (
    month DATE,
    revenue DECIMAL,
    due_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE months AS (
        SELECT DATE_TRUNC('month', NOW()) as month
        UNION ALL
        SELECT DATE_TRUNC('month', month - INTERVAL '1 month')
        FROM months
        WHERE DATE_TRUNC('month', month - INTERVAL '1 month') >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
    ),
    monthly_totals AS (
        SELECT 
            DATE_TRUNC('month', i.created_at) as month,
            SUM(calculate_invoice_total(i.id)) as total_revenue,
            SUM(calculate_invoice_total(i.id) - i.paid_amount) as total_due
        FROM invoices i
        WHERE i.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', i.created_at)
    )
    SELECT 
        m.month::DATE,
        COALESCE(mt.total_revenue, 0) as revenue,
        COALESCE(mt.total_due, 0) as due_amount
    FROM months m
    LEFT JOIN monthly_totals mt ON m.month = mt.month
    ORDER BY m.month;
END;
$$ LANGUAGE plpgsql;
