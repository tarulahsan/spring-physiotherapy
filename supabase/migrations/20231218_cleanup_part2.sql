-- Part 2: Clean up therapies table

-- Drop existing therapies table
DROP TABLE IF EXISTS therapies CASCADE;

-- Create therapies table with the correct schema
CREATE TABLE therapies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE therapies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON therapies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON therapies
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON therapies
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON therapies
    FOR DELETE TO authenticated USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_therapies_updated_at ON therapies;
CREATE TRIGGER update_therapies_updated_at
    BEFORE UPDATE ON therapies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
