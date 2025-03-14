-- Create therapy_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS therapy_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Copy data from therapies to therapy_types
INSERT INTO therapy_types (name, description, price, status, created_at, updated_at)
SELECT 
    name,
    description,
    price,
    CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
    created_at,
    updated_at
FROM therapies
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- Update therapy_sessions to use therapy_types
UPDATE therapy_sessions
SET therapy_id = (
    SELECT therapy_types.id
    FROM therapy_types
    JOIN therapies ON therapy_types.name = therapies.name
    WHERE therapies.id = therapy_sessions.therapy_id
);

-- Update invoice_items to use therapy_types
UPDATE invoice_items
SET therapy_id = (
    SELECT therapy_types.id
    FROM therapy_types
    JOIN therapies ON therapy_types.name = therapies.name
    WHERE therapies.id = invoice_items.therapy_id
);

-- Update patient_therapies to use therapy_types
UPDATE patient_therapies
SET therapy_id = (
    SELECT therapy_types.id
    FROM therapy_types
    JOIN therapies ON therapy_types.name = therapies.name
    WHERE therapies.id = patient_therapies.therapy_id
);

-- Drop old therapies table
-- DROP TABLE IF EXISTS therapies CASCADE;
