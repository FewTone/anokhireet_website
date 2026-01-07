# Admin Login Setup - Step by Step

## Credentials

- **Email:** anokhireet@gmail.com
- **Password:** Reet@1432@1402

## Complete Setup (2 Steps)

### Step 1: Create User in Supabase Auth

1. Go to **Supabase Dashboard**
2. Click **"Authentication"** in the left sidebar
3. Click **"Users"** tab
4. Click **"Add User"** button (or **"Invite User"**)
5. Fill in:
   - **Email:** `anokhireet@gmail.com`
   - **Password:** `Reet@1432@1402`
   - **Auto Confirm User:** ✅ **CHECK THIS BOX** (VERY IMPORTANT!)
6. Click **"Create User"** (or **"Send Invitation"**)

**✅ Done!** User is now in Supabase Auth.

### Step 2: Add User to Admins Table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the SQL from `SETUP_ADMIN_NOW.sql`
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

**✅ Done!** User is now in admins table.

### Step 3: Test Login

1. Go to your app: `/admin`
2. Enter:
   - **Email:** `anokhireet@gmail.com`
   - **Password:** `Reet@1432@1402`
3. Click **"Login"**

**✅ You should now be logged in!**

## Troubleshooting

### "User not found in auth.users"

- **Solution:** Complete Step 1 first (create user in Authentication)

### "Access denied. This account is not an admin"

- **Solution:** Complete Step 2 (run the SQL to add to admins table)

### "Invalid email or password"

- **Solution:**
  - Check if user exists in Authentication → Users
  - Make sure "Auto Confirm User" was checked
  - Try resetting password in Supabase Dashboard

### User exists but can't login

- **Check:** Run this query to verify:
  ```sql
  SELECT
      a.email,
      a.auth_user_id,
      au.id as auth_id,
      CASE
          WHEN a.auth_user_id = au.id THEN '✅ Ready'
          ELSE '❌ Not linked'
      END as status
  FROM admins a
  LEFT JOIN auth.users au ON a.auth_user_id = au.id
  WHERE a.email = 'anokhireet@gmail.com';
  ```

## Quick SQL (If you prefer manual)

```sql
-- Add admin user (replace YOUR_AUTH_USER_ID with actual ID from auth.users)
INSERT INTO admins (auth_user_id, email)
VALUES ('YOUR_AUTH_USER_ID', 'anokhireet@gmail.com')
ON CONFLICT (email) DO UPDATE
SET auth_user_id = EXCLUDED.auth_user_id;
```

## After Setup

Once both steps are complete:

- ✅ You can login at `/admin`
- ✅ You have full admin access
- ✅ You can manage users, products, categories, etc.
