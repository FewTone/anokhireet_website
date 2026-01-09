# Twilio Verify WhatsApp Setup Guide

## Overview

This application uses **Twilio Verify** to send OTP codes via **WhatsApp** through Supabase Authentication.

## ✅ Current Implementation Status

### Code Implementation

- ✅ All login pages are connected to Supabase Authentication
- ✅ OTP sending configured with **configurable channel** (SMS for testing, WhatsApp for production)
- ✅ OTP verification properly implemented
- ✅ Session management working correctly

### ⚠️ Important: Channel Configuration

The code now uses a **configurable OTP channel**:

- **Development/Testing**: Uses `'sms'` channel (works with Supabase test phone numbers)
- **Production**: Uses `'whatsapp'` channel (requires Twilio Verify WhatsApp setup)

**Configuration File**: `src/lib/devConfig.ts`

- Set `OTP_CHANNEL = 'sms'` for testing with Supabase test phone numbers
- Set `OTP_CHANNEL = 'whatsapp'` for production with WhatsApp delivery

### Files Updated:

1. **`src/lib/devConfig.ts`** - Configuration file

   - `OTP_CHANNEL`: Set to `'sms'` for testing, `'whatsapp'` for production
   - `getOtpChannel()`: Returns appropriate channel based on environment

2. **`src/app/profile/page.tsx`** - Main login page

   - Uses `getOtpChannel()` to determine SMS or WhatsApp channel
   - Admin-created user OTP sending
   - New user OTP sending

3. **`src/components/LoginPopup.tsx`** - Login popup component
   - Uses `getOtpChannel()` to determine SMS or WhatsApp channel

## 🔧 Supabase Dashboard Configuration Required

### Step 1: Configure Twilio in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **"Phone"** provider and enable it
3. Select **"Twilio"** as SMS provider
4. Enter your Twilio credentials:
   - **Account SID**: Your Twilio Account SID
   - **Auth Token**: Your Twilio Auth Token
   - **Phone Number**: Your Twilio phone number (for SMS fallback)
5. **Save** settings

### Step 2: Configure Twilio Verify for WhatsApp

**Important**: Supabase uses Twilio Verify API, which supports WhatsApp.

1. **In Twilio Console**:

   - Go to **Verify** → **Services**
   - Create or select a Verify Service
   - Enable **WhatsApp** channel
   - Configure WhatsApp Sender (requires WhatsApp Business Account)

2. **WhatsApp Sender Setup** (Required as of March 2024):

   - You need a **WhatsApp Business Account**
   - Register your WhatsApp Sender in Twilio
   - Submit message templates to Twilio
   - Wait for approval (can take 24-48 hours)

3. **Message Template**:
   - The template must match the SMS body configured in Supabase
   - Format: `Your verification code is {{code}}`
   - Submit template for approval in Twilio

### Step 3: Verify Configuration

1. Test with a real phone number
2. Check that OTP arrives via WhatsApp (not SMS)
3. Verify OTP code works correctly

## 📋 Authentication Flow Verification

### ✅ Login Pages Connection Status

#### 1. Profile/Login Page (`/profile`)

- ✅ Connected to Supabase Auth
- ✅ Uses `supabase.auth.signInWithOtp()` with WhatsApp channel
- ✅ Uses `supabase.auth.verifyOtp()` for verification
- ✅ Checks session with `supabase.auth.getSession()`
- ✅ Properly redirects authenticated users

#### 2. User Page (`/user`)

- ✅ Connected to Supabase Auth
- ✅ Checks session with `supabase.auth.getSession()`
- ✅ Redirects to `/profile` if not authenticated
- ✅ Loads user data from `users` table

#### 3. Admin Page (`/admin`)

- ✅ Connected to Supabase Auth
- ✅ Checks session with `supabase.auth.getSession()`
- ✅ Verifies admin status via `admins` table
- ✅ Proper authentication flow

#### 4. LoginPopup Component

- ✅ Connected to Supabase Auth
- ✅ Uses `supabase.auth.signInWithOtp()` with WhatsApp channel
- ✅ Uses `supabase.auth.verifyOtp()` for verification
- ✅ Properly handles authentication callbacks

## 🔍 Code Verification Checklist

### OTP Sending (Configurable Channel)

- [x] `src/lib/devConfig.ts` - OTP channel configuration
- [x] `src/app/profile/page.tsx` - Admin-created user OTP (uses configurable channel)
- [x] `src/app/profile/page.tsx` - New user OTP (uses configurable channel)
- [x] `src/components/LoginPopup.tsx` - Popup OTP (uses configurable channel)

### OTP Verification

- [x] `src/app/profile/page.tsx` - Line 343: `verifyOtp()` call
- [x] `src/components/LoginPopup.tsx` - Line 174: `verifyOtp()` call

### Session Management

- [x] `src/app/profile/page.tsx` - Line 52: `getSession()` check
- [x] `src/app/user/page.tsx` - Line 71: `getSession()` check
- [x] `src/app/admin/page.tsx` - Line 495: `getSession()` check

## ⚠️ Important Notes

1. **Channel Configuration**:

   - **For Testing**: Set `OTP_CHANNEL = 'sms'` in `src/lib/devConfig.ts` (works with Supabase test phone numbers)
   - **For Production**: Set `OTP_CHANNEL = 'whatsapp'` in `src/lib/devConfig.ts` (requires WhatsApp setup)
   - The code automatically uses SMS in development and WhatsApp in production by default

2. **Test Phone Numbers**:

   - Supabase test phone numbers (configured in Dashboard) work with **SMS channel only**
   - Example: `8200647176=123456` in Supabase Dashboard works with `channel: 'sms'`
   - **If you get "Token has expired or is invalid"**: Make sure `OTP_CHANNEL = 'sms'` in `src/lib/devConfig.ts`
   - See `FIX_OTP_TESTING.md` for detailed troubleshooting

3. **Twilio Verify**: Supabase uses Twilio Verify API, which supports both SMS and WhatsApp
4. **Message Templates**: For WhatsApp, you must submit and get approval for WhatsApp message templates in Twilio
5. **Testing**: Test with real phone numbers - local development may not work properly
6. **Fallback**: If WhatsApp fails, Twilio will fallback to SMS (if configured)

## 🧪 Testing Checklist

- [ ] Configure Twilio in Supabase Dashboard
- [ ] Set up WhatsApp Sender in Twilio
- [ ] Submit and get approval for WhatsApp message template
- [ ] Test OTP sending via WhatsApp
- [ ] Test OTP verification
- [ ] Test admin-created user login flow
- [ ] Test new user registration flow
- [ ] Verify session persistence
- [ ] Test logout functionality

## 📞 Troubleshooting

### OTP Not Received via WhatsApp

1. Check Twilio Verify service is configured for WhatsApp
2. Verify WhatsApp Sender is approved in Twilio
3. Check message template is approved
4. Verify phone number format is correct (`+91XXXXXXXXXX`)
5. Check Twilio logs for delivery status

### OTP Verification Fails

1. Verify OTP code is correct (6 digits)
2. Check OTP hasn't expired (usually 5-10 minutes)
3. Verify Supabase Auth is properly configured
4. Check browser console for errors

### Authentication Not Working

1. Verify Supabase environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project is active
3. Verify Phone authentication is enabled in Supabase Dashboard
4. Check browser console for errors

## 🔗 References

- [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio)
- [Twilio Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp)
- [Supabase Auth API](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
