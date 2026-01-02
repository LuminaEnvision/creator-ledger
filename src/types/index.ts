export interface User {
    walletAddress: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
}

export interface LedgerEntry {
    id: string;
    url: string;
    platform: string;
    timestamp: string; // When entry was submitted to Creator Ledger
    content_published_at?: string; // Actual publication date of the content
    verification_status: string;
    description?: string;
    campaign_tag?: string;
    wallet_address: string;
    payload_hash: string;
    content_hash?: string; // For duplicate detection across all users
    title?: string;
    image_url?: string;
    custom_image_url?: string;
    site_name?: string;
    signature?: string;
    tx_hash?: string; // Transaction hash for onchain verification
    visibility_settings?: {
        isPublic?: boolean;
        hiddenTags?: string[];
        hiddenPosts?: string[];
        dateRange?: {
            start: string | null;
            end: string | null;
        } | null;
        hiddenPlatforms?: string[];
        minVerificationStatus?: 'Unverified' | 'Verified';
    };
    endorsement_count?: number; // Number of endorsements
    dispute_count?: number; // Number of disputes
}

declare global {
    interface Window {
        ethereum?: any;
    }
}
