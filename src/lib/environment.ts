/**
 * Environment detection utility
 * Detects if the app is running in Farcaster, web, mobile, or desktop
 */

export type AppEnvironment = 'farcaster' | 'web' | 'mobile' | 'desktop';

export interface EnvironmentInfo {
    environment: AppEnvironment;
    isFarcaster: boolean;
    isWeb: boolean;
    isMobile: boolean;
    isDesktop: boolean;
    userAgent: string;
}

/**
 * Detects the current environment where the app is running
 */
export function detectEnvironment(): EnvironmentInfo {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    
    // Check if running in Farcaster
    const isFarcaster = typeof window !== 'undefined' && 
        (window.location.href.includes('farcaster.xyz') ||
         window.location.href.includes('warpcast.com') ||
         // Check for Farcaster SDK context
         typeof (window as any).farcaster !== 'undefined' ||
         // Check for Farcaster user agent patterns
         userAgent.includes('Farcaster') ||
         userAgent.includes('Warpcast'));

    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check if desktop
    const isDesktop = !isMobile && typeof window !== 'undefined' && window.innerWidth >= 1024;
    
    // Determine environment
    let environment: AppEnvironment;
    if (isFarcaster) {
        environment = 'farcaster';
    } else if (isMobile) {
        environment = 'mobile';
    } else if (isDesktop) {
        environment = 'desktop';
    } else {
        environment = 'web';
    }

    return {
        environment,
        isFarcaster,
        isWeb: !isFarcaster && !isMobile,
        isMobile,
        isDesktop,
        userAgent,
    };
}

/**
 * Get the current environment (cached)
 */
let cachedEnvironment: EnvironmentInfo | null = null;

export function getEnvironment(): EnvironmentInfo {
    if (!cachedEnvironment) {
        cachedEnvironment = detectEnvironment();
    }
    return cachedEnvironment;
}

