# ⚠️ URGENT: Fix "images column not found" Error

## The Problem
You're seeing this error:
```
Could not find the 'images' column of 'products' in the schema cache
```

This means the database columns don't exist yet. You **MUST** run the migration first.

## ✅ SOLUTION (Follow These Steps EXACTLY)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar (it has a database icon)

### Step 2: Create New Query
1. Click the **"New Query"** button (top right)
2. You'll see a blank SQL editor

### Step 3: Copy the Migration SQL
1. Open this file in your project: `sql/QUICK_FIX_ADD_IMAGES_COLUMN.sql`
2. **Select ALL** the text (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)

### Step 4: Paste and Run
1. **Paste** the SQL into the Supabase SQL Editor (Ctrl+V or Cmd+V)
2. Click the **"Run"** button (green button, or press Ctrl+Enter / Cmd+Enter)
3. **Wait** for it to finish (should take 2-5 seconds)

### Step 5: Verify Success
After running, scroll down. You should see a results table with **3 rows**:
- `images` (data_type: ARRAY)
- `original_price` (data_type: numeric)  
- `primary_image_index` (data_type: integer)

✅ **If you see 3 rows = Migration successful!**

❌ **If you see 0 rows or an error = Something went wrong**

### Step 6: Wait for Cache Refresh
**IMPORTANT:** After running the migration:
1. **Wait 2-3 minutes** (Supabase needs to refresh its schema cache)
2. **OR** restart your Next.js server:
   - Stop it (Ctrl+C in terminal)
   - Run `npm run dev` again

### Step 7: Test
1. Go back to your admin panel
2. Try editing a product
3. Save it
4. The error should be **GONE** ✅

---

## 🔍 Still Not Working?

### Check 1: Verify Columns Exist
Run this in Supabase SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('images', 'primary_image_index', 'original_price');
```

**Expected:** 3 rows  
**If 0 rows:** Migration didn't run - try Step 3-4 again

### Check 2: Check for Errors
- Look at the SQL Editor output after running
- If you see red error messages, copy them and check what went wrong

### Check 3: Wait Longer
- Schema cache can take up to 5 minutes
- Try waiting 5 minutes, then test again

### Check 4: Restart Everything
1. Stop your Next.js server (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart server: `npm run dev`
4. Try again

---

## 📝 What the Migration Does

The migration adds 3 new columns to your `products` table:
1. **`images`** - Array to store multiple image URLs
2. **`primary_image_index`** - Which image is the main one
3. **`original_price`** - Original purchase price

These columns are required for the product editing feature to work.

---

## ⚡ Quick Copy-Paste SQL

If you can't find the file, here's the SQL to copy:

```sql
-- Add images column
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add primary_image_index column
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;

-- Add original_price column
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Migrate existing data
UPDATE products
SET images = ARRAY[image]
WHERE image IS NOT NULL 
  AND image != ''
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Set defaults
UPDATE products
SET primary_image_index = 0
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND (primary_image_index IS NULL OR primary_image_index < 0);

-- Verify (should return 3 rows)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name IN ('images', 'primary_image_index', 'original_price')
ORDER BY column_name;
```

Copy the entire block above and paste it into Supabase SQL Editor, then click Run.

