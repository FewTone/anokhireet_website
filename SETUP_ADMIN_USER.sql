-- =====================================================
-- SETUP ADMIN USER: anokhireet@gmail.com
-- Run this AFTER creating the user in Supabase Auth
-- =====================================================

-- Step 1: First, create the user in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: anokhireet@gmail.com
-- Password: Reet@1432@1402
-- Auto Confirm User: Yes (check this box)
-- Click "Create User"

-- Step 2: After user is created in Auth, run this SQL:

-- Get the auth user ID
DO $$
DECLARE
    auth_user_uuid UUID;
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_uuid
    FROM auth.users
    WHERE email = 'anokhireet@gmail.com';
    
    IF auth_user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found in auth.users. Please create the user in Supabase Dashboard first (Authentication > Users > Add User)';
    END IF;
    
    -- Insert into admins table
    INSERT INTO admins (auth_user_id, email)
    VALUES (auth_user_uuid, 'anokhireet@gmail.com')
    ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id;
    
    RAISE NOTICE 'Admin user created/updated successfully!';
    RAISE NOTICE 'Auth User ID: %', auth_user_uuid;
    RAISE NOTICE 'Email: anokhireet@gmail.com';
END $$;

-- Step 3: Verify the admin user was created
SELECT 
    a.id as admin_id,
    a.auth_user_id,
    a.email,
    a.created_at,
    au.id as auth_users_id,
    CASE 
        WHEN a.auth_user_id = au.id THEN '✅ IDs match'
        ELSE '❌ IDs do NOT match'
    END as status
FROM admins a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
WHERE a.email = 'anokhireet@gmail.com';

-- If the above query shows the admin exists and IDs match, you're good to go!
-- If not, check the error messages above.

