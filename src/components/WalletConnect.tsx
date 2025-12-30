import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnect: React.FC = () => {
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
