# Create Storage Bucket - Quick Steps

The error "Storage bucket 'product-images' not found" means the bucket doesn't exist yet.

## Quick Fix (2 minutes)

### Step 1: Go to Supabase Dashboard
1. Open: https://app.supabase.com
2. Select your project

### Step 2: Create the Bucket
1. Click **"Storage"** in the left sidebar
2. Click **"New bucket"** button (green button, usually top right)
3. Fill in:
   - **Name**: `product-images` (exactly this, lowercase with hyphen)
   - ✅ **Check "Public bucket"** (VERY IMPORTANT!)
   - Leave other settings as default
4. Click **"Create bucket"**

### Step 3: Verify Bucket is Created
1. You should now see `product-images` in your buckets list
2. It should show "PUBLIC" tag next to it

### Step 4: Verify Policies (They Should Already Exist)
The storage policies are already set up! You should see 4 policies:
- Allow public read access (SELECT)
- Allow authenticated uploads (INSERT)  
- Allow authenticated updates (UPDATE)
- Allow authenticated deletes (DELETE)

If you don't see them, run the SQL from `FIX_STORAGE_POLICIES.md` Step 2.

### Step 5: Test Upload
1. Go back to your app
2. Try uploading an image again
3. It should work now! ✅

## That's It!

Once the bucket is created, image uploads will work immediately. The policies are already configured correctly.

## Troubleshooting

**If bucket creation fails:**
- Make sure you're logged into Supabase Dashboard
- Check you have the right project selected
- Try refreshing the page

**If upload still fails after creating bucket:**
- Make sure bucket is set to **Public**
- Check browser console (F12) for error details
- Verify you're logged in as admin






