// ⚠️ DEVELOPMENT ONLY - Remove before production
// This file controls development/testing features

/**
 * DEVELOPMENT MODE: Bypass OTP for testing
 * 
 * Set to true to skip OTP verification during development
 * Users can login with just phone number (no OTP needed)
 * 
 * ⚠️ WARNING: This is INSECURE and should NEVER be enabled in production
 * ⚠️ Set to false before deploying to production
 */
export const DEV_MODE_BYPASS_OTP = true; // Change to false to enable OTP

/**
 * Check if OTP bypass is enabled
 */
export const isOtpBypassEnabled = (): boolean => {
    // Only enable in development environment
    if (process.env.NODE_ENV === 'production') {
        return false; // Always require OTP in production
    }
    return DEV_MODE_BYPASS_OTP;
};





