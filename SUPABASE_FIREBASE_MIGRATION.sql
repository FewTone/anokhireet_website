-- =====================================================
-- SUPABASE SCHEMA UPDATE FOR FIREBASE AUTH
-- Run this in Supabase SQL Editor to update schema
-- =====================================================

-- Step 1: Remove foreign key constraint to auth.users
-- (Firebase UIDs are strings, not Supabase Auth UUIDs)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 2: Update users table to remove password column
-- (Passwords are now managed by Firebase Auth)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Step 3: Make email required (Firebase Auth requires email)
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Step 4: Update user_products table foreign key
-- (Ensure it references users.id which now stores Firebase UIDs)
-- The foreign key should already work, but we'll verify
ALTER TABLE user_products DROP CONSTRAINT IF EXISTS user_products_user_id_fkey;
ALTER TABLE user_products 
    ADD CONSTRAINT user_products_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Step 5: Update RLS policies to work with Firebase UIDs
-- Note: Since Firebase Auth is separate from Supabase Auth,
-- RLS policies using auth.uid() won't work. You have two options:

-- Option A: Disable RLS (simpler, but less secure)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Option B: Use service role key for admin operations
-- Keep RLS enabled but use service role key in admin panel
-- (This requires updating your admin code to use service role key)

-- For now, we'll keep RLS policies but they may need adjustment
-- based on your security requirements

-- Step 6: Verify the schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('users', 'user_products', 'products')
ORDER BY table_name, ordinal_position;








