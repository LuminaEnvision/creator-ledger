import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { Link } from 'react-router-dom';
import { useFarcaster } from '../context/FarcasterContext';
import { checkPremiumStatus } from '../lib/premium';

interface ProfileDisplayProps {
    walletAddress: string;
    showAvatar?: boolean;
    showLink?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showFid?: boolean;
    isPremium?: boolean; // Optional prop to pass premium status directly
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
    walletAddress,
    showAvatar = true,
    showLink = false,
    size = 'md',
    className = '',
    showFid = false,
    isPremium: propIsPremium
}) => {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const { user: farcasterUser } = useFarcaster();

    // Fetch ENS name
    const { data: ensName } = useEnsName({
        address: walletAddress as `0x${string}`,
        chainId: mainnet.id,
        query: {
            enabled: !!walletAddress && walletAddress.startsWith('0x'),
            retry: 0,
            refetchOnWindowFocus: false,
        }
    });

    // Check if wallet address matches current Farcaster user
    const isFarcasterUser = useMemo(() => {
        if (!farcasterUser || !walletAddress) return false;
        
        const normalizedWallet = walletAddress.toLowerCase();
        
        // Check custody address
        if (farcasterUser.custodyAddress?.toLowerCase() === normalizedWallet) {
            return true;
        }
        
        // Check verified addresses
        if (farcasterUser.verifications?.some(
            (addr: string) => addr.toLowerCase() === normalizedWallet
        )) {
            return true;
        }
        
        return false;
    }, [farcasterUser, walletAddress]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!walletAddress) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch profile data
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('display_name, avatar_url')
                    .eq('wallet_address', walletAddress.toLowerCase())
                    .maybeSingle();

                setProfile(profileData);

                // Fetch premium status if not provided as prop
                if (propIsPremium === undefined) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('is_premium, subscription_active, subscription_end')
                        .eq('wallet_address', walletAddress.toLowerCase())
                        .maybeSingle();

                    const premiumStatus = checkPremiumStatus(userData, walletAddress);
                    setIsPremium(premiumStatus);
                } else {
                    setIsPremium(propIsPremium);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [walletAddress, propIsPremium]);

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
        );
    }

    // Priority: Farcaster > profile display_name > ENS > truncated address
    const displayName = isFarcasterUser && farcasterUser?.displayName
        ? farcasterUser.displayName
        : isFarcasterUser && farcasterUser?.username
        ? farcasterUser.username
        : profile?.display_name || ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    
    // Priority: Farcaster pfpUrl > profile avatar_url > null
    const avatarUrl = isFarcasterUser && farcasterUser?.pfpUrl
        ? farcasterUser.pfpUrl
        : profile?.avatar_url;

    const sizeClasses = {
        sm: { avatar: 'w-6 h-6', text: 'text-xs' },
        md: { avatar: 'w-8 h-8', text: 'text-sm' },
        lg: { avatar: 'w-10 h-10', text: 'text-base' }
    };

    const content = (
        <div className={`flex items-center gap-2 ${className}`}>
            {showAvatar && (
                avatarUrl ? (
                    <img 
                        src={avatarUrl} 
                        alt={displayName}
                        className={`${sizeClasses[size].avatar} rounded-full object-cover border-2 border-primary/20`}
                    />
                ) : (
                    <div className={`${sizeClasses[size].avatar} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold ${sizeClasses[size].text}`}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )
            )}
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className={`${sizeClasses[size].text} font-medium ${(isFarcasterUser && farcasterUser?.displayName) || profile?.display_name ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {displayName}
                    </span>
                    {isPremium && (
                        <svg 
                            className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-label="Verified Pro Creator"
                        >
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                {showFid && isFarcasterUser && farcasterUser?.fid && (
                    <span className="text-xs text-muted-foreground">
                        FID: {farcasterUser.fid}
                    </span>
                )}
            </div>
        </div>
    );

    if (showLink) {
        return (
            <Link to={`/u/${walletAddress}`} className="hover:opacity-80 transition-opacity">
                {content}
            </Link>
        );
    }

    return content;
};

