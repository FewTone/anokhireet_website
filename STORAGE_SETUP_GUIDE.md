# Supabase Storage Setup Guide - Step by Step

This guide will help you set up the storage bucket and policies needed for image uploads.

## Step 1: Create the Storage Bucket

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (the one you're using for this app)
3. **Click "Storage"** in the left sidebar (it's usually near the bottom)
4. **Click the "New bucket" button** (usually a green button in the top right)
5. **Fill in the bucket details**:
   - **Name**: `product-images` (must be exactly this name, lowercase with hyphen)
   - **Public bucket**: ✅ **CHECK THIS BOX** (This is VERY IMPORTANT!)
   - Leave other settings as default
6. **Click "Create bucket"**
7. You should now see `product-images` in your buckets list

## Step 2: Create Storage Policies (RLS Policies)

After creating the bucket, you need to set up policies to allow:

- Public read access (so images can be viewed)
- Authenticated uploads (so logged-in admins can upload)

### Option A: Using SQL Editor (Recommended - Faster)

1. **Go to "SQL Editor"** in the left sidebar
2. **Click "New Query"**
3. **Copy and paste ALL of the following SQL**:

```sql
-- Policy 1: Allow public read access (anyone can view images)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated uploads (only logged-in users can upload)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated updates (for editing products)
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated deletes (for deleting products)
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);
```

4. **Click "Run"** (or press Ctrl+Enter / Cmd+Enter)
5. You should see "Success" messages for each policy

### Option B: Using Storage UI (Visual Method)

1. **Go back to "Storage"** in the left sidebar
2. **Click on the `product-images` bucket** to open it
3. **Click on the "Policies" tab** (at the top of the bucket page)
4. **Click "New Policy"** → **"For full customization"**

#### Create Policy 1: Public Read Access

- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**: Copy and paste this:

```sql
bucket_id = 'product-images'
```

- Click **"Review"** then **"Save policy"**

#### Create Policy 2: Authenticated Uploads

- **Click "New Policy"** again → **"For full customization"**
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**: Copy and paste this:

```sql
bucket_id = 'product-images'
```

- Click **"Review"** then **"Save policy"**

#### Create Policy 3: Authenticated Updates

- **Click "New Policy"** again → **"For full customization"**
- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **⚠️ Note**: Supabase will automatically check SELECT as well (this is required for UPDATE)
- **Policy definition**: Copy and paste this:

```sql
bucket_id = 'product-images'
```

- Click **"Review"** then **"Save policy"**
- **You might see 2 policies created** (one for UPDATE, one for SELECT) - this is normal!

#### Create Policy 4: Authenticated Deletes

- **Click "New Policy"** again → **"For full customization"**
- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **⚠️ Note**: Supabase will automatically check SELECT as well (this is required for DELETE)
- **Policy definition**: Copy and paste this:

```sql
bucket_id = 'product-images'
```

- Click **"Review"** then **"Save policy"**
- **You might see 2 policies created** (one for DELETE, one for SELECT) - this is normal!

## Step 3: Verify the Setup

1. **Go to Storage** → **Click on `product-images` bucket**
2. **Click on "Policies" tab**
3. You should see **at least 4 policies** listed (you might see 5-6, which is fine - see note below):
   - Allow public read access (SELECT)
   - Allow authenticated uploads (INSERT)
   - Allow authenticated updates (UPDATE)
   - Allow authenticated deletes (DELETE)

### ⚠️ Important Note About Policy Count

**Why you might see 5-6 policies instead of 4:**

When you create UPDATE or DELETE policies through the Supabase UI, it automatically creates SELECT policies as well because:

- **UPDATE** requires SELECT (you need to read before updating)
- **DELETE** requires SELECT (you need to read before deleting)

This is **normal behavior** and **completely fine**! The extra SELECT policies are redundant if you already have "Allow public read access", but they won't cause any problems.

**If you want to clean up duplicates:**

- You can delete the extra SELECT policies that were auto-created for UPDATE/DELETE
- Keep only: "Allow public read access" (SELECT), "Allow authenticated uploads" (INSERT), "Allow authenticated updates" (UPDATE), and "Allow authenticated deletes" (DELETE)
- Or just leave them - having extra SELECT policies is harmless

## Step 4: Test Image Upload

1. **Go back to your app** (localhost:3000/admin)
2. **Make sure you're logged in as admin**
3. **Try uploading an image** in the "Add User Product" form
4. **The upload should now work!** ✅

## Troubleshooting

### Error: "Storage bucket 'product-images' not found"

- **Solution**: Make sure you created the bucket with the exact name `product-images` (lowercase, with hyphen)
- Go to Storage → Check if the bucket exists
- If it doesn't exist, create it following Step 1

### Error: "new row violates row-level security policy"

- **Solution**: The storage policies are missing or incorrect
- Go to Storage → Click on `product-images` → Policies tab
- Make sure all 4 policies are created (see Step 2)
- If policies exist but still not working, delete them and recreate using the SQL method (Option A)

### Error: "Bucket not found" even though it exists

- **Solution**: Make sure the bucket name is exactly `product-images` (case-sensitive, with hyphen)
- Check in Storage → Buckets list

### Images upload but don't display

- **Solution**: Make sure the bucket is set to **Public**
- Go to Storage → Click on `product-images` → Settings
- Check that "Public bucket" is enabled

### Still having issues?

1. **Check browser console** (F12) for detailed error messages
2. **Verify you're logged in** as admin (check the admin dashboard)
3. **Check Supabase logs**: Go to Supabase Dashboard → Logs → API logs
4. **Make sure your `.env.local` file** has the correct Supabase credentials

## Quick Checklist

- [ ] Storage bucket `product-images` created
- [ ] Bucket is set to **Public**
- [ ] Storage policies created (at least SELECT, INSERT, UPDATE, DELETE - having 5-6 is fine!)
- [ ] Logged in as admin in the app
- [ ] Tried uploading an image

If all checkboxes are checked, image uploads should work! 🎉

## Understanding Your Current Setup

Based on your screenshot, you have **6 policies** which is **perfectly fine**! Here's what they do:

1. **Allow public read access** (SELECT) - ✅ Needed for viewing images
2. **Allow authenticated uploads** (INSERT) - ✅ Needed for uploading images
3. **Allow authenticated updates** (UPDATE) - ✅ Needed for editing products
4. **Allow authenticated updates** (SELECT) - Auto-created, redundant but harmless
5. **Allow authenticated deletes** (DELETE) - ✅ Needed for deleting products
6. **Allow authenticated deletes** (SELECT) - Auto-created, redundant but harmless

**Your setup is correct!** The extra SELECT policies don't hurt anything. If you want to clean them up, you can delete policies #4 and #6, but it's not necessary.
