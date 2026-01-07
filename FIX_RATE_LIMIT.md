# Fix Rate Limit Issue - Complete Guide

## Problem

You're hitting rate limits when creating users because:

1. **Email rate limit is locked at 2 emails/hour** (cannot be changed with default SMTP)
2. Some rate limits are locked and cannot be changed without custom SMTP

## Solution 1: Disable Email Confirmation (RECOMMENDED - Easiest Fix)

**This is the easiest solution - it prevents emails from being sent entirely:**

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Authentication** → **Providers** → **Email**
4. **Turn OFF "Confirm email"** toggle
5. Save changes

**This will prevent Supabase from sending confirmation emails, so you won't hit the email rate lzimit!**

## Solution 2: Increase Rate Limits That CAN Be Changed

1. Go to: **Authentication** → **Rate Limits**

2. Increase these limits (these CAN be changed):

   - **Rate limit for sign-ups and sign-ins:**

     - Current: `150 requests/5 min`
     - **Change to: `500` or higher** (1200+ per hour)

   - **Rate limit for token refreshes:**
     - Current: `150 requests/5 min`
     - **Change to: `300` or higher** if needed

3. Click **"Save changes"** button

**Note:** Email, SMS, Anonymous, and Web3 rate limits are LOCKED and cannot be changed without custom SMTP.

## Solution 3: Set Up Custom SMTP (For Higher Email Limits)

If you need to send emails and want higher limits:

1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Enable "Custom SMTP"
3. Set up with a service like:
   - **Resend** (recommended, easy setup)
   - **SendGrid**
   - **AWS SES**
   - **Postmark**
4. After setting up custom SMTP, you can configure email rate limits (30+ per hour, configurable)

## After Making Changes

1. Wait 1-2 minutes for changes to take effect
2. Try creating a user again
3. The automatic retry will still work, but you should hit limits much less often

## Why This Happens

- Supabase enforces rate limits server-side to prevent abuse
- Even with email confirmation disabled, some email sending may still occur
- The default email rate limit (2/hour) is very restrictive for admin user creation
- These limits are configurable in your Supabase dashboard
