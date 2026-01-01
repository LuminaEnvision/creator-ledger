/**
 * Premium Whitelist Configuration
 * 
 * To add premium test access (for testing without payment):
 * 1. Add wallet addresses to the PREMIUM_WHITELIST array below
 * 2. Use lowercase addresses for consistency
 * 3. Addresses in this list will have access to all premium features:
 *    - Export CSV/PDF
 *    - Pro NFT styling
 *    - Premium UI elements
 *    - All premium features
 * 
 * This is for TESTING ONLY. In production, remove this whitelist
 * and rely only on database subscription status.
 * 
 * Example:
 * const PREMIUM_WHITELIST: string[] = [
 *     '0x7d85fcbb505d48e6176483733b62b51704e0bf95'.toLowerCase(),
 *     '0xYourTestWalletAddress'.toLowerCase(),
 * ];
 */
const PREMIUM_WHITELIST: string[] = [
    '0x7d85fcbb505d48e6176483733b62b51704e0bf95'.toLowerCase(), // Your wallet
    // Add more test wallets here
];

// Check if a wallet address is whitelisted for premium (testing only)
export const isPremiumWhitelisted = (walletAddress: string | null | undefined): boolean => {
    if (!walletAddress) return false;
    
    // Normalize to lowercase for comparison
    const normalized = walletAddress.toLowerCase();
    
    // Check against whitelist
    return PREMIUM_WHITELIST.includes(normalized);
};

// Get premium whitelist (for display purposes only)
export const getPremiumWhitelist = (): string[] => {
    return [...PREMIUM_WHITELIST];
};

/**
 * Check if a user has premium status based on database subscription data
 * This function should be called with data from the 'users' table
 */
export const checkPremiumStatus = (userData: {
    subscription_active?: boolean | null;
    subscription_end?: string | null;
    is_premium?: boolean | null;
} | null, walletAddress?: string | null): boolean => {
    if (!userData) return false;

    const now = new Date();
    const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null;
    
    // Check if subscription is active (not null/undefined, equals true, and not expired)
    const hasActiveSubscription = userData.subscription_active === true;
    const isNotExpired = !subscriptionEnd || subscriptionEnd > now;
    const isActive = hasActiveSubscription && isNotExpired;
    
    // Premium status: Active subscription OR legacy premium flag (if no subscription system was used)
    // OR whitelisted for testing
    const hasSubscription = userData.subscription_active !== null && userData.subscription_active !== undefined;
    const dbPremiumStatus = isActive || (!hasSubscription && userData.is_premium === true);
    const isWhitelisted = walletAddress ? isPremiumWhitelisted(walletAddress) : false;
    
    return dbPremiumStatus || isWhitelisted;
};

