# WhatsApp OTP Setup Requirements

## ⚠️ Important: Why You're Not Receiving WhatsApp OTP

After removing test phone numbers from Supabase, OTPs are now sent via **Twilio**. For WhatsApp to work, you need **complete Twilio Verify WhatsApp setup**.

## Current Situation

- ✅ Code is configured to use WhatsApp channel
- ❌ Twilio Verify WhatsApp is not fully configured
- ❌ WhatsApp requires additional setup steps

## Two Options to Fix

### Option 1: Use SMS Instead (Easier - Recommended for Testing)

**Quick Fix**: Change to SMS channel which is easier to set up.

1. **Open** `src/lib/devConfig.ts`
2. **Change** this line:
   ```typescript
   export const OTP_CHANNEL: "whatsapp" | "sms" = "sms"; // ✅ Already set to 'sms'
   ```
3. **Make sure** Twilio is configured in Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Phone**
   - Enter Twilio Account SID, Auth Token, and Verify Service SID
   - **Save**
4. **Test** - OTPs will be sent via SMS instead of WhatsApp

### Option 2: Complete WhatsApp Setup (For Production)

WhatsApp requires these steps (can take 24-48 hours):

#### Step 1: Twilio Verify WhatsApp Setup

1. **In Twilio Console**:

   - Go to **Verify** → **Services**
   - Select your Verify Service (or create new one)
   - Enable **WhatsApp** channel
   - Note your **Verify Service SID**

2. **In Supabase Dashboard**:
   - Go to **Authentication** → **Providers** → **Phone**
   - Make sure **Twilio Verify Service SID** is entered
   - **Save**

#### Step 2: WhatsApp Business Account Setup

1. **Create WhatsApp Business Account**:

   - Go to [Twilio Console → Messaging → Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)
   - Click **"Add new sender"**
   - Enter your WhatsApp Business phone number
   - Verify ownership (Twilio will send verification code)

2. **Wait for Approval**:
   - Twilio reviews WhatsApp Business accounts
   - Can take 24-48 hours
   - You'll receive email when approved

#### Step 3: Create WhatsApp Message Template

1. **In Twilio Console**:

   - Go to **Messaging** → **Templates**
   - Click **"Create Template"**
   - Select **WhatsApp** as channel
   - Template must match your OTP message format

2. **Template Requirements**:
   - Format: `Your verification code is {{code}}`
   - Must be approved by Twilio (24-48 hours)
   - Template name must match what Supabase uses

#### Step 4: Link Template to Verify Service

1. **In Twilio Console**:
   - Go to **Verify** → **Services** → Your Service
   - Go to **Messaging** tab
   - Select your WhatsApp template
   - **Save**

#### Step 5: Test

1. **Change code** to use WhatsApp:
   ```typescript
   // In src/lib/devConfig.ts
   export const OTP_CHANNEL: "whatsapp" | "sms" = "whatsapp";
   ```
2. **Test** with real phone number
3. **Check** Twilio logs for delivery status

## Quick Comparison

| Feature          | SMS        | WhatsApp            |
| ---------------- | ---------- | ------------------- |
| Setup Time       | 5 minutes  | 24-48 hours         |
| Twilio Account   | Required   | Required            |
| Business Account | Not needed | Required            |
| Message Template | Not needed | Required + Approval |
| Cost             | Lower      | Higher              |
| User Experience  | Good       | Better              |

## Recommended Approach

### For Development/Testing:

✅ **Use SMS** (`OTP_CHANNEL = 'sms'`)

- Faster setup
- Works immediately
- No approval needed
- Lower cost

### For Production:

✅ **Use WhatsApp** (`OTP_CHANNEL = 'whatsapp'`)

- Better user experience
- Higher delivery rates
- Requires full setup

## Current Configuration Check

1. **Check** `src/lib/devConfig.ts`:

   ```typescript
   export const OTP_CHANNEL: "whatsapp" | "sms" = "sms"; // ✅ Should be 'sms' for now
   ```

2. **Check** Supabase Dashboard:

   - Authentication → Providers → Phone
   - Twilio credentials entered?
   - Verify Service SID entered?

3. **If using WhatsApp**:
   - WhatsApp Sender approved?
   - Message template approved?
   - Template linked to Verify Service?

## Troubleshooting

### "OTP Not Received via WhatsApp"

1. ✅ Check Twilio Verify Service has WhatsApp enabled
2. ✅ Verify WhatsApp Sender is approved
3. ✅ Check message template is approved
4. ✅ Verify template is linked to Verify Service
5. ✅ Check Twilio logs for errors
6. ✅ Try SMS channel first to test Twilio connection

### "Twilio Not Configured"

1. ✅ Go to Supabase Dashboard → Authentication → Providers → Phone
2. ✅ Enter Twilio Account SID
3. ✅ Enter Twilio Auth Token
4. ✅ Enter Twilio Verify Service SID
5. ✅ Save settings
6. ✅ Test with SMS channel first

## Next Steps

**Immediate Fix (Recommended)**:

1. Keep `OTP_CHANNEL = 'sms'` in `devConfig.ts`
2. Configure Twilio in Supabase Dashboard
3. Test with SMS first
4. Once working, then set up WhatsApp

**For Production**:

1. Complete WhatsApp setup (Steps 1-4 above)
2. Change `OTP_CHANNEL = 'whatsapp'`
3. Test thoroughly before going live
