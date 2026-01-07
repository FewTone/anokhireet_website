-- =====================================================
-- CHATGPT SCHEMA MIGRATION (Full Implementation)
-- Includes the requested RLS policy for user self-registration
-- =====================================================

-- 0️⃣ Prerequisites
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1️⃣ ADMINS TABLE (Email + Password via Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2️⃣ USERS TABLE (Owners & Renters only)
-- ⚠️ Admins do NOT go here.
-- =====================================================
-- First, drop all old RLS policies that depend on is_admin column
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can insert user products" ON user_products;
DROP POLICY IF EXISTS "Admins can update user products" ON user_products;
DROP POLICY IF EXISTS "Admins can delete user products" ON user_products;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow admin updates to website settings" ON website_settings;
DROP POLICY IF EXISTS "Allow admin inserts to website settings" ON website_settings;
DROP POLICY IF EXISTS "Allow admin to manage categories" ON categories;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own products" ON user_products;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage user products" ON user_products;
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Users can view own products" ON user_products;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on user_products" ON user_products;
DROP POLICY IF EXISTS "Allow all operations on products" ON products;

-- Now check if users table exists and what columns it has
DO $$
BEGIN
    -- Drop old foreign key constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
    
    -- Add auth_user_id if it doesn't exist (rename from auth_uid if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
        -- Check if auth_uid exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'auth_uid') THEN
            ALTER TABLE users RENAME COLUMN auth_uid TO auth_user_id;
        ELSE
            ALTER TABLE users ADD COLUMN auth_user_id UUID UNIQUE;
        END IF;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('owner','renter'));
    END IF;
    
    -- Make phone required (if column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
    END IF;
    
    -- Add unique constraint on phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
    
    -- Remove email requirement (make it optional) - only if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- Now we can safely drop is_admin column (after dropping all dependent policies)
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

-- Ensure users table has correct structure
-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner','renter')),
  auth_user_id UUID UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3️⃣ CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4️⃣ PRODUCTS TABLE (Admin-created only)
-- =====================================================
-- First, check if products table exists and update it, or create new
DO $$
BEGIN
    -- If products table exists, add missing columns
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'products') THEN
        -- Add owner_user_id if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'owner_user_id') THEN
            ALTER TABLE products ADD COLUMN owner_user_id UUID;
        END IF;
        
        -- Add category_id if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'category_id') THEN
            ALTER TABLE products ADD COLUMN category_id UUID;
        END IF;
        
        -- Add title if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'title') THEN
            ALTER TABLE products ADD COLUMN title TEXT;
        END IF;
        
        -- Add description if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'description') THEN
            ALTER TABLE products ADD COLUMN description TEXT;
        END IF;
        
        -- Add price_per_day if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'price_per_day') THEN
            ALTER TABLE products ADD COLUMN price_per_day NUMERIC;
        END IF;
        
        -- Add is_active if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'is_active') THEN
            ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- Make owner_user_id NOT NULL if it's currently nullable and has no data
        -- (We'll set it during migration)
    ELSE
        -- Create new products table
        CREATE TABLE products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category_id UUID REFERENCES categories(id),
          title TEXT NOT NULL,
          description TEXT,
          price_per_day NUMERIC,
          is_active BOOLEAN DEFAULT true,
          -- Keep old fields for migration compatibility
          name TEXT,
          price TEXT,
          image TEXT,
          product_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_owner_user_id_fkey'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_owner_user_id_fkey 
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Migrate data from user_products to products if user_products exists
DO $$
DECLARE
    user_products_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_products'
    ) INTO user_products_exists;
    
    IF user_products_exists THEN
        -- Migrate user_products to products
        INSERT INTO products (id, owner_user_id, title, description, price_per_day, name, price, image, product_id, created_at, is_active)
        SELECT 
            id,
            user_id as owner_user_id,
            name as title,
            NULL as description,
            CASE 
                WHEN price ~ '^[0-9]+\.?[0-9]*$' THEN price::NUMERIC
                ELSE NULL
            END as price_per_day,
            name,
            price,
            image,
            product_id,
            created_at,
            true as is_active
        FROM user_products
        WHERE NOT EXISTS (
            SELECT 1 FROM products WHERE products.id = user_products.id
        );
    END IF;
END $$;

