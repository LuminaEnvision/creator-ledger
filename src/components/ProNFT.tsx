import React from 'react';

interface ProNFTProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ProNFT: React.FC<ProNFTProps> = ({
    className = '',
    size = 'lg'
}) => {
    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48 md:w-64 md:h-64',
        lg: 'w-64 h-64 md:w-80 md:h-80'
    };

    // Generate an elaborate Pro NFT SVG
    const svgContent = `
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="proGradient1" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#8B5CF6"/>
                    <stop offset="0.3" stop-color="#3B82F6"/>
                    <stop offset="0.6" stop-color="#EC4899"/>
                    <stop offset="1" stop-color="#F59E0B"/>
                </linearGradient>
                <linearGradient id="proGradient2" x1="250" y1="0" x2="250" y2="500" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#10B981" stop-opacity="0.8"/>
                    <stop offset="1" stop-color="#3B82F6" stop-opacity="0.6"/>
                </linearGradient>
                <radialGradient id="proGlow" cx="250" cy="250" r="250">
                    <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.4"/>
                    <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#EC4899" stop-opacity="0"/>
                </radialGradient>
                <filter id="proGlowFilter">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <filter id="proShadow">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#8B5CF6" flood-opacity="0.6"/>
                </filter>
            </defs>
            
            <!-- Background -->
            <rect width="500" height="500" fill="#0A0A0F"/>
            
            <!-- Animated glow effect -->
            <circle cx="250" cy="250" r="220" fill="url(#proGlow)" opacity="0.6"/>
            
            <!-- Outer decorative rings -->
            <circle cx="250" cy="250" r="200" stroke="url(#proGradient1)" stroke-width="2" stroke-dasharray="8 4" opacity="0.4" filter="url(#proGlowFilter)"/>
            <circle cx="250" cy="250" r="180" stroke="url(#proGradient2)" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.3"/>
            
            <!-- Main card background with gradient -->
            <rect x="100" y="100" width="300" height="300" rx="60" fill="url(#proGradient1)" opacity="0.95" filter="url(#proShadow)"/>
            
            <!-- Inner highlight -->
            <rect x="120" y="120" width="260" height="260" rx="50" fill="url(#proGradient2)" opacity="0.3"/>
            
            <!-- Decorative corner elements -->
            <path d="M 100 100 L 140 100 L 100 140 Z" fill="url(#proGradient1)" opacity="0.6"/>
            <path d="M 400 100 L 400 140 L 360 100 Z" fill="url(#proGradient1)" opacity="0.6"/>
            <path d="M 100 400 L 140 400 L 100 360 Z" fill="url(#proGradient1)" opacity="0.6"/>
            <path d="M 400 400 L 400 360 L 360 400 Z" fill="url(#proGradient1)" opacity="0.6"/>
            
            <!-- Particle effects -->
            <circle cx="150" cy="150" r="3" fill="#EC4899" opacity="0.8" filter="url(#proGlowFilter)"/>
            <circle cx="350" cy="150" r="2.5" fill="#3B82F6" opacity="0.8" filter="url(#proGlowFilter)"/>
            <circle cx="150" cy="350" r="2.5" fill="#8B5CF6" opacity="0.8" filter="url(#proGlowFilter)"/>
            <circle cx="350" cy="350" r="3" fill="#F59E0B" opacity="0.8" filter="url(#proGlowFilter)"/>
            <circle cx="250" cy="120" r="2" fill="#10B981" opacity="0.7" filter="url(#proGlowFilter)"/>
            <circle cx="250" cy="380" r="2" fill="#EC4899" opacity="0.7" filter="url(#proGlowFilter)"/>
            
            <!-- PRO text -->
            <text x="250" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="72" filter="url(#proGlowFilter)" letter-spacing="0.1em">PRO</text>
            
            <!-- CREATOR text -->
            <text x="250" y="240" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="0.2em">CREATOR</text>
            
            <!-- Enhanced features text -->
            <text x="250" y="300" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="600" opacity="0.9">PREMIUM MEMBERSHIP</text>
            <text x="250" y="330" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="12" font-weight="500">UNLIMITED VERIFICATION</text>
            <text x="250" y="360" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="11" font-weight="500">ON-CHAIN PROOF</text>
        </svg>
    `;

    const svgDataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;

    return (
        <div className={`${sizeClasses[size]} rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/30 bg-black ${className}`}>
            <img
                src={svgDataUri}
                alt="Pro Creator Passport NFT"
                className="w-full h-full object-cover"
            />
        </div>
    );
};

