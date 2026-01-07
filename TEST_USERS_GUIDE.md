# ⚠️ WARNING: DEVELOPMENT ONLY - REMOVE BEFORE PRODUCTION

# Test Users System - Complete Guide

## ⚠️ CRITICAL REMINDER
**This test user system MUST be completely removed before going live/production.**
See `REMOVE_TEST_USERS_BEFORE_LIVE.md` for removal instructions.

## Overview
A test user system has been added that allows you to create users that can login with phone number and password **without OTP verification**. This is useful for development and testing when you don't have OTP/SMS configured.

## Database Setup

### Step 1: Create `test_users` Table
Run the SQL script in Supabase SQL Editor:

```sql
-- See CREATE_TEST_USERS_TABLE.sql
```

This creates:
- `test_users` table with: `id`, `name`, `phone`, `password`, `email`, `created_at`, `updated_at`
- Index on `phone` for faster lookups
- RLS policies (currently allows all operations)

## Admin Panel - Test Users Section

### Location
- Go to **Admin Panel** → **Users** tab
- Scroll down to see **"Test Users"** section (below regular users table)

### Create Test User
1. Click **"Create Test User"** button
2. Fill in:
   - **Name** (required)
   - **Phone** (required, 10 digits)
   - **Password** (required, minimum 6 characters)
   - **Email** (optional)
3. Click **"Create Test User"**

### Edit Test User
1. Click **"Edit"** button next to test user
2. Update fields (password is optional - leave blank to keep current)
3. Click **"Update Test User"**

### Delete Test User
1. Click **"Delete"** button next to test user
2. Confirm deletion

## Login Flow

The login system now checks in this order:

### 1. Test Users (First Priority)
- User enters phone number → Click "LOGIN"
- System checks `test_users` table
- If found → Shows password field
- User enters password → Click "LOGIN"
- Password verified → Login successful (no OTP needed)

### 2. Regular Users (Admin-Created)
- User enters phone number → Click "LOGIN"
- System checks `users` table
- If found → Sends OTP
- User enters OTP → Click "VERIFY OTP"
- OTP verified → Login successful

### 3. New Users (Self-Registration)
- User enters phone number → Click "LOGIN"
- Not found in any table → Sends OTP
- User enters OTP → Click "VERIFY OTP"
- OTP verified → Asks for name/email
- User enters info → Click "CREATE ACCOUNT"
- Account created → Login successful

## Key Features

✅ **No OTP Required**: Test users login with phone + password only  
✅ **Separate Table**: Test users stored in `test_users` table (not `users` table)  
✅ **No Auth UID**: Test users don't need Supabase Auth (no `auth_uid` field)  
✅ **Plain Text Password**: Passwords stored as plain text (for testing only)  
✅ **Admin Management**: Create, edit, delete test users from admin panel  

## Security Notes

⚠️ **Important**: 
- Test users use **plain text passwords** (not hashed)
- This is **ONLY for development/testing**
- **DO NOT** use test users in production
- Test users bypass OTP verification (less secure)

## Use Cases

1. **Development**: Test login flow without SMS/OTP setup
2. **Testing**: Quick user creation for testing features
3. **Demo**: Show app functionality without OTP delays
4. **QA**: Test different user scenarios easily

## Example Workflow

1. **Admin creates test user:**
   - Name: "Test User"
   - Phone: "+911234567890"
   - Password: "test123"
   - Email: "test@example.com"

2. **Test user logs in:**
   - Go to `/profile`
   - Enter phone: "1234567890"
   - Click "LOGIN"
   - System detects test user → Shows password field
   - Enter password: "test123"
   - Click "LOGIN"
   - Login successful → Redirected to `/user`

## Files Modified

- ✅ `src/app/admin/page.tsx` - Added test user management UI
- ✅ `src/app/profile/page.tsx` - Updated login flow to check test users first
- ✅ `CREATE_TEST_USERS_TABLE.sql` - Database migration script

## Testing Checklist

- [ ] Run SQL script to create `test_users` table
- [ ] Create test user in admin panel
- [ ] Test login with test user (phone + password)
- [ ] Verify test user can access `/user` page
- [ ] Test regular user login (phone + OTP) still works
- [ ] Test new user registration (phone + OTP + info) still works

