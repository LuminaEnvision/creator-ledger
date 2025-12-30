export const detectPlatform = (url: string): string => {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'X';
        if (hostname.includes('tiktok.com')) return 'TikTok';
        if (hostname.includes('instagram.com')) return 'Instagram';
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';

        return 'Other';
    } catch (e) {
        return 'Other';
    }
};
