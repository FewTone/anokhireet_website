-- =====================================================
-- MIGRATION TO SUPABASE AUTH WITH PHONE OTP
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Update users table structure
-- Remove password column (not needed with OTP)
-- Make email optional
-- Remove foreign key constraint (we'll handle linking differently)

-- Drop existing foreign key constraint first
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Remove password column (not needed with OTP authentication)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Ensure email is optional (allow NULL)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Ensure phone is required and unique
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint on phone if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- Step 2: Update RLS policies
-- Products remain public (already have public read policy)

-- Step 3: Note on user creation flow
-- IMPORTANT: Primary key 'id' CANNOT be NULL (PostgreSQL constraint)
-- 
-- When admin creates user:
-- 1. Generate a UUID: gen_random_uuid()
-- 2. Insert into users table with that UUID
-- 3. User is NOT authenticated yet (no auth.users entry)
--
-- When user authenticates with phone OTP:
-- 1. Supabase Auth creates auth.users entry with a different UUID
-- 2. We need to UPDATE users.id to match auth.users.id
-- 3. BUT: We can't update a primary key easily if it's referenced
--
-- Solution: Remove foreign key constraint (done above)
-- Admin creates users with generated UUID
-- When user authenticates, we'll handle the ID update in application code
-- OR: We can create user in auth.users first, then in users table (requires different flow)
