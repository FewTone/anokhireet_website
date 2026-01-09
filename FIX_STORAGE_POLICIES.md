# Fix Storage Policies - Step by Step

If you're getting "new row violates row-level security policy" error, your policies need to include authentication checks.

## Quick Fix: Update Your Policies

### Step 1: Delete Old Policies (if they exist)

1. Go to **Supabase Dashboard** → **Storage**
2. Click on **`product-images`** bucket
3. Click on **"Policies"** tab
4. **Delete ALL existing policies** (click the trash icon on each one)
   - This is safe - we'll recreate them correctly

### Step 2: Create New Policies with Authentication

Go to **SQL Editor** → **New Query** → Copy and paste this:

```sql
-- First, drop any existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Policy 1: Allow public read access (anyone can view images)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated uploads (ONLY logged-in users can upload)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated updates
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

-- Policy 4: Allow authenticated deletes
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);
```

5. Click **"Run"**
6. You should see "Success" for each policy

### Step 3: Verify Bucket Name

**IMPORTANT**: Make sure your bucket is named exactly `product-images` (lowercase, with hyphen)

1. Go to **Storage** → Check your bucket name
2. If it's `PRODUCT-IMAGES` (uppercase), you have two options:
   - **Option A**: Delete it and create a new one named `product-images` (lowercase)
   - **Option B**: Keep it, but the code will now handle both cases

### Step 4: Verify You're Logged In

1. Go to your app: `localhost:3000/admin`
2. Make sure you see "Logout" button (this means you're logged in)
3. If you're not logged in, log in first!

### Step 5: Test Upload

1. Try uploading an image again
2. Check browser console (F12) for any errors
3. The upload should work now! ✅

## Common Issues

### Issue: "Bucket not found"
- **Solution**: Check bucket name is exactly `product-images` (lowercase)
- Go to Storage → Check the bucket exists
- If it's uppercase, either rename it or the code will now handle it

### Issue: "new row violates row-level security policy"
- **Solution**: Your policies don't have authentication checks
- Follow Step 2 above to recreate policies with `auth.role() = 'authenticated'`

### Issue: Policies already exist
- **Solution**: Use the DROP POLICY commands in Step 2 to delete old ones first
- Or manually delete them in the Storage UI, then create new ones

### Issue: Still not working after fixing policies
1. **Check browser console** (F12) - look for detailed error messages
2. **Verify you're logged in**: Check if you see "Logout" button in admin page
3. **Check Supabase logs**: Dashboard → Logs → API logs
4. **Try logging out and back in** to refresh your session

## Verification Checklist

- [ ] Bucket exists and is named `product-images` (or `PRODUCT-IMAGES`)
- [ ] Bucket is set to **Public**
- [ ] 4 policies created with authentication checks (`auth.role() = 'authenticated'`)
- [ ] You are logged in as admin (see "Logout" button)
- [ ] Tried uploading an image

If all checked, it should work! 🎉










