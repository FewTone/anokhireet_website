
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
    // In production, use WhatsApp if configured
    if (process.env.NODE_ENV === 'production') {
        return 'whatsapp';
    }
    // In development, use configured channel (default SMS for testing)
    return OTP_CHANNEL;
};







