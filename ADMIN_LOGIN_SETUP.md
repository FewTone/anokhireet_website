# Admin Login Setup Guide

## Credentials
- **Email:** anokhireet@gmail.com
- **Password:** Reet@1432@1402

## Step-by-Step Setup

### Step 1: Create User in Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** (or **"Invite User"**)
3. Fill in:
   - **Email:** `anokhireet@gmail.com`
   - **Password:** `Reet@1432@1402`
   - **Auto Confirm User:** ✅ **Check this box** (IMPORTANT!)
4. Click **"Create User"** or **"Send Invitation"**

**Note:** If the user already exists, you can skip this step or reset the password.

### Step 2: Add User to Admins Table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the SQL from `SETUP_ADMIN_USER.sql`
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

The script will:
- Find the user in `auth.users`
- Add them to the `admins` table
- Verify the setup

### Step 3: Verify Setup

Run this query to verify:

```sql
SELECT 
    a.id as admin_id,
    a.auth_user_id,
    a.email,
    au.id as auth_users_id,
    CASE 
        WHEN a.auth_user_id = au.id THEN '✅ Ready to login'
        ELSE '❌ Setup incomplete'
    END as status
FROM admins a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
WHERE a.email = 'anokhireet@gmail.com';
```

**Expected Result:** You should see one row with "✅ Ready to login"

### Step 4: Test Login

1. Go to your app's admin page: `/admin`
2. Enter:
   - **Email:** `anokhireet@gmail.com`
   - **Password:** `Reet@1432@1402`
3. Click **"Login"**

## Troubleshooting

### "User not found in auth.users"
- **Solution:** Create the user in Supabase Dashboard first (Step 1)

### "Access denied. This account is not an admin"
- **Solution:** Run the SQL script from Step 2 to add user to `admins` table

### "Invalid email or password"
- **Solution:** 
  - Check if user exists in `auth.users`
  - Reset password in Supabase Dashboard if needed
  - Make sure "Auto Confirm User" was checked when creating

### User exists but can't login
- **Check:** Run the verification query (Step 3)
- **Fix:** Make sure `auth_user_id` in `admins` table matches `id` in `auth.users`

## Quick Fix SQL

If you need to manually fix the admin user:

```sql
-- First, get the auth user ID
SELECT id, email FROM auth.users WHERE email = 'anokhireet@gmail.com';

-- Then insert/update in admins table (replace YOUR_AUTH_USER_ID with the ID from above)
INSERT INTO admins (auth_user_id, email)
VALUES ('YOUR_AUTH_USER_ID', 'anokhireet@gmail.com')
ON CONFLICT (email) DO UPDATE
SET auth_user_id = EXCLUDED.auth_user_id;
```

## After Setup

Once setup is complete, you should be able to:
- ✅ Login at `/admin` with email and password
- ✅ Access all admin features
- ✅ Manage users, products, categories, etc.

