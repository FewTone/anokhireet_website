-- Check for duplicate or problematic columns in products table
-- Run this in Supabase SQL Editor

-- List all columns in products table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY column_name;

-- Check specifically for image-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products' 
  AND (column_name LIKE '%image%' OR column_name LIKE '%Image%')
ORDER BY column_name;

-- Check for any duplicate column names (should return 0 rows if no duplicates)
SELECT column_name, COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'products'
GROUP BY column_name
HAVING COUNT(*) > 1;

