import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '../context/FarcasterContext';
import { getEnvironment } from '../lib/environment';
import { useAccount } from 'wagmi';

export const WalletConnect: React.FC = () => {
    const { isAvailable: isFarcasterAvailable, user: farcasterUser, connectWallet: farcasterConnectWallet, isLoading: farcasterLoading } = useFarcaster();
    const { isConnected } = useAccount();
    const env = getEnvironment();
    const [isConnecting, setIsConnecting] = useState(false);

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
                        className="w-8 h-8 rounded-full"
                    />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                    {farcasterUser.displayName || farcasterUser.username || 'User'}
                </span>
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
