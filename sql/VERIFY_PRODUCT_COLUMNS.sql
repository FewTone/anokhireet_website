-- VERIFY: Check if images, primary_image_index, and original_price columns exist
-- Run this to verify the migration was successful

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name IN ('images', 'primary_image_index', 'original_price')
ORDER BY column_name;

-- Expected output: 3 rows (one for each column)
-- If you see fewer rows, the migration may not have run successfully

