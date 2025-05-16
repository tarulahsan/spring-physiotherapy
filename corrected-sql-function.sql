-- Complete SQL function definition with proper language specification
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

-- Create update_id column if it doesn't exist (to force updates)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'daily_therapy_records' AND column_name = 'update_id'
  ) THEN
    ALTER TABLE daily_therapy_records ADD COLUMN update_id text;
  END IF;
END $$;
