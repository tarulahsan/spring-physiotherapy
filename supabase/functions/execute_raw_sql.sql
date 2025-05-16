-- This function allows executing raw SQL queries for debugging purposes
-- IMPORTANT: This should only be used in development environments!
CREATE OR REPLACE FUNCTION execute_raw_sql(sql_query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the function creator
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the provided SQL query and capture the results as JSON
  EXECUTE 'SELECT to_jsonb(array_agg(row_to_json(t)))
          FROM (' || sql_query || ') t'
  INTO result;
  
  RETURN result;
END;
$$;
