/**
 * Admin Configuration
 * 
 * To add admin access:
 * 1. Add wallet addresses to the ADMIN_WALLETS array below
 * 2. Use lowercase addresses for consistency
 * 3. Only addresses in this list will have access to:
 *    - Admin Dashboard (/admin route)
 *    - Admin navigation link
 *    - Ability to verify/unverify entries
 * 
 * Example:
 * const ADMIN_WALLETS: string[] = [
 *     '0x7eB8F203167dF3bC14D59536E671528dd97FB72a'.toLowerCase(),
 *     '0xYourAdminWalletAddress'.toLowerCase(),
 * ];
 */
const ADMIN_WALLETS: string[] = [
    '0x7D85fCbB505D48E6176483733b62b51704e0bF95'.toLowerCase(),
    '0xD76C1a451B7d52405b6f4f8Ee3c04989B656e9Bf'.toLowerCase(),
];

// Check if a wallet address is an admin
export const isAdmin = (walletAddress: string | null | undefined): boolean => {
    if (!walletAddress) return false;
    
    // Normalize to lowercase for comparison
    const normalized = walletAddress.toLowerCase();
    
    // Check against admin list
    return ADMIN_WALLETS.includes(normalized);
};

// Get admin wallets (for display purposes only)
export const getAdminWallets = (): string[] => {
    return [...ADMIN_WALLETS];
};

