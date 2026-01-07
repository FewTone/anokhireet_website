-- Create users table
-- Note: id should match auth.users.id from Supabase Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (main website products)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    product_id TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_products table
CREATE TABLE IF NOT EXISTS user_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (allow all operations for now - adjust based on your needs)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for user_products table
CREATE POLICY "Allow all operations on user_products" ON user_products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for products table
CREATE POLICY "Allow all operations on products" ON products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Create a view to get user products with user info
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

-- IMPORTANT: To create your first admin user, you need to:
-- 1. First create the user in Supabase Auth (Authentication > Users > Add User)
--    - Email: anokhireet@gmail.com
--    - Password: Reet@1432@1402
--    - Auto Confirm User: Yes (check this box)
--
-- 2. Then get the user's UUID from auth.users table and run:
--    INSERT INTO users (id, name, phone, email, is_admin) 
--    VALUES (
--        (SELECT id FROM auth.users WHERE email = 'anokhireet@gmail.com'),
--        'Admin',
--        '+911234567890',
--        'anokhireet@gmail.com',
--        true
--    );
--
-- Alternatively, you can use the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User" 
-- 3. Enter email: anokhireet@gmail.com
-- 4. Enter password: Reet@1432@1402
-- 5. Check "Auto Confirm User"
-- 6. After user is created, note the User UID
-- 7. Go to Table Editor > users
-- 8. Insert a new row with:
--    - id: (the User UID from step 6)
--    - name: Admin
--    - phone: +911234567890 (or any valid phone)
--    - email: anokhireet@gmail.com
--    - is_admin: true

