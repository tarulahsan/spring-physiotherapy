-- Drop the existing function
DROP FUNCTION IF EXISTS get_top_therapies;

-- Create the updated function with explicit table aliases
CREATE OR REPLACE FUNCTION get_top_therapies(start_date DATE, end_date DATE)
RETURNS TABLE (
    therapy_type_id UUID,
    therapy_name VARCHAR(255),
    session_count BIGINT
)
AS $function$
BEGIN
    RETURN QUERY
    WITH therapy_counts AS (
        SELECT 
            ts.therapy_type_id,
            COUNT(*) as count
        FROM therapy_sessions ts
        WHERE ts.session_date >= start_date 
            AND ts.session_date <= end_date
            AND ts.therapy_type_id IS NOT NULL
        GROUP BY ts.therapy_type_id
    )
    SELECT 
        tc.therapy_type_id,
        tt.name as therapy_name,
        tc.count as session_count
    FROM therapy_counts tc
    LEFT JOIN therapy_types tt ON tc.therapy_type_id = tt.id
    WHERE tc.count > 0
    ORDER BY tc.count DESC
    LIMIT 10;
END;
$function$ LANGUAGE plpgsql;
