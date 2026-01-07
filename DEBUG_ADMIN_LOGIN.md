# Debug Admin Login Issues

If you can't log in to the admin panel, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try to log in
4. Look for any error messages
5. **Copy the exact error message** you see

## Step 2: Verify Admin User Exists

Run this SQL in Supabase SQL Editor:

```sql
-- Check if admin user exists in both tables
SELECT 
    'users table' as source,
    id,
    email,
    is_admin
FROM users
WHERE email = 'anokhireet@gmail.com'

UNION ALL

SELECT 
    'auth.users' as source,
    id::text,
    email,
    NULL as is_admin
FROM auth.users
WHERE email = 'anokhireet@gmail.com';
```

**Expected result:** You should see the user in both tables with matching IDs.

## Step 3: Verify User IDs Match

The user ID in `users` table must match the ID in `auth.users` table.

Run this SQL:

```sql
SELECT 
    u.id as users_table_id,
    au.id as auth_users_id,
    CASE 
        WHEN u.id = au.id THEN '✓ IDs match'
        ELSE '✗ IDs do NOT match - THIS IS THE PROBLEM!'
    END as status
FROM users u
JOIN auth.users au ON u.email = au.email
WHERE u.email = 'anokhireet@gmail.com';
```

**If IDs don't match:** You need to fix this:

```sql
-- Delete the user from users table
DELETE FROM users WHERE email = 'anokhireet@gmail.com';

-- Re-insert with correct ID
INSERT INTO users (id, name, phone, email, is_admin)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'anokhireet@gmail.com'),
    'Admin',
    '+911234567890',
    'anokhireet@gmail.com',
    true
);
```

## Step 4: Test RLS Policies

Run this SQL to test if the policies work:

```sql
-- This simulates what happens when an authenticated admin queries their own record
-- Note: This runs as service role, so RLS is bypassed
-- But it shows the structure

SELECT 
    id,
    email,
    is_admin,
    'This query should work when authenticated' as note
FROM users
WHERE email = 'anokhireet@gmail.com';
```

## Step 5: Check Environment Variables

Make sure your `.env.local` file has:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** After updating `.env.local`, you MUST restart your dev server!

## Step 6: Clear Browser Data

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear **Local Storage**
4. Clear **Session Storage**
5. Try logging in again

## Step 7: Check Authentication

The login process:
1. User enters email/password
2. Supabase Auth authenticates → returns user with `id`
3. Code queries `users` table with `.eq("id", user.id)`
4. RLS policy "Users can view own profile" checks `id = auth.uid()`
5. If match, returns `is_admin` value
6. If `is_admin = true`, user is logged in

## Common Issues

### Issue: "User not found in database"
**Solution:** Run Step 3 SQL to fix the user ID mismatch.

### Issue: "Permission denied" or RLS error
**Solution:** The RLS policies might be blocking. Check Step 4.

### Issue: "Invalid login credentials"
**Solution:** 
- Check email/password are correct
- Make sure user exists in `auth.users`
- Check if user is confirmed (should be if created via dashboard)

### Issue: Empty error object `{}`
**Solution:** This usually means RLS is blocking silently. Check browser console for more details.

## Still Not Working?

1. **Check browser console** for the exact error
2. **Share the error message** you see
3. **Check if user IDs match** (Step 3)
4. **Verify environment variables** are set correctly
5. **Restart dev server** after changing `.env.local`

## Quick Fix SQL

If nothing else works, run this to reset everything:

```sql
-- Make sure admin user exists with correct ID
DELETE FROM users WHERE email = 'anokhireet@gmail.com';

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

-- Verify it worked
SELECT id, email, is_admin FROM users WHERE email = 'anokhireet@gmail.com';
```






