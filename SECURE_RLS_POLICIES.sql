-- =====================================================
-- SECURE RLS POLICIES (AUDIT REMEDIATION)
-- =====================================================

-- 1. USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop insecure or loose policies
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- SELECT: Users view themselves, Admins view all
CREATE POLICY "Users view own record" ON users
  FOR SELECT USING (
    auth.uid() = auth_user_id 
    OR 
    EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
  );

-- INSERT: Authenticated users can insert their own profile
CREATE POLICY "Users insert own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_user_id
  );

-- UPDATE: Users update themselves, Admins update all (optional, maybe unrestricted for admins?)
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (
    auth.uid() = auth_user_id
    OR 
    EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
  );

-- 2. ADMINS TABLE
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
CREATE POLICY "Admins view admins" ON admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
  );

-- 3. PRODUCTS TABLE (Public View, Admin Manage)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admins manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
  );
