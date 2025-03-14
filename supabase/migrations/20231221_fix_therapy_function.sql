-- First, let's check the therapy_types table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'therapy_types';

-- Drop the existing function
DROP FUNCTION IF EXISTS get_top_therapies;

-- Create the function with exact matching types
CREATE OR REPLACE FUNCTION get_top_therapies(start_date DATE, end_date DATE)
RETURNS TABLE (
  therapy_type_id UUID,
  therapy_name TEXT,  -- Changed to TEXT to avoid type mismatch
  session_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH therapy_counts AS (
    SELECT 
      ts.therapy_type_id,
      COUNT(*) as count
    FROM therapy_sessions ts
    WHERE ts.session_date >= start_date 
      AND ts.session_date <= end_date
    GROUP BY ts.therapy_type_id
  )
  SELECT 
    tc.therapy_type_id,
    CAST(tt.name AS TEXT),  -- Explicitly cast to TEXT
    tc.count as session_count
  FROM therapy_counts tc
  JOIN therapy_types tt ON tc.therapy_type_id = tt.id
  ORDER BY tc.count DESC
  LIMIT 10;
END;
$$;
