-- =====================================================
-- CLEAN MIGRATION - For Fresh Database
-- Run this in Supabase SQL Editor
-- =====================================================

-- 0️⃣ Prerequisites
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1️⃣ ADMINS TABLE (Email + Password via Supabase Auth)
-- =====================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2️⃣ USERS TABLE (Owners & Renters only)
-- ⚠️ Admins do NOT go here.
-- =====================================================
CREATE TABLE users (
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
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4️⃣ PRODUCTS TABLE (Admin-created only)
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price_per_day NUMERIC,
  is_active BOOLEAN DEFAULT true,
  -- Legacy fields for compatibility
  name TEXT,
  price TEXT,
  image TEXT,
  product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5️⃣ INQUIRIES TABLE (Unlocks chat)
-- =====================================================
CREATE TABLE inquiries (
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
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID UNIQUE NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7️⃣ MESSAGES TABLE (Text-only)
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8️⃣ WEBSITE_SETTINGS TABLE (For website enable/disable)
-- =====================================================
CREATE TABLE website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 🛡️ RLS POLICIES
-- =====================================================

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
)
WITH CHECK (
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
-- WEBSITE_SETTINGS TABLE POLICIES
-- =====================================================
-- Public can read website settings
CREATE POLICY "public read website settings"
ON website_settings FOR SELECT
USING (true);

-- Admin can manage website settings
CREATE POLICY "admin manage website settings"
ON website_settings FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_products_owner_user_id ON products(owner_user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_inquiries_product_id ON inquiries(product_id);
CREATE INDEX idx_inquiries_owner_user_id ON inquiries(owner_user_id);
CREATE INDEX idx_inquiries_renter_user_id ON inquiries(renter_user_id);
CREATE INDEX idx_chats_inquiry_id ON chats(inquiry_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_user_id ON messages(sender_user_id);
CREATE INDEX idx_website_settings_key ON website_settings(key);

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================
SELECT '✅ Migration complete!' as status;

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages', 'website_settings')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages', 'website_settings')
ORDER BY tablename;

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('admins', 'users', 'categories', 'products', 'inquiries', 'chats', 'messages', 'website_settings')
ORDER BY tablename, policyname;

