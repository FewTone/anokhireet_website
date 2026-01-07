-- =====================================================
-- ALLOW PUBLIC READ ACCESS TO USERS
-- =====================================================
-- This policy is required so the login page can check if a 
-- phone number already exists in the database.
-- Without this, the app thinks every user is a "New User".
-- =====================================================

-- 1. Drop existing select policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Public users can view details" ON users;

-- 2. Create policy to allow anyone to read users
-- using (true) means anyone (anon or authenticated) can select rows
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT
    USING (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- =====================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste this entire file
-- 3. Click RUN
-- =====================================================
