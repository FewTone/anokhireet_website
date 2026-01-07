# ChatGPT Schema Migration Guide

## ✅ Migration Complete!

This guide explains the changes made to migrate to the ChatGPT schema.

## 📋 What Changed

### 1. Database Schema
- ✅ Created separate `admins` table (replaces `is_admin` flag)
- ✅ Updated `users` table to use `auth_user_id` instead of `auth_uid`
- ✅ Added `role` field to users (owner/renter)
- ✅ Created `categories` table
- ✅ Migrated `user_products` to `products` table
- ✅ Created `inquiries`, `chats`, and `messages` tables for rental features

### 2. Code Updates
- ✅ Admin authentication now checks `admins` table
- ✅ All `auth_uid` references changed to `auth_user_id`
- ✅ All `is_admin` checks removed (admins are in separate table)
- ✅ User creation uses new RLS policy "user create self profile"

## 🚀 Next Steps

### Step 1: Run the Migration SQL
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `CHATGPT_SCHEMA_MIGRATION.sql`
3. Run the migration
4. Verify all tables were created

### Step 2: Migrate Existing Admins
The migration script will automatically move existing admins from `users.is_admin = true` to the `admins` table.

**Important:** Make sure your admin users have their `auth_user_id` set correctly in the `users` table before running the migration.

### Step 3: Update Admin Users
After migration, verify admins exist in the `admins` table:

```sql
SELECT * FROM admins;
```

If any admins are missing, add them manually:

```sql
INSERT INTO admins (auth_user_id, email)
SELECT auth_user_id, email
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (email) DO NOTHING;
```

### Step 4: Test Authentication
1. Test admin login at `/admin`
2. Test user login at `/profile`
3. Test user registration (new users can create their own profile)

## 🔐 RLS Policy Added

The requested RLS policy has been added:

```sql
CREATE POLICY "user create self profile"
ON users FOR INSERT
WITH CHECK (auth_user_id = auth.uid());
```

This allows users to create their own profile when they authenticate via OTP.

## ⚠️ Important Notes

1. **Product Migration**: The migration script migrates data from `user_products` to `products`, but you may need to update your frontend code to use the new `products` table structure.

2. **Test OTP**: Your test OTP "000000" should still work, but it now requires creating a proper Supabase Auth session.

3. **Admin Access**: Admins are now in a separate table. Make sure all admin users are migrated correctly.

## 🐛 Troubleshooting

### Admin Login Not Working
- Check if admin exists in `admins` table
- Verify `auth_user_id` matches the Supabase Auth user ID
- Check browser console for errors

### User Registration Failing
- Verify RLS policy "user create self profile" exists
- Check that `auth_user_id = auth.uid()` in the insert
- Verify user has authenticated via OTP first

### Products Not Showing
- Check if products were migrated from `user_products` to `products`
- Update frontend queries to use `products` table instead of `user_products`
- Verify RLS policies allow reading products

## 📝 Files Changed

- `src/app/admin/page.tsx` - Updated to use `admins` table
- `src/app/profile/page.tsx` - Updated to use `auth_user_id` and new RLS policy
- `CHATGPT_SCHEMA_MIGRATION.sql` - Complete migration script

## 🔄 Rollback Plan

If you need to rollback:

1. Restore database from backup
2. Revert code changes using git
3. The old schema will work with the reverted code

**Note:** Always backup your database before running migrations!

