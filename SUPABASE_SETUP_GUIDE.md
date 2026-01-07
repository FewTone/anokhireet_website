# Supabase Setup Guide - Step by Step

## Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (the one with URL: https://xtmatyafdmqchkwwbtfa.supabase.co)
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the entire contents of `supabase-migration.sql` file
6. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
7. You should see "Success. No rows returned" - this means tables were created!

## Step 2: Create Admin User in Supabase Auth

1. In Supabase Dashboard, click **"Authentication"** in the left sidebar
2. Click **"Users"** tab
3. Click the **"Add User"** button (or "Invite User" button)
4. Fill in the form:
   - **Email**: `anokhireet@gmail.com`
   - **Password**: `Reet@1432@1402`
   - **Auto Confirm User**: ✅ Check this box (IMPORTANT!)
5. Click **"Create User"** or **"Send Invitation"**
6. **IMPORTANT**: After the user is created, note down the **User UID** (you'll see it in the users list)

## Step 3: Add Admin User to Users Table

1. Go back to **"SQL Editor"** in Supabase Dashboard
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
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

4. Click **"Run"**
5. You should see "Success. 1 row inserted" or similar

## Step 4: Create Storage Bucket for Product Images

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"** button
3. Fill in the form:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Check this box (IMPORTANT! This allows public access to images)
4. Click **"Create bucket"**
5. After creating the bucket, click on it to open bucket settings
6. Go to **"Policies"** tab
7. Click **"New Policy"** → **"For full customization"**
8. Name it: `Allow public read access`
9. Use this SQL:

```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
```

10. Click **"Review"** then **"Save policy"**
11. Create another policy for uploads:
    - Name: `Allow authenticated uploads`
    - Use this SQL:

```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');
```

12. Click **"Review"** then **"Save policy"**

## Step 5: Verify Everything Works

1. Go to **"Table Editor"** in Supabase Dashboard
2. Click on **"users"** table
3. You should see your admin user with `is_admin: true`
4. Now try logging in to `/admin` page with:
   - Email: `anokhireet@gmail.com`
   - Password: `Reet@1432@1402`

## Troubleshooting

### If you get "table already exists" error:

- That's fine! The tables are already created. Skip Step 1.

### If you get "user already exists" error in Auth:

- The user is already created. Just proceed to Step 3.

### If you get "duplicate key" error in Step 3:

- The user is already in the users table. Run this to make sure they're admin:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'anokhireet@gmail.com';
```

### If login still doesn't work:

- Make sure you restarted your dev server after creating `.env.local`
- Check browser console (F12) for detailed errors
- Verify the user exists in both `auth.users` and `public.users` tables

### If image upload fails:

- Make sure the `product-images` bucket exists in Storage
- Verify the bucket is set to **Public**
- Check that storage policies are created correctly
- Make sure you're logged in as admin (authenticated uploads require authentication)
