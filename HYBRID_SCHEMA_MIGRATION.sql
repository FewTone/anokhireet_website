-- =====================================================
-- HYBRID SCHEMA MIGRATION
-- Combines ChatGPT's good ideas with your current system
-- =====================================================

-- 1️⃣ CREATE ADMINS TABLE (Separate from users)
-- This is better than is_admin flag
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Can be NULL for admin-created accounts
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ UPDATE USERS TABLE (Keep your current structure, add role)
-- Add role field for future owner/renter distinction
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner','renter'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_uid UUID; -- Keep this for your current flow

-- 3️⃣ CREATE CATEGORIES TABLE (For better organization)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ KEEP YOUR CURRENT PRODUCTS STRUCTURE
-- Don't change user_products - it works for your use case
-- Just add category_id if needed
ALTER TABLE user_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- 5️⃣ ADD RENTAL FEATURES (Optional - for future)
-- Only add these if you need rental functionality
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES user_products(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  renter_user_id UUID NOT NULL REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('pending','closed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID UNIQUE REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6️⃣ MIGRATE EXISTING ADMINS
-- Move existing admins from users.is_admin to admins table
INSERT INTO admins (auth_user_id, email)
SELECT 
  COALESCE(auth_uid, id) as auth_user_id,
  email
FROM users
WHERE is_admin = true
ON CONFLICT (email) DO NOTHING;

-- 7️⃣ ENABLE RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8️⃣ RLS POLICIES (Adapted for your auth flow)
-- Admins can read themselves (works with or without auth session)
CREATE POLICY "admin read own" ON admins FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Categories: Public read, admin manage
CREATE POLICY "public read categories" ON categories FOR SELECT
USING (true);

CREATE POLICY "admin manage categories" ON categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Inquiries: Users can read their own
CREATE POLICY "users read own inquiries" ON inquiries FOR SELECT
USING (
  owner_user_id IN (SELECT id FROM users WHERE COALESCE(auth_uid, id) = auth.uid())
  OR renter_user_id IN (SELECT id FROM users WHERE COALESCE(auth_uid, id) = auth.uid())
);

-- Messages: Users can read messages in their chats
CREATE POLICY "read messages" ON messages FOR SELECT
USING (
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN inquiries i ON i.id = c.inquiry_id
    WHERE 
      i.owner_user_id IN (SELECT id FROM users WHERE COALESCE(auth_uid, id) = auth.uid())
      OR i.renter_user_id IN (SELECT id FROM users WHERE COALESCE(auth_uid, id) = auth.uid())
  )
);

-- 9️⃣ INDEXES
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_inquiries_product_id ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_owner_user_id ON inquiries(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_renter_user_id ON inquiries(renter_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON messages(sender_user_id);

-- ✅ VERIFY
SELECT 'Migration complete! Check tables:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admins', 'categories', 'inquiries', 'chats', 'messages')
ORDER BY table_name;

