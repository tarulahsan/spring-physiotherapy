-- Check existing buckets and their configurations
SELECT 
    b.id as bucket_id,
    b.name as bucket_name,
    b.public as is_public,
    b.created_at,
    COUNT(o.id) as object_count
FROM 
    storage.buckets b
LEFT JOIN 
    storage.objects o ON b.id = o.bucket_id
GROUP BY 
    b.id, b.name, b.public, b.created_at
ORDER BY 
    b.created_at DESC;

-- Check storage policies
SELECT 
    polname as policy_name,
    relname as table_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_expr,
    pg_get_expr(polwithcheck, polrelid) as with_check_expr
FROM 
    pg_policy 
JOIN 
    pg_class ON pg_policy.polrelid = pg_class.oid
WHERE 
    relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
