# Test User Creation Troubleshooting

## Issue: Can't Create Test User from Admin Panel

### Step 1: Verify Database Table Exists

Run this SQL in Supabase SQL Editor to check if `test_users` table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'test_users';
```

**If table doesn't exist**, run the migration script:
- Open `CREATE_TEST_USERS_TABLE.sql`
- Copy and paste into Supabase SQL Editor
- Click "Run"

### Step 2: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try to create a test user
4. Look for any error messages
5. Common errors:
   - `relation "test_users" does not exist` → Table not created
   - `permission denied` → RLS policy issue
   - `duplicate key value` → Phone number already exists

### Step 3: Verify RLS Policies

If you see permission errors, check RLS policies:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'test_users';

-- If RLS is blocking, temporarily disable it (development only)
ALTER TABLE test_users DISABLE ROW LEVEL SECURITY;
```

### Step 4: Test the Modal

1. Go to Admin Panel → Users tab
2. Scroll down to "Test Users" section
3. Click "Create Test User" button
4. Modal should open
5. Fill in:
   - Name: "Test User"
   - Phone: "1234567890"
   - Password: "test123"
   - Email: (optional)
6. Click "Create Test User"

### Step 5: Check Network Tab

1. Open Developer Tools → Network tab
2. Try creating test user
3. Look for POST request to Supabase
4. Check response for errors

### Common Issues and Fixes

#### Issue: "relation test_users does not exist"
**Fix**: Run `CREATE_TEST_USERS_TABLE.sql` in Supabase SQL Editor

#### Issue: "permission denied for table test_users"
**Fix**: 
```sql
ALTER TABLE test_users DISABLE ROW LEVEL SECURITY;
-- OR update the policy to allow admin access
```

#### Issue: "duplicate key value violates unique constraint"
**Fix**: Phone number already exists. Use a different phone number or edit existing user.

#### Issue: Modal doesn't open
**Fix**: 
- Check browser console for JavaScript errors
- Verify `isTestUserModalOpen` state is being set
- Check if button click handler is connected

#### Issue: Form submits but nothing happens
**Fix**:
- Check browser console for errors
- Verify `handleCreateTestUser` function is called
- Check if Supabase connection is working
- Verify admin is authenticated

### Quick Test Query

Run this to verify table structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'test_users'
ORDER BY ordinal_position;
```

Expected columns:
- id (uuid)
- name (text)
- phone (text)
- password (text)
- email (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)



