-- =====================================================
-- FIX CATEGORIES TABLE - Add Missing Columns
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add missing columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing categories to have display_order based on created_at
UPDATE categories 
SET display_order = subquery.row_number - 1
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
    FROM categories
) AS subquery
WHERE categories.id = subquery.id;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

