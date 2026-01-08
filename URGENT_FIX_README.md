# 🚨 URGENT: Fix "images column not found" Error

## The Problem
You're getting this error when creating or editing products:
```
Could not find the 'images' column of 'products' in the schema cache
```

**This means the database columns don't exist yet. You MUST run the migration.**

---

## ✅ SOLUTION (5 Minutes)

### Step 1: Open Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** (left sidebar, database icon)

### Step 2: Create New Query
- Click **"New Query"** button (top right)

### Step 3: Copy This SQL
**Copy ALL of this:**
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
UPDATE products SET images = ARRAY[image] WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR array_length(images, 1) IS NULL);
UPDATE products SET primary_image_index = 0 WHERE images IS NOT NULL AND array_length(images, 1) > 0 AND (primary_image_index IS NULL OR primary_image_index < 0);
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('images', 'primary_image_index', 'original_price') ORDER BY column_name;
```

### Step 4: Paste and Run
1. **Paste** the SQL above into the editor
2. Click **"Run"** (green button, or press Ctrl+Enter)
3. **Wait** 5-10 seconds

### Step 5: Check Results
Scroll down - you should see a table with **3 rows**:
- `images` (ARRAY)
- `original_price` (numeric)
- `primary_image_index` (integer)

✅ **3 rows = Success!**  
❌ **0 rows = Error - try again**

### Step 6: Wait and Restart
1. **Wait 2-3 minutes** (Supabase needs to refresh cache)
2. **Restart your Next.js server:**
   - Press `Ctrl+C` in terminal to stop
   - Run `npm run dev` to restart

### Step 7: Test
- Try creating a new product
- Try editing an existing product
- **Error should be GONE!** ✅

---

## 📁 Alternative: Use the File

If you prefer, open `sql/QUICK_FIX_ADD_IMAGES_COLUMN.sql` and copy all content from there.

---

## ❓ Still Not Working?

### Check 1: Did migration run?
Run this in Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'primary_image_index', 'original_price');
```
**Expected:** 3 rows  
**If 0 rows:** Migration didn't run - try Step 3-4 again

### Check 2: Wait longer
- Schema cache can take up to 5 minutes
- Wait 5 minutes, then test again

### Check 3: Restart everything
1. Stop Next.js (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart: `npm run dev`
4. Try again

---

## 📝 What This Does

Adds 3 new columns to your `products` table:
- `images` - Array for multiple image URLs
- `primary_image_index` - Which image is primary
- `original_price` - Original purchase price

These are **required** for the product features to work.

