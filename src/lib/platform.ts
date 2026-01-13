export const detectPlatform = (url: string): string => {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'X';
        if (hostname.includes('tiktok.com')) return 'TikTok';
        if (hostname.includes('instagram.com')) return 'Instagram';
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
        if (hostname.includes('warpcast.com') || hostname.includes('farcaster.xyz')) return 'Farcaster';

        return 'Other';
    } catch (e) {
        return 'Other';
    }
};

/**
 * Extract cast hash from Farcaster/Warpcast URL
 * URLs format: https://warpcast.com/username/0x... or https://farcaster.xyz/username/0x...
 */
export const extractFarcasterCastHash = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        
        // Last part should be the cast hash (starts with 0x)
        if (pathParts.length >= 2) {
            const castHash = pathParts[pathParts.length - 1];
            if (castHash.startsWith('0x') && castHash.length > 10) {
                return castHash;
            }
        }
        
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * Fetch Farcaster cast data using Neynar API
 * Returns the cast timestamp if available
 */
export const fetchFarcasterCastDate = async (url: string): Promise<string | null> => {
    try {
        const castHash = extractFarcasterCastHash(url);
        if (!castHash) {
            console.log('Could not extract cast hash from URL:', url);
            return null;
        }

        // Use Neynar API v2 - public endpoint (no API key required for basic queries)
        // If you have a Neynar API key, add it to env: VITE_NEYNAR_API_KEY
        const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
        const headers: HeadersInit = {
            'Accept': 'application/json',
        };
        
        if (apiKey) {
            headers['api_key'] = apiKey;
        }

        // Try to fetch cast by hash using Neynar API v2
        // Format: /v2/farcaster/cast?identifier={hash}&type=hash
        const apiUrl = `https://api.neynar.com/v2/farcaster/cast?identifier=${encodeURIComponent(castHash)}&type=hash`;
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            // If API key is required and we don't have it, try alternative approach
            if (response.status === 401 || response.status === 403) {
                console.log('Neynar API requires authentication. Falling back to Microlink.');
                return null;
            }
            throw new Error(`Neynar API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result?.cast?.timestamp) {
            // Neynar returns timestamp in milliseconds
            const timestamp = data.result.cast.timestamp;
            const date = new Date(timestamp);
            return date.toISOString();
        }

        return null;
    } catch (error) {
        console.error('Error fetching Farcaster cast date:', error);
        return null;
    }
};
