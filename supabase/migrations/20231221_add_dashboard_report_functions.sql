-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
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
        (SELECT COUNT(DISTINCT p.id) FROM patients p) as total_patients,
        (SELECT COUNT(*) FROM invoices i WHERE i.created_at BETWEEN start_date AND end_date) as total_invoices,
        COALESCE((SELECT SUM(total_amount) FROM invoices i WHERE i.created_at BETWEEN start_date AND end_date), 0) as total_revenue,
        COALESCE((SELECT SUM(total_amount - paid_amount) FROM invoices i WHERE i.created_at BETWEEN start_date AND end_date), 0) as total_due,
        (SELECT COUNT(*) FROM patients p WHERE p.created_at BETWEEN start_date AND end_date) as new_patients_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top therapies
CREATE OR REPLACE FUNCTION get_top_therapies(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    limit_count INTEGER DEFAULT 5
)
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
    WHERE i.created_at BETWEEN start_date AND end_date
    GROUP BY tt.name
    ORDER BY total_revenue DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue trend
CREATE OR REPLACE FUNCTION get_monthly_revenue_trend(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '12 months',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    month DATE,
    revenue DECIMAL,
    due_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE months AS (
        SELECT 
            DATE_TRUNC('month', end_date) as month
        UNION ALL
        SELECT 
            DATE_TRUNC('month', month - INTERVAL '1 month')
        FROM months
        WHERE DATE_TRUNC('month', month - INTERVAL '1 month') >= DATE_TRUNC('month', start_date)
    )
    SELECT 
        m.month::DATE,
        COALESCE(SUM(i.total_amount), 0) as revenue,
        COALESCE(SUM(i.total_amount - i.paid_amount), 0) as due_amount
    FROM months m
    LEFT JOIN invoices i ON DATE_TRUNC('month', i.created_at) = m.month
    GROUP BY m.month
    ORDER BY m.month;
END;
$$ LANGUAGE plpgsql;

-- Function to get therapy type distribution
CREATE OR REPLACE FUNCTION get_therapy_distribution(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    therapy_name TEXT,
    session_count BIGINT,
    percentage DECIMAL
) AS $$
DECLARE
    total_sessions BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_sessions
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.created_at BETWEEN start_date AND end_date;

    RETURN QUERY
    SELECT 
        tt.name,
        COUNT(*) as session_count,
        ROUND((COUNT(*)::DECIMAL / NULLIF(total_sessions, 0) * 100), 2) as percentage
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    JOIN therapy_types tt ON tt.id = ii.therapy_type_id
    WHERE i.created_at BETWEEN start_date AND end_date
    GROUP BY tt.name
    ORDER BY session_count DESC;
END;
$$ LANGUAGE plpgsql;
