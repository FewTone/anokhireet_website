-- QUICK FIX: Add missing columns to products table
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it

-- Step 1: Add images column (array of image URLs)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Step 2: Add primary_image_index column
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;

-- Step 3: Add original_price column
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Step 4: Migrate existing image data to images array
UPDATE products
SET images = ARRAY[image]
WHERE image IS NOT NULL 
  AND image != ''
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Step 5: Set default primary_image_index
UPDATE products
SET primary_image_index = 0
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND (primary_image_index IS NULL OR primary_image_index < 0);

-- Verification: Check if columns were added (should return 3 rows)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name IN ('images', 'primary_image_index', 'original_price')
ORDER BY column_name;

