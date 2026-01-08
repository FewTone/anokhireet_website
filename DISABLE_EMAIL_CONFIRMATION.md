# How to Disable Email Confirmation in Supabase

This will remove the rate limiting issue when creating users from the admin panel.

## Steps:

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project

2. **Open Authentication Settings**
   - Click on **"Authentication"** in the left sidebar
   - Click on **"Settings"** (or go to Authentication → Settings)

3. **Disable Email Confirmation**
   - Scroll down to **"Email Auth"** section
   - Find **"Enable email confirmations"** toggle
   - **Turn it OFF** (disable it)

4. **Save Changes**
   - The changes are saved automatically

## Alternative: Increase Rate Limit (Not Recommended)

If you need to keep email confirmation enabled, you can:
- Wait 60 seconds between user creations
- Use different email addresses
- Contact Supabase support to increase rate limits (paid plans only)

## Benefits of Disabling Email Confirmation:

✅ No rate limiting when creating users
✅ Users can login immediately after creation
✅ Better for admin-created accounts
✅ Faster user onboarding

## Note:

- Users created without email confirmation can login immediately
- This is safe for admin-created accounts where you trust the admin
- You can still enable it later if needed








