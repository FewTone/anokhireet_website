-- MIGRATION: Add images, primary_image_index, and original_price columns to products table
-- Safe to run multiple times (IF NOT EXISTS checks)

-- Add images column (array of text URLs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[];
    END IF;
END $$;

-- Add primary_image_index column (integer, index of primary image in images array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'primary_image_index'
    ) THEN
        ALTER TABLE products ADD COLUMN primary_image_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add original_price column (numeric, original purchase price)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'original_price'
    ) THEN
        ALTER TABLE products ADD COLUMN original_price NUMERIC;
    END IF;
END $$;

-- Migrate existing data: if image column has a value but images is null, populate images array
DO $$
BEGIN
    UPDATE products
    SET images = ARRAY[image]
    WHERE image IS NOT NULL 
      AND image != ''
      AND (images IS NULL OR array_length(images, 1) IS NULL);
END $$;

-- Set primary_image_index to 0 for products that have images but no primary_image_index set
UPDATE products
SET primary_image_index = 0
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND (primary_image_index IS NULL OR primary_image_index < 0 OR primary_image_index >= array_length(images, 1));

-- Add comment for documentation
COMMENT ON COLUMN products.images IS 'Array of product image URLs';
COMMENT ON COLUMN products.primary_image_index IS 'Index of the primary image in the images array (0-based)';
COMMENT ON COLUMN products.original_price IS 'Original purchase price of the product';

