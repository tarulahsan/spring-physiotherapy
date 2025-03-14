-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_top_therapies;

-- Create function to get top therapies with correct types
CREATE OR REPLACE FUNCTION get_top_therapies(start_date DATE, end_date DATE)
RETURNS TABLE (
  therapy_type_id UUID,
  therapy_name VARCHAR(255), -- Changed from TEXT to VARCHAR(255) to match the therapy_types table
  session_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.therapy_type_id,
    tt.name as therapy_name,
    COUNT(*) as session_count
  FROM therapy_sessions ts
  JOIN therapy_types tt ON ts.therapy_type_id = tt.id
  WHERE ts.session_date >= start_date 
    AND ts.session_date <= end_date
  GROUP BY ts.therapy_type_id, tt.name
  ORDER BY session_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
