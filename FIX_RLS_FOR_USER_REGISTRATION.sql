-- =====================================================
-- FIX RLS POLICY FOR USER SELF-REGISTRATION
-- =====================================================
-- This SQL allows users to insert their own record in the users table
-- This is needed for the OTP bypass dev mode to work
--
-- Run this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Paste this SQL and click "Run"
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own record" ON users;

-- Create policy to allow users to insert their own record
-- This allows authenticated users (created via Supabase Auth) to insert their own user record
CREATE POLICY "Users can insert own record" ON users
    FOR INSERT
    WITH CHECK (
        -- Allow if the user is inserting their own record (matching auth.uid())
        auth.uid() = id 
        OR auth.uid() = auth_uid
        -- OR allow if no auth session (for dev mode bypass)
        OR auth.uid() IS NULL
    );

-- Also allow users to update their own record
DROP POLICY IF EXISTS "Users can update own record" ON users;

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE
    USING (
        id = auth.uid() 
        OR auth_uid = auth.uid()
    )
    WITH CHECK (
        id = auth.uid() 
        OR auth_uid = auth.uid()
    );

-- Verify the policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;







