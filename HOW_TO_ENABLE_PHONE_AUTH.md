# How to Enable Phone Authentication in Supabase

## Step-by-Step Instructions

### Step 1: Navigate to Authentication

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project ("Anokhi Reet")
3. Click **"Authentication"** in the left sidebar (you should already be here)

### Step 2: Find "Sign In / Providers"

1. In the left sidebar, look under the **"CONFIGURATION"** section
2. You'll see a list of options:

   - Policies
   - **Sign In / Providers** ← **CLICK THIS ONE**
   - OAuth Server (BETA)
   - Sessions
   - Rate Limits
   - Multi-Factor
   - URL Configuration
   - Attack Protection
   - Auth Hooks (BETA)
   - Audit Logs
   - Performance

3. Click on **"Sign In / Providers"**

### Step 3: Enable Phone Authentication

1. Once you're on the "Sign In / Providers" page, you'll see a list of authentication providers
2. Look for **"Phone"** in the list
3. Click on **"Phone"** or toggle it **ON**
4. You'll see configuration options for Phone authentication

### Step 4: Configure SMS Provider

You'll need to set up an SMS provider. Options:

**Option A: Twilio (Recommended)**

1. Sign up at https://twilio.com
2. Get your Account SID and Auth Token
3. In Supabase, enter:
   - Account SID
   - Auth Token
   - Phone number (from Twilio)
4. Save

**Option B: MessageBird**

1. Sign up at https://messagebird.com
2. Get API key
3. Configure in Supabase

**Option C: TextLocal (For India)**

1. Sign up at https://textlocal.in
2. Get API key
3. Configure in Supabase

### Step 5: Save Settings

1. After configuring the SMS provider, click **"Save"** or **"Update"**
2. Phone authentication should now be enabled

## Visual Guide

```
Supabase Dashboard
├── Authentication (click this)
    ├── MANAGE
    │   ├── Users
    │   └── OAuth Apps
    ├── NOTIFICATIONS
    │   └── Email
    └── CONFIGURATION ← Look here!
        ├── Policies
        ├── Sign In / Providers ← CLICK THIS!
        ├── OAuth Server (BETA)
        ├── Sessions
        └── ... (other options)
```

## Troubleshooting

**If you still can't find it:**

1. Make sure you're in the **Authentication** section (left sidebar)
2. Scroll down in the left sidebar - "CONFIGURATION" might be below the fold
3. Look for "Sign In / Providers" (not just "Providers")
4. Try refreshing the page

**Alternative Path:**

- Some Supabase versions have it directly under Authentication
- Look for tabs at the top: "Users", "Policies", "Providers"
- Click the "Providers" tab

## What You Should See

After clicking "Sign In / Providers", you should see:

- A list of authentication methods (Email, Phone, Google, etc.)
- Toggle switches to enable/disable each method
- Configuration options for each provider

## Next Steps After Enabling

1. ✅ Enable Phone authentication
2. ✅ Configure SMS provider
3. ✅ Test login at `/profile` page
4. ✅ Create test user and try phone OTP






