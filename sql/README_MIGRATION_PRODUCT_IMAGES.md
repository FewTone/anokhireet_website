# Migration: Add Images, Primary Image Index, and Original Price Columns

## Problem
The application is trying to use `images`, `primary_image_index`, and `original_price` columns that don't exist in the `products` table, causing the error:
```
Could not find the 'images' column of 'products' in the schema cache
```

## Solution
Run the migration file `MIGRATION_PRODUCT_IMAGES.sql` in Supabase.

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to your **Supabase Dashboard**
- Click on **"SQL Editor"** in the left sidebar
- Click **"New Query"** button

### 2. Run the Migration
1. Open the file: `sql/MIGRATION_PRODUCT_IMAGES.sql`
2. **Copy ALL** the content (Ctrl+A / Cmd+A, then Ctrl+C / Cmd+C)
3. **Paste** it into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for it to complete (should take a few seconds)

### 3. Verify the Migration
Run the verification query:
1. Open `sql/VERIFY_PRODUCT_COLUMNS.sql`
2. Copy and paste it into SQL Editor
3. Run it
4. **Expected:** Should return 3 rows (one for each column: `images`, `primary_image_index`, `original_price`)

### 4. Refresh Schema Cache (IMPORTANT!)
After running the migration, Supabase's schema cache needs to refresh:

**Option A: Wait (Recommended)**
- Wait **1-2 minutes** for Supabase to automatically refresh the schema cache
- Then try saving the product again

**Option B: Force Refresh**
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Scroll down and click **"Refresh Schema Cache"** button (if available)
3. Or restart your Next.js development server

**Option C: Clear Browser Cache**
- Clear your browser cache or use an incognito/private window
- This helps if the client-side schema cache is stale

### 5. Test
After waiting 1-2 minutes:
1. Try editing a product again
2. Add/modify the original price
3. Save the product
4. The error should be gone!

## What the Migration Does

1. **Adds `images` column** (TEXT[] array) - Stores multiple image URLs
2. **Adds `primary_image_index` column** (INTEGER) - Index of the primary image
3. **Adds `original_price` column** (NUMERIC) - Original purchase price
4. **Migrates existing data** - Converts single `image` values to `images` array
5. **Sets default values** - Ensures `primary_image_index` is valid

## Troubleshooting

### Still Getting the Error After Running Migration?

1. **Verify columns exist:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'products' 
     AND column_name IN ('images', 'primary_image_index', 'original_price');
   ```
   Should return 3 rows.

2. **Check if migration ran successfully:**
   - Look for success message in SQL Editor
   - Check for any error messages

3. **Wait longer:**
   - Schema cache can take up to 5 minutes to refresh
   - Try again after waiting

4. **Restart your app:**
   - Stop your Next.js dev server
   - Clear `.next` folder: `rm -rf .next`
   - Restart: `npm run dev`

5. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any errors related to schema changes

## Notes

- The migration is **safe to run multiple times** (uses `IF NOT EXISTS` checks)
- Existing data is preserved and migrated automatically
- The `image` column (singular) is kept for backward compatibility

