# Run This in Supabase SQL Editor

Since I cannot directly access your Supabase instance, please follow these steps:

## Step 1: Open Supabase SQL Editor

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

## Step 2: Run the Complete Setup Script

1. Open the file `COMPLETE_SUPABASE_SETUP.sql` in your project
2. **Copy the entire contents** of that file
3. **Paste it into the SQL Editor** in Supabase
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

This script will:
- ✅ Create all tables (users, products, user_products)
- ✅ Create indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create proper RLS policies:
  - Public can read products (for home page)
  - Users can view their own products (read-only)
  - Only admins can manage (add/edit/delete) products and user products
  - Only admins can create/manage users

## Step 3: Create Admin User in Auth

1. Go to **Authentication** → **Users**
2. Click **"Add User"**
3. Fill in:
   - **Email**: `anokhireet@gmail.com`
   - **Password**: `Reet@1432@1402`
   - ✅ Check **"Auto Confirm User"**
4. Click **"Create User"**

## Step 4: Add Admin to Users Table

The SQL script will automatically add the admin user to the users table. If it doesn't work, run this separately:

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

## Step 5: Set Up Storage

1. Go to **Storage** → **New bucket**
2. Name: `product-images`
3. ✅ Check **"Public bucket"**
4. Click **"Create bucket"**

Then run the storage policies from `FIX_STORAGE_POLICIES.md` Step 2.

## Step 6: Verify Everything

After running the SQL script, you should see:
- ✅ 3 tables created: `users`, `products`, `user_products`
- ✅ RLS enabled on all tables
- ✅ Policies created for each table
- ✅ Admin user in users table with `is_admin = true`

## What the Policies Do

### Products Table:
- **Public Read**: Anyone can view products (for home page)
- **Admin Only**: Only admins can add/edit/delete products

### User Products Table:
- **User Read**: Users can view their own products (read-only)
- **Admin Read**: Admins can view all user products
- **Admin Only**: Only admins can add/edit/delete user products

### Users Table:
- **User Read**: Users can view their own profile
- **Admin Read**: Admins can view all users
- **Admin Only**: Only admins can create/update users

## Troubleshooting

If you get errors:
- **"table already exists"**: That's fine, the script uses `IF NOT EXISTS`
- **"policy already exists"**: The script drops old policies first, but if you get this error, manually delete the policy in Supabase Dashboard → Table Editor → Policies tab
- **"user not found"**: Make sure you created the user in Auth first (Step 3)

## Summary

The SQL script sets up everything based on your requirements:
- ✅ Public products visible to everyone on home page
- ✅ Users can view their own products (read-only)
- ✅ Only admins can manage all products
- ✅ Only admins can create user accounts

Run `COMPLETE_SUPABASE_SETUP.sql` in Supabase SQL Editor and you're done! 🎉






