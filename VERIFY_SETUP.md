# Verify Your Setup - Step by Step Checklist

If you're getting "Storage bucket 'product-images' not found" error, follow this checklist to verify everything is set up correctly.

## Step 1: Verify User Exists in Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Check if you see a user with email `anokhireet@gmail.com`
3. **If user doesn't exist:**
   - Click **"Add User"** or **"Invite User"**
   - Email: `anokhireet@gmail.com`
   - Password: `Reet@1432@1402`
   - ✅ Check **"Auto Confirm User"** (IMPORTANT!)
   - Click **"Create User"**

## Step 2: Verify User is in Users Table

1. Go to **Supabase Dashboard** → **Table Editor** → **users** table
2. Check if you see a row with:
   - `email`: `anokhireet@gmail.com`
   - `is_admin`: `true` ✅
3. **If user doesn't exist in users table:**
   - Go to **SQL Editor** → **New Query**
   - Run this SQL:

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

## Step 3: Verify Storage Bucket Exists

1. Go to **Supabase Dashboard** → **Storage**
2. Check if you see a bucket named `product-images` (or `PRODUCT-IMAGES`)
3. **If bucket doesn't exist:**
   - Click **"New bucket"**
   - Name: `product-images` (lowercase, with hyphen)
   - ✅ Check **"Public bucket"** (IMPORTANT!)
   - Click **"Create bucket"**

## Step 4: Verify Storage Policies

1. Go to **Storage** → Click on `product-images` bucket → **Policies** tab
2. You should see at least 4 policies:
   - Allow public read access (SELECT)
   - Allow authenticated uploads (INSERT)
   - Allow authenticated updates (UPDATE)
   - Allow authenticated deletes (DELETE)
3. **If policies don't exist or are wrong:**
   - Go to **SQL Editor** → **New Query**
   - Copy and paste the SQL from `FIX_STORAGE_POLICIES.md` Step 2
   - Click **"Run"**

## Step 5: Verify You're Logged In (In Your App)

1. Open your app: `localhost:3000/admin`
2. **Check if you see:**
   - ✅ "Logout" button in the top right
   - ✅ Dashboard/Products/Users tabs
   - ✅ No login form
3. **If you see login form:**
   - Enter email: `anokhireet@gmail.com`
   - Enter password: `Reet@1432@1402`
   - Click **"Login"**
   - You should now see the admin dashboard

## Step 6: Check Browser Console

1. Open your app: `localhost:3000/admin`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try uploading an image
5. **Look for these messages:**
   - `User authenticated: anokhireet@gmail.com` ✅
   - `Available buckets: [...]` ✅
   - Any error messages ❌

## Step 7: Verify Environment Variables

1. Check if `.env.local` file exists in your project root
2. Open `.env.local` and verify it has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **To get these values:**
   - Go to Supabase Dashboard → **Settings** → **API**
   - Copy **"Project URL"** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **"anon public"** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **After updating `.env.local`:**
   - **Stop your dev server** (Ctrl+C)
   - **Restart it**: `npm run dev`
   - This is IMPORTANT - environment variables only load on server start!

## Common Issues & Solutions

### Issue: "You are not logged in"
**Solution:**
- Make sure you're on `/admin` page
- Log in with admin credentials
- Check browser console for authentication errors

### Issue: "Storage bucket 'product-images' not found"
**Solution:**
- Go to Supabase Dashboard → Storage
- Check if bucket exists
- If it exists but named differently (e.g., `PRODUCT-IMAGES`), either:
  - Delete it and create new one named `product-images` (lowercase)
  - Or the code will now handle both cases

### Issue: "new row violates row-level security policy"
**Solution:**
- Your storage policies don't have authentication checks
- Follow `FIX_STORAGE_POLICIES.md` to update policies

### Issue: "No buckets found"
**Solution:**
- You might not be authenticated
- Check Step 5 above
- Check browser console for authentication errors

### Issue: Environment variables not working
**Solution:**
- Make sure file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Make sure it's in the project root (same folder as `package.json`)
- **Restart your dev server** after changing `.env.local`

## Quick Test

After completing all steps:

1. Go to `localhost:3000/admin`
2. Make sure you see "Logout" button (you're logged in)
3. Go to **Users** tab
4. Click **"Manage Products"** on any user
5. Click **"Add User Product"** (or edit existing)
6. Select an image file
7. Fill in product name and price
8. Click **"Add Product"**
9. **It should work!** ✅

## Still Having Issues?

1. **Check browser console** (F12) for detailed error messages
2. **Check Supabase logs**: Dashboard → Logs → API logs
3. **Verify each step** in this checklist one by one
4. **Make sure you restarted dev server** after changing `.env.local`

## Summary Checklist

- [ ] User exists in Supabase Auth (`anokhireet@gmail.com`)
- [ ] User exists in `users` table with `is_admin = true`
- [ ] Storage bucket `product-images` exists
- [ ] Bucket is set to **Public**
- [ ] 4 storage policies exist (with authentication checks)
- [ ] You're logged in as admin in the app (see "Logout" button)
- [ ] `.env.local` file exists with correct values
- [ ] Dev server was restarted after creating/updating `.env.local`
- [ ] Tried uploading an image

If all checked, it should work! 🎉









