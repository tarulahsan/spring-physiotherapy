-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_top_therapies;

-- Create the new function with debug logging
CREATE OR REPLACE FUNCTION get_top_therapies(start_date DATE, end_date DATE)
RETURNS TABLE (
    therapy_type_id UUID,
    therapy_name VARCHAR(255),
    session_count BIGINT
)
AS $function$
DECLARE
    debug_count INTEGER;
BEGIN
    -- Debug: Count total therapy sessions
    SELECT COUNT(*) INTO debug_count FROM therapy_sessions;
    RAISE NOTICE 'Total therapy sessions: %', debug_count;
    
    -- Debug: Count therapy sessions in date range
    SELECT COUNT(*) INTO debug_count 
    FROM therapy_sessions 
    WHERE session_date >= start_date AND session_date <= end_date;
    RAISE NOTICE 'Therapy sessions in date range: %', debug_count;
    
    -- Debug: Count therapy sessions with valid therapy_type_id
    SELECT COUNT(*) INTO debug_count 
    FROM therapy_sessions 
    WHERE therapy_type_id IS NOT NULL;
    RAISE NOTICE 'Therapy sessions with valid type: %', debug_count;
    
    -- Debug: Count therapy types
    SELECT COUNT(*) INTO debug_count FROM therapy_types;
    RAISE NOTICE 'Total therapy types: %', debug_count;

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
        COALESCE(tt.name, 'Unknown Therapy') as therapy_name,
        tc.count as session_count
    FROM therapy_counts tc
    LEFT JOIN therapy_types tt ON tc.therapy_type_id = tt.id
    WHERE tc.count > 0
    ORDER BY tc.count DESC
    LIMIT 10;

    -- Debug: Get the result count
    GET DIAGNOSTICS debug_count = ROW_COUNT;
    RAISE NOTICE 'Rows returned: %', debug_count;
END;
$function$ LANGUAGE plpgsql;
