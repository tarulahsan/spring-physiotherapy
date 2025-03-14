-- Fix discount_givers table
BEGIN;

-- Drop and recreate discount_givers table with correct structure
DROP TABLE IF EXISTS discount_givers CASCADE;

CREATE TABLE discount_givers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_discount_givers_updated_at ON discount_givers;
CREATE TRIGGER update_discount_givers_updated_at
    BEFORE UPDATE ON discount_givers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE discount_givers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON discount_givers;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON discount_givers;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON discount_givers;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON discount_givers;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
    ON discount_givers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON discount_givers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
    ON discount_givers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
    ON discount_givers FOR DELETE
    TO authenticated
    USING (true);

COMMIT;
