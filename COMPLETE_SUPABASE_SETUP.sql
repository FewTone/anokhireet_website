-- =====================================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor to set up everything
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (public products visible on home page)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    product_id TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_products table (user-specific products, managed by admin)
CREATE TABLE IF NOT EXISTS user_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on user_products" ON user_products;
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Users can view own products" ON user_products;
DROP POLICY IF EXISTS "Admins can manage user products" ON user_products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES FOR PRODUCTS TABLE
-- =====================================================

-- Policy 1: Public can read products (for home page)
CREATE POLICY "Public can read products" ON products
    FOR SELECT
    USING (true);

-- Policy 2: Only admins can insert/update/delete products
CREATE POLICY "Admins can manage products" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- =====================================================
-- STEP 6: CREATE RLS POLICIES FOR USER_PRODUCTS TABLE
-- =====================================================

-- Policy 1: Users can view their own products (read-only)
CREATE POLICY "Users can view own products" ON user_products
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Policy 2: Only admins can insert/update/delete user products
CREATE POLICY "Admins can manage user products" ON user_products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can update user products" ON user_products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can delete user products" ON user_products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- =====================================================
-- STEP 7: CREATE RLS POLICIES FOR USERS TABLE
-- =====================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.is_admin = true
        )
    );

-- Policy 2: Only admins can create/update users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.is_admin = true
        )
    );

-- =====================================================
-- STEP 8: CREATE VIEW FOR USER PRODUCTS WITH USER INFO
-- =====================================================

CREATE OR REPLACE VIEW user_products_with_user AS
SELECT 
    up.id,
    up.user_id,
    up.name,
    up.price,
    up.image,
    up.product_id,
    up.created_at,
    u.name as user_name,
    u.phone as user_phone,
    u.email as user_email
FROM user_products up
JOIN users u ON up.user_id = u.id;

-- =====================================================
-- STEP 9: VERIFY SETUP
-- =====================================================

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'products', 'user_products')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'products', 'user_products');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'user_products')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 10: CREATE ADMIN USER (AFTER AUTH USER IS CREATED)
-- =====================================================
-- NOTE: First create the user in Supabase Auth Dashboard:
-- 1. Go to Authentication > Users > Add User
-- 2. Email: anokhireet@gmail.com
-- 3. Password: Reet@1432@1402
-- 4. Check "Auto Confirm User"
-- 5. Click "Create User"
-- 
-- Then run this:

INSERT INTO users (id, name, phone, email, is_admin)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'anokhireet@gmail.com'),
    'Admin',
    '+911234567890',
    'anokhireet@gmail.com',
    true
)
ON CONFLICT (id) DO UPDATE
SET is_admin = true;

-- Verify admin user
SELECT id, name, email, is_admin, created_at 
FROM users 
WHERE email = 'anokhireet@gmail.com';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create storage bucket 'product-images' (see STORAGE_SETUP_GUIDE.md)
-- 2. Add storage policies (see FIX_STORAGE_POLICIES.md)
-- 3. Test login at /admin page
-- =====================================================






