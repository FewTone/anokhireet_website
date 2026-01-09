# Fix: OTP Testing with Supabase Test Phone Numbers

## Problem
When using Supabase test phone numbers (configured in Dashboard like `8200647176=123456`), you get the error:
**"Token has expired or is invalid"**

## Root Cause
The code was sending OTP via **WhatsApp channel** (`channel: 'whatsapp'`), but:
- Supabase test phone numbers work with **SMS channel only**
- WhatsApp channel requires actual Twilio Verify WhatsApp setup
- There was a mismatch between sending (WhatsApp) and verification (SMS)

## Solution
The code has been updated to use a **configurable OTP channel**:

### Configuration File: `src/lib/devConfig.ts`

```typescript
/**
 * OTP Channel Configuration
 * 
 * 'whatsapp' - Send OTP via WhatsApp using Twilio Verify (requires WhatsApp setup)
 * 'sms' - Send OTP via SMS (works with test phone numbers and regular SMS)
 * 
 * For testing with Supabase test phone numbers, use 'sms'
 * For production with WhatsApp, use 'whatsapp'
 */
export const OTP_CHANNEL: 'whatsapp' | 'sms' = 'sms'; // ✅ Set to 'sms' for testing
```

## How to Use

### For Testing (Current Setup)
1. **Keep `OTP_CHANNEL = 'sms'`** in `src/lib/devConfig.ts`
2. Configure test phone number in Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Phone**
   - Add test phone: `8200647176=123456`
   - Set expiration date
3. Test the login:
   - Enter phone: `8200647176`
   - OTP will be sent via SMS (or use test OTP: `123456`)
   - Enter OTP: `123456`
   - Should work now! ✅

### For Production (WhatsApp)
1. **Change `OTP_CHANNEL = 'whatsapp'`** in `src/lib/devConfig.ts`
2. Set up Twilio Verify WhatsApp in Supabase Dashboard
3. Configure WhatsApp Sender in Twilio
4. Submit and get approval for WhatsApp message templates

## Files Updated

1. ✅ `src/lib/devConfig.ts` - Added `OTP_CHANNEL` configuration
2. ✅ `src/app/profile/page.tsx` - Uses `getOtpChannel()` function
3. ✅ `src/components/LoginPopup.tsx` - Uses `getOtpChannel()` function

## Testing Checklist

- [x] Code updated to use configurable channel
- [ ] Set `OTP_CHANNEL = 'sms'` in `devConfig.ts`
- [ ] Configure test phone in Supabase Dashboard
- [ ] Test login with test phone number
- [ ] Verify OTP works correctly
- [ ] Check no "Token expired" errors

## Current Status

✅ **Code is fixed and ready for testing**
- Default channel is `'sms'` (works with test numbers)
- Can easily switch to `'whatsapp'` for production
- All login pages properly connected

## Next Steps

1. **For Testing**: Keep `OTP_CHANNEL = 'sms'` and test with your configured test phone number
2. **For Production**: Change to `OTP_CHANNEL = 'whatsapp'` after setting up Twilio Verify WhatsApp
