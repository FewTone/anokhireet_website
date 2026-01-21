import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatUserDisplayName(fullName: string | null | undefined): string {
    if (!fullName) return "User";

    // Trim and split by whitespace
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) return "";


    // If only one name, return it
    if (parts.length === 1) return parts[0];

    // First name is the first part
    const firstName = parts[0];

    // Last name is the last part
    const lastName = parts[parts.length - 1];

    // Get last initial
    const lastInitial = lastName.charAt(0);

    // Return formatted string
    return `${firstName} ${lastInitial}.`;
}

export function capitalizeFirstLetter(string: string): string {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export function getUserInitials(name: string | null | undefined): string {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "";

    const firstInitial = parts[0].charAt(0).toUpperCase();
    if (parts.length === 1) return firstInitial;

    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
}

export function generateRandomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function generateCustomUserId(name: string, stateCode: string): string {
    const initials = getUserInitials(name);
    const year = new Date().getFullYear().toString().slice(-2);
    // Ensure state code is 2 chars and uppercase
    const state = stateCode.slice(0, 2).toUpperCase();
    const random = generateRandomString(3);

    return `${initials}${year}-${state}${random}`;
}

export function generateCustomProductId(userCustomId: string, productCount: number): string {
    // Current Product ID Format: AR-2F403
    // AR = Static prefix
    // 2F4 = Last 3 chars of User's Custom ID (e.g., from YC26-GJ2F4 -> 2F4)
    // 03 = Product Count (padded to 2 digits, or more if needed)

    const prefix = "AR";
    const userSuffix = userCustomId.slice(-3);
    // Start count from 1 (so if count is 0, this is the 1st product)
    const countStr = (productCount + 1).toString().padStart(2, '0');

    return `${prefix}-${userSuffix}${countStr}`;
}

// Indian States with codes
export const INDIAN_STATES = [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CT', name: 'Chhattisgarh' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UT', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: 'DL', name: 'Delhi' },
    { code: 'LD', name: 'Lakshadweep' },
    { code: 'PY', name: 'Puducherry' },
    { code: 'LA', name: 'Ladakh' }
];

