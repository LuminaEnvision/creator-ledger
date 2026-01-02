/**
 * Environment detection utility
 * Detects if the app is running in various environments (Base App, web, mobile, or desktop)
 */

export type AppEnvironment = 'base' | 'web' | 'mobile' | 'desktop';

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
    
    // Check if running in Base App or compatible mini app environment
    const isBase = typeof window !== 'undefined' && 
        (window.location.href.includes('base.org') ||
         window.location.href.includes('base.xyz') ||
         // Check for Base SDK context
         typeof (window as any).base !== 'undefined' ||
         // Check for Base user agent patterns
         userAgent.includes('Base'));

    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check if desktop
    const isDesktop = !isMobile && typeof window !== 'undefined' && window.innerWidth >= 1024;
    
    // Determine environment
    let environment: AppEnvironment;
    if (isBase) {
        environment = 'base';
    } else if (isMobile) {
        environment = 'mobile';
    } else if (isDesktop) {
        environment = 'desktop';
    } else {
        environment = 'web';
    }

    return {
        environment,
        isFarcaster: isBase, // Keep for backward compatibility with existing code
        isWeb: !isBase && !isMobile,
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

