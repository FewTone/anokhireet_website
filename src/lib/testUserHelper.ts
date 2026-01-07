// ⚠️ TODO: REMOVE BEFORE PRODUCTION - Test user helper functions
// This file contains all test user related code in one place for easy removal

/**
 * Check if current user is a test user
 * Returns true only if isTestUser flag is explicitly set in localStorage
 */
export const isTestUser = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem("isTestUser") === "true";
};

/**
 * Get test user data from localStorage
 * Returns null if not a test user or data is missing
 */
export const getTestUserData = (): { userId: string; userName: string; userPhone: string; userEmail?: string } | null => {
    if (!isTestUser()) return null;
    
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userPhone = localStorage.getItem("userPhone");
    const userEmail = localStorage.getItem("userEmail");
    
    if (!userId || !userName) return null;
    
    return {
        userId,
        userName,
        userPhone: userPhone || "",
        userEmail: userEmail || undefined,
    };
};

/**
 * Clear test user data from localStorage
 */
export const clearTestUserData = (): void => {
    localStorage.removeItem("isTestUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userEmail");
};



