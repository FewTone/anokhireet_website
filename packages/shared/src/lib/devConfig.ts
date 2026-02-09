
/**
 * OTP Channel Configuration
 * 
 * 'whatsapp' - Send OTP via WhatsApp using Twilio Verify (requires WhatsApp setup)
 * 'sms' - Send OTP via SMS (works with test phone numbers and regular SMS)
 * 
 * For testing with Supabase test phone numbers, use 'sms'
 * For production with WhatsApp, use 'whatsapp'
 */
export const OTP_CHANNEL: 'whatsapp' | 'sms' = 'sms'; // Change to 'whatsapp' for production

/**
 * Get OTP channel based on environment
 * In production, use WhatsApp. In development, use SMS (works with test numbers)
 */
export const getOtpChannel = (): 'whatsapp' | 'sms' => {
    // Always use configured channel (default SMS)
    // Production WhatsApp requirement disabled for now to fix login
    return OTP_CHANNEL;
};







