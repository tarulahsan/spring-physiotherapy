# Execute Raw SQL Function

Please execute the following SQL in your Supabase SQL Editor to create the `execute_raw_sql` function:

```sql
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
```

This function will let us bypass any potential abstractions and directly debug the database operation.
