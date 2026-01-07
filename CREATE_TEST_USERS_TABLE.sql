-- =====================================================
-- ⚠️ WARNING: DEVELOPMENT ONLY - REMOVE BEFORE PRODUCTION
-- CREATE TEST USERS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================
-- 
-- IMPORTANT: This table is COMPLETELY SEPARATE from users table.
-- It has NO foreign key relationships with users or user_products.
-- Test users are for development/testing only.
-- 
-- See REMOVE_TEST_USERS_BEFORE_LIVE.md for removal instructions.
-- =====================================================

-- Create test_users table (completely independent, no foreign keys)
CREATE TABLE IF NOT EXISTS test_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_test_users_phone ON test_users(phone);

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For development, we allow all operations
CREATE POLICY "Allow all operations on test_users" ON test_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE test_users IS '⚠️ DEVELOPMENT ONLY - Test users table. Completely separate from users table. No foreign key relationships. Users can login with phone and password without OTP verification. MUST BE REMOVED BEFORE PRODUCTION.';

-- Verify table was created
SELECT 
    'test_users table created successfully' as status,
    COUNT(*) as existing_rows
FROM test_users;
