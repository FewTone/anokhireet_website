-- =====================================================
-- QUICK ADMIN SETUP: anokhireet@gmail.com
-- Run this AFTER creating the user in Supabase Auth
-- =====================================================

-- Step 1: First, create the user in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: anokhireet@gmail.com
-- Password: Reet@1432@1402
-- Auto Confirm User: ✅ CHECK THIS BOX (IMPORTANT!)
-- Click "Create User"

-- Step 2: After user is created in Auth, run this SQL:

-- Get the auth user ID and add to admins table
INSERT INTO admins (auth_user_id, email)
SELECT 
    id as auth_user_id,
    'anokhireet@gmail.com' as email
FROM auth.users
WHERE email = 'anokhireet@gmail.com'
ON CONFLICT (email) DO UPDATE
SET auth_user_id = EXCLUDED.auth_user_id;

-- Step 3: Verify it worked
SELECT 
    '✅ Admin Setup Complete!' as status,
    a.id as admin_id,
    a.auth_user_id,
    a.email,
    CASE 
        WHEN a.auth_user_id = au.id THEN '✅ Ready to login'
        ELSE '❌ Setup incomplete'
    END as login_status
FROM admins a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
WHERE a.email = 'anokhireet@gmail.com';

-- If you see "✅ Ready to login", you can now login at /admin
-- Email: anokhireet@gmail.com
-- Password: Reet@1432@1402

