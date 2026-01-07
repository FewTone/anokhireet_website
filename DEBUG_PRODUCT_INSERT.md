# Debugging Product Insert Error

## Issue
Getting empty error object `{}` when trying to create a new product.

## Possible Causes

### 1. **RLS Policy Missing WITH CHECK Clause** ⚠️ MOST LIKELY
The RLS policy for products table needs a `WITH CHECK` clause for INSERT operations.

**Fix:** Run this SQL in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "admin manage products" ON products;

CREATE POLICY "admin manage products"
ON products FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);
```

### 2. **Supabase Not Properly Configured**
Check your `.env.local` file exists and has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To get these values:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**After updating `.env.local`:**
- Stop your dev server (Ctrl+C)
- Restart: `npm run dev`

### 3. **Admin Not Properly Set Up**
Verify admin user exists in `admins` table:

```sql
SELECT * FROM admins;
```

Should show your admin user with `auth_user_id` matching your Supabase Auth user ID.

### 4. **Products Table Structure**
Verify the products table has all required columns:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Required columns:
- `id` (UUID)
- `owner_user_id` (UUID, NOT NULL)
- `title` (TEXT, NOT NULL)
- `category_id` (UUID, nullable)
- `price_per_day` (NUMERIC, nullable)
- `is_active` (BOOLEAN, default true)

## Diagnostic Steps

1. **Check Browser Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try creating a product
   - Look for these messages:
     - `🔍 Testing Supabase connection...`
     - `Current Supabase session:`
     - `Admin check result:`
     - `Inserting product data:`
     - `Insert response:`

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Try creating a product
   - Look for POST request to `/rest/v1/products`
   - Check:
     - Status code (should be 201 for success, 400/401/403 for errors)
     - Response body
     - Request headers (should include `Authorization`)

3. **Verify Admin Session**
   The code now logs:
   - Current auth session user ID
   - Admin verification result
   
   If admin check fails, you'll see:
   `Permission denied. Only admins can create products.`

4. **Test RLS Policy**
   Run in Supabase SQL Editor:
   ```sql
   -- Check if admin policy exists
   SELECT * FROM pg_policies 
   WHERE tablename = 'products' 
   AND policyname = 'admin manage products';
   ```

## Enhanced Error Handling

The code now includes:
- Connection test on page load
- Admin session verification before insert
- Detailed error logging
- Validation of required fields

## Next Steps

1. **Run the SQL fix** (RLS policy) - this is most likely the issue
2. **Check console logs** - they'll show exactly what's happening
3. **Verify environment variables** - make sure Supabase is configured
4. **Restart dev server** - if you changed `.env.local`

## Common Error Messages & Solutions

- **"No active session"** → Log in as admin first
- **"Permission denied. Only admins can create products"** → Admin not found in `admins` table
- **"Product name/title is required"** → Fill in the product name field
- **"Product insert returned no data"** → RLS policy issue (run SQL fix above)
- **Empty error `{}`** → Usually RLS policy missing `WITH CHECK` clause

