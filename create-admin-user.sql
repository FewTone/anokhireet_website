-- Script to create admin user: anokhireet@gmail.com
-- Run this AFTER creating the user in Supabase Auth

-- Step 1: First, create the user in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: anokhireet@gmail.com
-- Password: Reet@1432@1402
-- Auto Confirm User: Yes (check this box)
-- Click "Create User"

-- Step 2: After user is created in Auth, run this SQL:
-- (Replace the UUID with the actual user ID from auth.users table)

INSERT INTO users (id, name, phone, email, is_admin) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'anokhireet@gmail.com'),
    'Admin',
    '+911234567890',
    'anokhireet@gmail.com',
    true
)
ON CONFLICT (id) DO UPDATE 
SET is_admin = true;

-- Verify the admin user was created:
SELECT id, name, email, is_admin FROM users WHERE email = 'anokhireet@gmail.com';









