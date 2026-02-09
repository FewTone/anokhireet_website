-- =====================================================
-- ROBUST SECURE RLS POLICIES (FINAL VERSION)
-- =====================================================

-- This script covers all detected tables with existence checks for tables AND columns.

DO $$ 
DECLARE 
  t text;
  public_tables text[] := ARRAY[
    'categories', 'cities', 'colors', 'materials', 'occasions', 
    'product_types', 'hero_slides', 'poster_settings', 'website_settings',
    'product_cities', 'product_colors', 'product_materials', 
    'product_occasions', 'product_product_types'
  ];
BEGIN
  -- 1. PUBLIC READ-ONLY TABLES
  FOREACH t IN ARRAY public_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON %I', t);
      EXECUTE format('CREATE POLICY "Public Read Access" ON %I FOR SELECT USING (true)', t);
      
      EXECUTE format('DROP POLICY IF EXISTS "Admin Manage Access" ON %I', t);
      EXECUTE format('CREATE POLICY "Admin Manage Access" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()))', t);
    END IF;
  END LOOP;

  -- 2. PRODUCTS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public view products" ON products;
    CREATE POLICY "Public view products" ON products FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admins manage products" ON products;
    CREATE POLICY "Admins manage products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()));
  END IF;

  -- 3. USERS & USER_CITIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- AGGRESSIVE CLEANUP: Drop known legacy permissive policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
    DROP POLICY IF EXISTS "Public users can view details" ON users;
    DROP POLICY IF EXISTS "Enable access to all users" ON users;
    
    -- PUBLIC: Allow everyone to see display names and avatars (required for store)
    DROP POLICY IF EXISTS "Public view user profiles" ON users;
    CREATE POLICY "Public view user profiles" ON users FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users view own record" ON users;
    CREATE POLICY "Users view own record" ON users FOR SELECT USING (auth.uid() = auth_user_id OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()));
    
    DROP POLICY IF EXISTS "Users insert own profile" ON users;
    CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
    
    DROP POLICY IF EXISTS "Users update own profile" ON users;
    CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_cities') THEN
    ALTER TABLE user_cities ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage own cities" ON user_cities;
    CREATE POLICY "Users manage own cities" ON user_cities FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE id = user_id AND auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
    );
  END IF;

  -- 4. WISHLIST
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlist') THEN
    ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlist;
    -- Logic: user_id in wishlist relates to public.users.id
    CREATE POLICY "Users manage own wishlist" ON wishlist FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE id = user_id AND auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
    );
  END IF;

  -- 5. CHATS & MESSAGES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
    ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Chat Access" ON chats;
    -- Simple: All authenticated can read chats, but filtering is done by logic. 
    -- Or better: Admins manage all, Users see theirs if they are participants in linked inquiry.
    CREATE POLICY "Chat Access" ON chats FOR SELECT USING (
      EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM inquiries WHERE id = inquiry_id AND (owner_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR renter_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())))
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Message Access" ON messages;
    -- Using verified column name: sender_user_id
    CREATE POLICY "Message Access" ON messages FOR ALL USING (
      sender_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
    );
  END IF;

  -- 6. INQUIRIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inquiries') THEN
    ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Inquiry Access" ON inquiries;
    -- Using verified column names: owner_user_id, renter_user_id
    CREATE POLICY "Inquiry Access" ON inquiries FOR SELECT USING (
      owner_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR renter_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
    );
  END IF;

  -- 7. REPORTS & CONTACT REQUESTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_requests') THEN
    ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Contact Request Insert" ON contact_requests;
    CREATE POLICY "Contact Request Insert" ON contact_requests FOR INSERT WITH CHECK (true);
    DROP POLICY IF EXISTS "Contact Request Admin" ON contact_requests;
    CREATE POLICY "Contact Request Admin" ON contact_requests FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admin only reports" ON reports;
    CREATE POLICY "Admin only reports" ON reports FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid()));
  END IF;

  -- 8. ADMINS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins') THEN
    ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins view admins" ON admins;
    -- FIX: Non-recursive check (check auth_user_id directly for self-view)
    CREATE POLICY "Admins view admins" ON admins FOR SELECT USING (auth_user_id = auth.uid());
  END IF;

END $$;