-- =====================================================
-- 5️⃣ INQUIRIES TABLE (Unlocks chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  renter_user_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending','closed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6️⃣ CHATS TABLE (1 chat per inquiry)
-- =====================================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID UNIQUE NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7️⃣ MESSAGES TABLE (Text-only)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔐 ENABLE ROW LEVEL SECURITY (MANDATORY)
-- =====================================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 🛡️ RLS POLICIES
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "admin read own" ON admins;
DROP POLICY IF EXISTS "user read self" ON users;
DROP POLICY IF EXISTS "admin manage users" ON users;
DROP POLICY IF EXISTS "user create self profile" ON users;
DROP POLICY IF EXISTS "public read categories" ON categories;
DROP POLICY IF EXISTS "admin manage categories" ON categories;
DROP POLICY IF EXISTS "public read products" ON products;
DROP POLICY IF EXISTS "owner read products" ON products;
DROP POLICY IF EXISTS "admin manage products" ON products;
DROP POLICY IF EXISTS "users read own inquiries" ON inquiries;
DROP POLICY IF EXISTS "renter create inquiry" ON inquiries;
DROP POLICY IF EXISTS "admin manage inquiries" ON inquiries;
DROP POLICY IF EXISTS "chat participants read" ON chats;
DROP POLICY IF EXISTS "read messages" ON messages;
DROP POLICY IF EXISTS "send message" ON messages;

-- =====================================================
-- ADMINS TABLE POLICIES
-- =====================================================
CREATE POLICY "admin read own"
ON admins FOR SELECT
USING (auth_user_id = auth.uid());

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================
-- User can read own row
CREATE POLICY "user read self"
ON users FOR SELECT
USING (auth_user_id = auth.uid());

-- ✅ REQUIRED: User can create their own profile (OTP verified)
CREATE POLICY "user create self profile"
ON users FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

-- Admin full access
CREATE POLICY "admin manage users"
ON users FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================
-- Public read
CREATE POLICY "public read categories"
ON categories FOR SELECT
USING (true);

-- Admin manage
CREATE POLICY "admin manage categories"
ON categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================
-- Public read active products
CREATE POLICY "public read products"
ON products FOR SELECT
USING (is_active = true);

-- Owner read own products
CREATE POLICY "owner read products"
ON products FOR SELECT
USING (
  owner_user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Admin full access
CREATE POLICY "admin manage products"
ON products FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- INQUIRIES TABLE POLICIES
-- =====================================================
-- Owner or renter can read their inquiries
CREATE POLICY "users read own inquiries"
ON inquiries FOR SELECT
USING (
  owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  OR
  renter_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Renter can create inquiry
CREATE POLICY "renter create inquiry"
ON inquiries FOR INSERT
WITH CHECK (
  renter_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Admin full access
CREATE POLICY "admin manage inquiries"
ON inquiries FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- CHATS TABLE POLICIES
-- =====================================================
-- Chat visible only to inquiry participants
CREATE POLICY "chat participants read"
ON chats FOR SELECT
USING (
  inquiry_id IN (
    SELECT id FROM inquiries
    WHERE
      owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR
      renter_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================
-- Read messages only if user is part of chat
CREATE POLICY "read messages"
ON messages FOR SELECT
USING (
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN inquiries i ON i.id = c.inquiry_id
    WHERE
      i.owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR
      i.renter_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Send message only if user is part of chat
CREATE POLICY "send message"
ON messages FOR INSERT
WITH CHECK (
  sender_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- MIGRATE EXISTING ADMINS
-- =====================================================
-- Move existing admins from users.is_admin to admins table
-- This assumes admins have auth_user_id set
INSERT INTO admins (auth_user_id, email)
SELECT 
  COALESCE(auth_user_id, id) as auth_user_id,
  COALESCE(email, 'admin@example.com') as email
FROM users
WHERE id IN (
  SELECT id FROM users 
  WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  )
  AND (
    SELECT is_admin FROM users u2 WHERE u2.id = users.id
  ) = true
)
AND NOT EXISTS (
  SELECT 1 FROM admins WHERE admins.email = users.email
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_products_owner_user_id ON products(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_inquiries_product_id ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_owner_user_id ON inquiries(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_renter_user_id ON inquiries(renter_user_id);
CREATE INDEX IF NOT EXISTS idx_chats_inquiry_id ON chats(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON messages(sender_user_id);

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================
SELECT 'Migration complete!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages');

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages')
ORDER BY tablename, policyname;

