import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { Link } from 'react-router-dom';

interface ProfileDisplayProps {
    walletAddress: string;
    showAvatar?: boolean;
    showLink?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
    walletAddress,
    showAvatar = true,
    showLink = false,
    size = 'md',
    className = ''
}) => {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        const fetchProfile = async () => {
            if (!walletAddress) {
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name, avatar_url')
                    .eq('wallet_address', walletAddress.toLowerCase())
                    .maybeSingle();

                setProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [walletAddress]);

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
        );
    }

    // Priority: profile display_name > ENS > truncated address
    const displayName = profile?.display_name || ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    const avatarUrl = profile?.avatar_url;

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
                        className={`${sizeClasses[size].avatar} rounded-full object-cover`}
                    />
                ) : (
                    <div className={`${sizeClasses[size].avatar} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold ${sizeClasses[size].text}`}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )
            )}
            <span className={`${sizeClasses[size].text} font-medium ${profile?.display_name ? 'text-foreground' : 'text-muted-foreground'}`}>
                {displayName}
            </span>
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

