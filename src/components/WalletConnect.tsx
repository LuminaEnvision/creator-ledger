import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '../context/FarcasterContext';
import { getEnvironment } from '../lib/environment';
import { useAccount } from 'wagmi';
import { edgeFunctions } from '../lib/edgeFunctions';
import { checkPremiumStatus } from '../lib/premium';
import { useAuth } from '../context/AuthContext';

export const WalletConnect: React.FC = () => {
    const { isAvailable: isFarcasterAvailable, user: farcasterUser, connectWallet: farcasterConnectWallet, isLoading: farcasterLoading } = useFarcaster();
    const { isConnected, address } = useAccount();
    const { user } = useAuth();
    const env = getEnvironment();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    // Check premium status
    useEffect(() => {
        const checkPremium = async () => {
            const walletAddress = user?.walletAddress || address;
            if (!walletAddress) {
                setIsPremium(false);
                return;
            }

            try {
                const { user: userData } = await edgeFunctions.getUser();

                const premiumStatus = checkPremiumStatus(userData, walletAddress);
                setIsPremium(premiumStatus);
            } catch (err) {
                console.error('Error checking premium status:', err);
                setIsPremium(false);
            }
        };

        checkPremium();
    }, [user, address]);

    const handleFarcasterConnect = async () => {
        if (!farcasterConnectWallet) return;
        setIsConnecting(true);
        try {
            await farcasterConnectWallet();
        } catch (err) {
            console.error('Failed to connect wallet:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    // In Farcaster environment: show profile and connect button when disconnected
    if (env.isFarcaster && isFarcasterAvailable && farcasterUser) {
        return (
            <div className="flex items-center gap-3">
                {farcasterUser.pfpUrl && (
                    <img 
                        src={farcasterUser.pfpUrl} 
                        alt={farcasterUser.username || 'User'} 
                        className="w-10 h-10 rounded-full border-2 border-primary/30 shadow-lg"
                    />
                )}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">
                            {farcasterUser.displayName || farcasterUser.username || 'User'}
                        </span>
                        {isPremium && (
                            <svg 
                                className="w-4 h-4 text-primary" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                aria-label="Verified Pro Creator"
                            >
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    {farcasterUser.fid && (
                        <span className="text-xs text-muted-foreground">
                            FID: {farcasterUser.fid}
                        </span>
                    )}
                </div>
                {/* Show connect button when disconnected */}
                {!isConnected ? (
                    <button
                        onClick={handleFarcasterConnect}
                        disabled={isConnecting || farcasterLoading}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting || farcasterLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                ) : (
                    <ConnectButton
                        showBalance={false}
                        chainStatus="icon"
                        accountStatus={{
                            smallScreen: 'avatar',
                            largeScreen: 'full',
                        }}
                    />
                )}
            </div>
        );
    }

    // For non-Farcaster environments: always show ConnectButton
    return (
        <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
            }}
        />
    );
};
