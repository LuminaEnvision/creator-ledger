import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '../context/FarcasterContext';
import { getEnvironment } from '../lib/environment';
import { useAccount } from 'wagmi';

export const WalletConnect: React.FC = () => {
    const { isAvailable: isFarcasterAvailable, user: farcasterUser } = useFarcaster();
    const { isConnected, address } = useAccount();
    const env = getEnvironment();

    // Only show wallet connect if user is already connected
    // Per Base guidelines: "Do not show a connect button on first load"
    // Wallet connection should be triggered when needed (e.g., submitting entry)

    // Show user info if available in current environment
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
                {/* Only show connect if not connected - but this should be rare on first load */}
                {!isConnected && address && (
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

    // Only show connect button if already connected (for account management)
    // Or if user explicitly needs to connect (handled by CreateEntryForm)
    if (isConnected || address) {
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
    }

    // Don't show connect button on first load per Base guidelines
    // Connection will be prompted when user tries to submit entry
    return null;
};
