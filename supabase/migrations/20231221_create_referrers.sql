-- Create referrers table
CREATE TABLE IF NOT EXISTS referrers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated access to referrers"
ON referrers
FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_referrers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referrers_updated_at
    BEFORE UPDATE ON referrers
    FOR EACH ROW
    EXECUTE FUNCTION update_referrers_updated_at();
