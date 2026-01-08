-- ============================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE
-- ============================================
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire file, then click "Run"

ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Verify it worked (should show 3 rows):
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'primary_image_index', 'original_price');

