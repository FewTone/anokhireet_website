# How to Run the Migration in Supabase

## ⚠️ IMPORTANT: You Must Run the SQL Migration!

The schema changes are in the SQL file, but **they won't appear in Supabase until you run the migration**.

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your **Supabase Dashboard**
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Copy the Migration SQL

1. Open the file: `CHATGPT_SCHEMA_MIGRATION.sql` in your project
2. **Select ALL** the content (Ctrl+A / Cmd+A)
3. **Copy** it (Ctrl+C / Cmd+C)

### Step 3: Paste and Run

1. **Paste** the SQL into the Supabase SQL Editor
2. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait for it to complete (should take a few seconds)

### Step 4: Verify the Migration

After running, you should see:
- ✅ Success message
- ✅ List of tables created
- ✅ RLS policies created

### Step 5: Check Schema Visualizer

1. Go to **"Table Editor"** in Supabase Dashboard
2. You should now see:
   - ✅ `admins` table (NEW)
   - ✅ `categories` table (NEW)
   - ✅ `inquiries` table (NEW)
   - ✅ `chats` table (NEW)
   - ✅ `messages` table (NEW)
   - ✅ Updated `users` table (with `auth_user_id` instead of `auth_uid`)
   - ✅ `products` table (migrated from `user_products`)

## Quick Verification Query

Run this to check if migration ran:

```sql
-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admins', 'categories', 'inquiries', 'chats', 'messages')
ORDER BY table_name;
```

**Expected:** Should return 5 rows (one for each new table)

## If Migration Fails

### Common Errors:

1. **"relation already exists"**
   - Some tables might already exist
   - The migration uses `CREATE TABLE IF NOT EXISTS` so this is usually safe to ignore

2. **"column already exists"**
   - Some columns might already be in the users table
   - Check the error message and adjust if needed

3. **"permission denied"**
   - Make sure you're using the SQL Editor (not a restricted view)
   - You need proper database permissions

### Partial Migration

If some parts fail, you can:
1. Check which tables were created
2. Run individual CREATE statements for missing tables
3. Or modify the migration script to skip existing objects

## After Migration

Once migration is complete:
1. ✅ Schema Visualizer will show all new tables
2. ✅ You can add the admin user (run `SETUP_ADMIN_USER.sql`)
3. ✅ Your app code will work with the new schema

## Still Not Working?

If you've run the migration but still don't see changes:

1. **Refresh** the Supabase Dashboard
2. **Clear browser cache** and refresh
3. Check **Table Editor** (not just Schema Visualizer)
4. Run the verification query above

Let me know what error messages you see (if any) when running the migration!

