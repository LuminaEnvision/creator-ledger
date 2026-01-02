import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '../context/FarcasterContext';
import { getEnvironment } from '../lib/environment';
import { useAccount } from 'wagmi';

export const WalletConnect: React.FC = () => {
    const { isAvailable: isFarcasterAvailable, user: farcasterUser } = useFarcaster();
    const { isConnected } = useAccount();
    const env = getEnvironment();

    // In Farcaster, show Farcaster user info if available
    if (env.isFarcaster && isFarcasterAvailable && farcasterUser) {
        return (
            <div className="flex items-center gap-3">
                {farcasterUser.pfpUrl && (
                    <img 
                        src={farcasterUser.pfpUrl} 
                        alt={farcasterUser.username || 'Farcaster user'} 
                        className="w-8 h-8 rounded-full"
                    />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                    {farcasterUser.displayName || farcasterUser.username || 'Farcaster User'}
                </span>
                {!isConnected && (
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

    // Default RainbowKit connect button
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
