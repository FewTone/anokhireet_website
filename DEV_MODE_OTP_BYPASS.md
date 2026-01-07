# Development Mode - OTP Bypass

## Overview
This feature allows you to **temporarily disable OTP verification** for testing purposes. Users can login with just their phone number without needing OTP.

## ⚠️ CRITICAL WARNING

**THIS IS INSECURE AND FOR DEVELOPMENT ONLY!**

- ❌ **NEVER enable in production**
- ❌ **NEVER commit with this enabled**
- ❌ **This bypasses all authentication security**
- ✅ **Only use for local development/testing**

## How to Enable/Disable

### Enable OTP Bypass (Development):
1. Open `src/lib/devConfig.ts`
2. Change: `export const DEV_MODE_BYPASS_OTP = true;`
3. Save file
4. Restart dev server if needed

### Disable OTP (Normal Mode):
1. Open `src/lib/devConfig.ts`
2. Change: `export const DEV_MODE_BYPASS_OTP = false;`
3. Save file
4. Restart dev server if needed

## How It Works

### When Enabled:
1. User enters phone number
2. Clicks "LOGIN"
3. **OTP is skipped** - user is logged in immediately
4. For new users: asks for name/email directly (no OTP)
5. For existing users: logs in directly (no OTP)

### When Disabled (Normal):
1. User enters phone number
2. Clicks "LOGIN"
3. OTP is sent
4. User enters OTP
5. User is logged in

## Testing Flow

### Existing User (OTP Bypass Enabled):
1. Go to `/profile`
2. Enter phone number (e.g., `1234567890`)
3. Click "LOGIN"
4. **Immediately redirected to `/user`** (no OTP needed)

### New User (OTP Bypass Enabled):
1. Go to `/profile`
2. Enter phone number (new number)
3. Click "LOGIN"
4. **Directly asks for name/email** (no OTP)
5. Enter name/email
6. Click "CREATE ACCOUNT"
7. **Immediately logged in** (no OTP verification)

## Safety Features

✅ **Auto-disabled in production:**
- Even if `DEV_MODE_BYPASS_OTP = true`, it's automatically disabled when `NODE_ENV === 'production'`
- Production builds will always require OTP

✅ **Clear warnings:**
- Console warnings when OTP bypass is active
- Code comments mark all bypass sections

✅ **Easy to remove:**
- All code in one config file: `src/lib/devConfig.ts`
- All bypass code marked with `⚠️ DEVELOPMENT ONLY`

## Files Modified

- `src/lib/devConfig.ts` - **NEW** - Configuration file
- `src/app/profile/page.tsx` - Added OTP bypass logic

## Before Production

**MUST DO:**
1. Set `DEV_MODE_BYPASS_OTP = false` in `src/lib/devConfig.ts`
2. Test that OTP is required
3. Verify production build requires OTP
4. Remove or comment out bypass code if desired

## Quick Toggle

```typescript
// src/lib/devConfig.ts

// For testing (no OTP):
export const DEV_MODE_BYPASS_OTP = true;

// For normal use (OTP required):
export const DEV_MODE_BYPASS_OTP = false;
```

## Notes

- This bypasses Supabase Auth OTP verification
- Users are logged in using localStorage only
- No actual Supabase Auth session is created (in bypass mode)
- This is a development/testing convenience only
- **Never use this in production!**




