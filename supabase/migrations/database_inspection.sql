-- 1. List all tables and their information
SELECT 
    table_schema,
    table_name,
    pg_size_pretty(pg_total_relation_size(table_schema || '.' || table_name)) as total_size
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- 2. List all columns for each table with their data types
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position;

-- 3. Foreign Key Relationships
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name;

-- 4. Primary Keys
SELECT
    tc.table_schema, 
    tc.table_name, 
    kc.column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc 
    ON kc.table_name = tc.table_name
    AND kc.table_schema = tc.table_schema
    AND kc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_schema, tc.table_name;

-- 5. Indexes
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    i.relname as index_name,
    pg_get_indexdef(i.oid) as index_definition
FROM pg_index x
JOIN pg_class c ON c.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, i.relname;

-- 6. Check Constraints
SELECT 
    tc.table_schema,
    tc.table_name, 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
ORDER BY tc.table_schema, tc.table_name;

-- 7. Table Sizes and Storage
SELECT
    table_schema,
    table_name,
    pg_size_pretty(pg_total_relation_size(table_schema || '.' || table_name)) as total_size,
    pg_size_pretty(pg_table_size(table_schema || '.' || table_name)) as internal_size,
    pg_size_pretty(pg_indexes_size(table_schema || '.' || table_name)) as index_size
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(table_schema || '.' || table_name) DESC;

-- 8. Views
SELECT 
    table_schema as schema_name,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- 9. RLS Policies
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pol.polname as policy_name,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    pol.polroles as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, pol.polname;

-- 10. Table Access Privileges
SELECT 
    table_schema,
    table_name,
    grantee,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY table_schema, table_name, grantee
ORDER BY table_schema, table_name;

-- 11. Database Statistics
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    c.reltuples::bigint as estimated_row_count,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND c.relkind = 'r'
ORDER BY c.reltuples DESC;

-- 12. Extensions
SELECT 
    name,
    default_version,
    installed_version,
    comment
FROM pg_available_extensions
WHERE installed_version IS NOT NULL
ORDER BY name;

-- 13. Active Sessions
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE state IS NOT NULL;

-- 14. Functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- 15. Triggers
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY event_object_schema, event_object_table, trigger_name;
