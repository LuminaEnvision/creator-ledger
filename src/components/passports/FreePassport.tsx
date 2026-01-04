import React, { useMemo } from 'react';

interface FreePassportProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    walletAddress?: string;
    entryCount?: number;
    username?: string;
}

export const FreePassport: React.FC<FreePassportProps> = ({
    className = '',
    size = 'md',
    walletAddress = '0x00...0000',
    entryCount = 0,
}) => {
    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48 md:w-64 md:h-64',
        lg: 'w-64 h-64 md:w-80 md:h-80'
    };

    // Deterministic geometric pattern based on address
    const pattern = useMemo(() => {
        return (
            <pattern id="grid-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
        );
    }, []);

    const truncatedAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

    const svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cardGradient" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#1e293b" />
                    <stop offset="100%" stop-color="#0f172a" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#818cf8" />
                </linearGradient>
                <filter id="shadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25"/>
                </filter>
                ${pattern}
            </defs>

            <!-- Card Background -->
            <rect width="400" height="400" rx="30" fill="url(#cardGradient)" />
            
            <!-- Texture -->
            <rect width="400" height="400" rx="30" fill="url(#grid-pattern)" />
            
            <!-- Top Accent Line -->
            <rect x="20" y="20" width="360" height="4" rx="2" fill="url(#accentGradient)" />

            <!-- Header -->
            <text x="40" y="70" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="24" fill="white" letter-spacing="0.5">CREATOR</text>
            <text x="40" y="100" font-family="Inter, system-ui, sans-serif" font-weight="400" font-size="16" fill="#94a3b8" letter-spacing="2">PASSPORT</text>

            <!-- Circular Progress / Status Ring -->
            <circle cx="200" cy="200" r="80" stroke="#334155" stroke-width="8" fill="none" />
            <circle cx="200" cy="200" r="80" stroke="url(#accentGradient)" stroke-width="8" fill="none" stroke-dasharray="502" stroke-dashoffset="${502 - (Math.min(entryCount, 100) / 100) * 502}" stroke-linecap="round" transform="rotate(-90 200 200)" />
            
            <!-- Central Stat -->
            <text x="200" y="190" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="48" fill="white">${entryCount}</text>
            <text x="200" y="225" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="14" fill="#94a3b8" letter-spacing="1">ENTRIES</text>

            <!-- Bottom Info -->
            <rect x="30" y="310" width="340" height="60" rx="12" fill="rgba(255,255,255,0.05)" />
            
            <text x="50" y="335" font-family="monospace" font-size="14" fill="#64748b">ID</text>
            <text x="50" y="355" font-family="monospace" font-size="14" fill="#e2e8f0">${truncatedAddress}</text>

            <text x="350" y="345" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="14" fill="url(#accentGradient)">TIER: FREE</text>
        </svg>
    `;

    const svgDataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;

    return (
        <div className={`${sizeClasses[size]} relative group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
            <img
                src={svgDataUri}
                alt="Free Creator Passport"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
};
