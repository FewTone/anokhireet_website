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
