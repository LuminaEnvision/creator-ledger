import React from 'react';

interface PremiumPassportProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    walletAddress?: string;
    entryCount?: number;
    username?: string;
    since?: string;
}

export const PremiumPassport: React.FC<PremiumPassportProps> = ({
    className = '',
    size = 'md',
    walletAddress = '0x00...0000',
    entryCount = 0,
    username,
}) => {
    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48 md:w-64 md:h-64',
        lg: 'w-64 h-64 md:w-80 md:h-80'
    };

    const truncatedAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';
    const nameDisplay = username || "Pro Creator";

    const svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="proBg" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#000000" />
                    <stop offset="50%" stop-color="#120a1f" />
                    <stop offset="100%" stop-color="#0f0716" />
                </linearGradient>
                
                <linearGradient id="goldGradient" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#fbbf24" />
                    <stop offset="25%" stop-color="#d97706" />
                    <stop offset="50%" stop-color="#f59e0b" />
                    <stop offset="75%" stop-color="#b45309" />
                    <stop offset="100%" stop-color="#fbbf24" />
                </linearGradient>

                <linearGradient id="purpleGlow" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#c084fc" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
                </linearGradient>

                <filter id="goldGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                <pattern id="hex-pattern" x="0" y="0" width="30" height="52" patternUnits="userSpaceOnUse">
                     <path d="M15 0 L30 8 L30 25 L15 33 L0 25 L0 8 Z" fill="none" stroke="rgba(251, 191, 36, 0.03)" />
                </pattern>
            </defs>

            <!-- Background -->
            <rect width="400" height="400" rx="40" fill="url(#proBg)" />
            <rect width="400" height="400" rx="40" fill="url(#hex-pattern)" />
            
            <!-- Metallic Border -->
            <rect x="5" y="5" width="390" height="390" rx="35" stroke="url(#goldGradient)" stroke-width="2" opacity="0.5" />
            
            <!-- Glow Orb -->
            <circle cx="350" cy="50" r="120" fill="url(#purpleGlow)" filter="url(#goldGlow)" opacity="0.6"/>

            <!-- Header -->
            <text x="400" y="60" text-anchor="end" x-padding="30" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="32" fill="url(#goldGradient)" filter="url(#goldGlow)" dx="-30">PRO</text>
            <text x="400" y="85" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="14" fill="#ddd" dx="-30" letter-spacing="3">PASSPORT</text>

            <!-- Main Stat Ring (Double) -->
            <path d="M 120 200 A 80 80 0 1 1 280 200 A 80 80 0 1 1 120 200" stroke="#333" stroke-width="2" fill="none"/>
            <path d="M 110 200 A 90 90 0 1 1 290 200 A 90 90 0 1 1 110 200" stroke="url(#goldGradient)" stroke-width="1" stroke-dasharray="8 4" opacity="0.5" fill="none" class="spin"/>
            
            <!-- Center Stats -->
            <text x="200" y="195" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="56" fill="white" filter="url(#goldGlow)">${entryCount}</text>
            <text x="200" y="225" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="12" fill="#d97706" letter-spacing="2" uppercase="true">VERIFIED WORKS</text>

            <!-- Bottom Section -->
            <rect x="0" y="300" width="400" height="100" fill="rgba(255,255,255,0.03)" backdrop-filter="blur(10px)"/>
            <line x1="0" y1="300" x2="400" y2="300" stroke="url(#goldGradient)" stroke-width="1" opacity="0.3"/>
            
            <text x="40" y="340" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="18" fill="white">${nameDisplay}</text>
            <text x="40" y="365" font-family="monospace" font-size="12" fill="#9ca3af">${truncatedAddress}</text>
            
            <g transform="translate(320, 335)">
                <circle r="15" fill="#16a34a" fill-opacity="0.2" stroke="#22c55e" stroke-width="1.5"/>
                <path d="M -4 0 L -1 3 L 5 -3" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </g>
        </svg>
    `;

    const svgDataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;

    return (
        <div className={`${sizeClasses[size]} relative group rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-amber-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <img
                src={svgDataUri}
                alt="Premium Creator Passport"
                className="relative z-10 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 rounded-[2.5rem] border border-white/10 group-hover:border-amber-500/30 transition-colors pointer-events-none" />
        </div>
    );
};
