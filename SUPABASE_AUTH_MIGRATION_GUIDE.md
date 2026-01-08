# Migration Guide: Firebase Auth → Supabase Auth (Phone OTP)

## Overview

This guide explains how to migrate from Firebase Authentication to Supabase Authentication using Phone OTP.

## New Authentication Flow

### 1. Admin Creates User

- Admin creates user in `users` table with:
  - **Phone number** (required)
  - **Email** (optional)
  - **Name** (required)
  - **No authentication yet** (user is not authenticated)

### 2. Products are Public

- Anyone can view products (no authentication required)
- Products are visible to all users (logged in or not)

### 3. User Logs In Later

- User enters phone number
- OTP is sent via SMS
- User enters OTP code
- If phone number exists (created by admin):
  - User gets authenticated via Supabase Auth
  - User sees their assigned products/data

## Step 1: Update Database Schema

Run the migration SQL in Supabase SQL Editor:

```sql
-- See MIGRATE_TO_SUPABASE_AUTH.sql
```

This will:

- Make `users.id` nullable (set when user authenticates)
- Make `phone` required
- Make `email` optional
- Remove `password` column (not needed with OTP)
- Update foreign key constraint to `auth.users`

## Step 2: Enable Phone Authentication in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Phone** authentication
3. Configure SMS provider (Twilio, MessageBird, etc.)
4. Save settings

## Step 3: Update Admin Page

The admin page should create users with:

- Phone number (required)
- Email (optional)
- Name (required)
- **No authentication** (no Firebase/Supabase Auth call)

User record will have `id = NULL` until they log in with OTP.

## Step 4: Update Login/Profile Page

Replace Firebase Auth with Supabase Phone OTP:

1. User enters phone number
2. Call `supabase.auth.signInWithOtp({ phone: '+91...' })`
3. User receives OTP via SMS
4. User enters OTP code
5. Call `supabase.auth.verifyOtp({ phone: '+91...', token: '123456', type: 'sms' })`
6. Check if user exists in `users` table by phone
7. If exists, update `users.id` to match `auth.users.id`
8. Store session in Supabase Auth (automatic)

## Step 5: Remove Firebase Dependencies

1. Remove `src/lib/firebase.ts`
2. Remove Firebase imports from all files
3. Update all authentication checks to use Supabase Auth
4. Remove Firebase environment variables from `.env.local`

## Step 6: Update All Authentication Checks

Replace:

- `firebase.auth` → `supabase.auth`
- `onAuthStateChanged` → `supabase.auth.onAuthStateChange`
- `signOut(auth)` → `supabase.auth.signOut()`

## Step 7: Update My Products Page

- Check Supabase Auth session
- Load user's assigned products from `user_products` table
- Use Supabase Auth user ID

## Implementation Notes

### Admin Creates User Flow

```typescript
// Admin creates user (no authentication)
const { data, error } = await supabase.from("users").insert({
  name: userFormData.name,
  phone: userFormData.phone, // Required
  email: userFormData.email || null, // Optional
  is_admin: false,
  id: null, // Will be set when user authenticates
});
```

### User Login Flow

```typescript
// Step 1: Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: "+91...",
  options: {
    shouldCreateUser: false, // User must exist (created by admin)
  },
});

// Step 2: Verify OTP
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({
  phone: "+91...",
  token: "123456",
  type: "sms",
});

// Step 3: Link user record to auth.users.id
if (session?.user) {
  const { error } = await supabase
    .from("users")
    .update({ id: session.user.id })
    .eq("phone", "+91...");
}
```

## Files to Update

1. `src/app/admin/page.tsx` - Update user creation (remove Firebase)
2. `src/app/profile/page.tsx` - Replace with phone OTP login
3. `src/app/my-products/page.tsx` - Use Supabase Auth session
4. `src/app/user/page.tsx` - Use Supabase Auth session
5. Remove `src/lib/firebase.ts`
6. Update all authentication checks throughout the app

## Environment Variables

Remove Firebase variables, keep only Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Testing Checklist

- [ ] Admin can create users with phone only
- [ ] Admin can create users with phone + email
- [ ] Products are visible to everyone (public)
- [ ] User can request OTP with phone number
- [ ] User receives OTP via SMS
- [ ] User can verify OTP and log in
- [ ] User sees their assigned products after login
- [ ] User can log out
- [ ] Admin authentication still works

## Important Notes

1. **User must exist first**: Admin must create user before they can log in
2. **Phone is required**: Users are identified by phone number
3. **Email is optional**: Can be added later
4. **Products are public**: No authentication needed to view
5. **OTP verification**: Users verify phone with OTP on each login






