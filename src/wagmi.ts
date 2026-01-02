import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, baseSepolia, celo, celoSepolia } from 'wagmi/chains';

// Wallets will be detected automatically via EIP-1193 provider
// Base Account and other compatible wallets expose window.ethereum when available
export const config = getDefaultConfig({
    appName: 'Creator Ledger',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains: [baseSepolia, base, mainnet, polygon, optimism, arbitrum, celo, celoSepolia], // Base Sepolia first (default)
    ssr: false, // Because we are using Vite (SPA)
    // WalletConnect configuration for better Safari compatibility
    walletConnectParameters: {
        metadata: {
            name: 'Creator Ledger',
            description: 'Verified Content Portfolio',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://creatorledger.com',
            icons: typeof window !== 'undefined' && window.location.origin 
                ? [`${window.location.origin}/assets/logo.png`] 
                : ['https://creatorledger.com/assets/logo.png'],
        },
        // Improve Safari compatibility - use light theme for better visibility
        qrModalOptions: {
            themeMode: 'light',
        },
    },
});
