-- Drop all versions of the function first to resolve the conflict
DROP FUNCTION IF EXISTS update_therapy_time_raw(bigint, text);
DROP FUNCTION IF EXISTS update_therapy_time_raw(uuid, text);

-- Then recreate only the correct UUID version
CREATE OR REPLACE FUNCTION update_therapy_time_raw(p_record_id uuid, p_time text)
RETURNS json 
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  -- Update the record with properly typed TIME value
  UPDATE daily_therapy_records
  SET 
    therapy_time = p_time::time,
    updated_at = now()
  WHERE id = p_record_id;
  
  -- Return the updated record for verification
  SELECT json_build_object(
    'success', true,
    'record_id', p_record_id,
    'updated_time', p_time
  ) INTO result;
  
  RETURN result;
END;
$$;
