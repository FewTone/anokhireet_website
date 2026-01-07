# Fix Existing User Setup

Since the user already exists in Supabase Auth, you just need to verify and fix the setup.

## Step 1: Verify User Exists in Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. You should see `anokhireet@gmail.com` in the list ✅
3. **If you see it:** Great! The user exists. Skip to Step 2.
4. **If you don't see it:** The error might be misleading. Try refreshing the page.

## Step 2: Get the User ID

1. In the **Users** list, click on `anokhireet@gmail.com`
2. **Copy the User UID** (it's a long string like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Keep this handy - you'll need it for Step 3

## Step 3: Add User to Users Table (Make Them Admin)

1. Go to **SQL Editor** → **New Query**
2. Copy and paste this SQL:

```sql
-- First, check if user exists in users table
SELECT * FROM users WHERE email = 'anokhireet@gmail.com';

-- If the above returns nothing, run this to insert:
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
```

3. Click **"Run"**
4. You should see "Success" or "1 row inserted" or "1 row updated"

## Step 4: Verify User is Admin

1. Go to **Table Editor** → **users** table
2. Find the row with `email = 'anokhireet@gmail.com'`
3. Check that `is_admin` column shows `true` ✅
4. **If `is_admin` is `false` or `null`:**
   - Run this SQL:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'anokhireet@gmail.com';
```

## Step 5: Reset Password (If Needed)

If you don't remember the password or it's not working:

1. Go to **Authentication** → **Users**
2. Click on `anokhireet@gmail.com`
3. Click **"Reset Password"** or **"Send Password Reset Email"**
4. Or manually set a new password:
   - Scroll down to **"Set Password"** section
   - Enter new password: `Reet@1432@1402`
   - Click **"Update"**

## Step 6: Verify Storage Setup

Make sure storage is set up:

1. **Storage Bucket:**
   - Go to **Storage**
   - Check if `product-images` bucket exists
   - If not, create it (name: `product-images`, check "Public bucket")

2. **Storage Policies:**
   - Go to **Storage** → `product-images` → **Policies**
   - You should see 4 policies
   - If not, follow `FIX_STORAGE_POLICIES.md`

## Step 7: Test Login

1. Go to your app: `localhost:3000/admin`
2. Try logging in with:
   - Email: `anokhireet@gmail.com`
   - Password: `Reet@1432@1402` (or the password you set)
3. **If login fails:**
   - Check browser console (F12) for errors
   - Make sure `.env.local` has correct Supabase credentials
   - Make sure dev server was restarted after creating `.env.local`

## Step 8: Test Image Upload

1. After logging in, go to **Users** tab
2. Click **"Manage Products"** on any user
3. Click **"Add User Product"** or edit existing
4. Try uploading an image
5. **It should work now!** ✅

## Troubleshooting

### Issue: "User not found in database" when logging in
**Solution:**
- Run Step 3 SQL to add user to users table
- Make sure `is_admin = true`

### Issue: "Access denied. This account is not an admin"
**Solution:**
- Run Step 4 SQL to set `is_admin = true`
- Log out and log back in

### Issue: "Invalid email or password"
**Solution:**
- Reset password (Step 5)
- Make sure you're using the correct email
- Check if user is confirmed (should be if created via dashboard)

### Issue: Can't see user in users table
**Solution:**
- Run the INSERT SQL from Step 3
- Make sure the user exists in `auth.users` first

## Quick SQL to Fix Everything

Run this in **SQL Editor** to fix everything at once:

```sql
-- Make sure user is in users table and is admin
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
SELECT id, name, email, is_admin FROM users WHERE email = 'anokhireet@gmail.com';
```

You should see a row with `is_admin = true` ✅

## Summary

Since the user already exists in Auth:
- ✅ User exists in Supabase Auth (you saw the error, so it exists)
- ⚠️ Need to add to users table (Step 3)
- ⚠️ Need to set is_admin = true (Step 4)
- ⚠️ Need to verify storage setup (Step 6)

After completing these steps, you should be able to log in and upload images!







