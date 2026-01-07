# Next Steps - Supabase Auth Migration

Follow these steps in order to complete the migration:

## Step 1: Run the SQL Migration ⚠️ IMPORTANT

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration SQL**
   - Open the file `MIGRATE_TO_SUPABASE_AUTH.sql`
   - Copy ALL the SQL code from that file
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify the Changes**
   - Check that the `users` table structure is updated:
     - `id` column should allow NULL
     - `email` column should allow NULL  
     - `phone` column should be required
     - `password` column should be removed

## Step 2: Enable Phone Authentication in Supabase

1. **Go to Authentication → Providers**
   - In Supabase Dashboard, click "Authentication" in left sidebar
   - Click "Providers"

2. **Enable Phone Authentication**
   - Find "Phone" in the list of providers
   - Toggle it ON (Enable)

3. **Configure SMS Provider**
   - You'll need to set up an SMS provider (Twilio, MessageBird, Vonage, or TextLocal)
   - For testing, you can use Supabase's built-in provider (limited)
   - Follow the setup instructions in the Supabase dashboard

4. **Save Settings**
   - Click "Save" to enable phone authentication

## Step 3: Update Admin Page (TODO)

The admin page still needs to be updated to:
- Remove Firebase authentication
- Create users with phone only (no authentication)
- Remove password fields from user creation form

**Current Status:** The admin page still uses Firebase. You need to:
1. Update `src/app/admin/page.tsx` to remove Firebase imports
2. Update user creation to only create in `users` table (no auth)
3. Remove password fields from user creation form

## Step 4: Test the Login Flow

1. **Create a Test User (via Admin or SQL)**
   ```sql
   INSERT INTO users (name, phone, email, is_admin) 
   VALUES ('Test User', '+911234567890', NULL, false);
   ```

2. **Test Phone OTP Login**
   - Go to `/profile` page
   - Enter phone number: `1234567890` (without +91, it's added automatically)
   - Click "SEND OTP"
   - Check your phone for the OTP code
   - Enter the 6-digit code
   - Click "VERIFY OTP"
   - You should be redirected to `/user` page

## Step 5: Update Other Files (TODO)

These files still need to be updated:

### 5.1 Update Admin Authentication
- File: `src/app/admin/page.tsx`
- Change: Use Supabase Auth instead of Firebase
- Remove: All Firebase imports and usage

### 5.2 Update My Products Page
- File: `src/app/my-products/page.tsx`
- Change: Use Supabase Auth session instead of Firebase
- Code to use:
  ```typescript
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  ```

### 5.3 Update User Page
- File: `src/app/user/page.tsx`
- Change: Use Supabase Auth session to get user data
- Add: Logout using `supabase.auth.signOut()`

### 5.4 Remove Firebase Files
- Delete: `src/lib/firebase.ts`
- Remove: All Firebase imports from all files
- Remove: Firebase environment variables from `.env.local`

## Step 6: Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can remove Firebase environment variables:
- ~~NEXT_PUBLIC_FIREBASE_API_KEY~~
- ~~NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN~~
- ~~NEXT_PUBLIC_FIREBASE_PROJECT_ID~~
- ~~NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET~~
- ~~NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID~~
- ~~NEXT_PUBLIC_FIREBASE_APP_ID~~

## Checklist

- [ ] Run SQL migration in Supabase SQL Editor
- [ ] Enable Phone authentication in Supabase Dashboard
- [ ] Configure SMS provider (Twilio/MessageBird/etc.)
- [ ] Update admin page to create users without Firebase
- [ ] Update admin authentication to use Supabase
- [ ] Update my-products page to use Supabase Auth
- [ ] Update user page to use Supabase Auth
- [ ] Remove Firebase file (`src/lib/firebase.ts`)
- [ ] Remove Firebase imports from all files
- [ ] Test login flow with phone OTP
- [ ] Test user creation by admin
- [ ] Test viewing products (should be public)

## Important Notes

⚠️ **Before testing:**
- Make sure you've run the SQL migration
- Make sure Phone auth is enabled in Supabase
- Make sure you have an SMS provider configured

⚠️ **User Creation Flow:**
- Admin creates users in `users` table with phone (required), email (optional)
- User is NOT authenticated yet (no auth.users entry)
- When user logs in with phone OTP, Supabase Auth creates auth.users entry
- The app links users.id to auth.users.id

⚠️ **Products are Public:**
- Products should be visible to everyone (no authentication required)
- This is already configured in the RLS policies

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase Dashboard → Logs for errors
3. Verify SQL migration ran successfully
4. Verify Phone auth is enabled in Supabase
5. Check SMS provider configuration





