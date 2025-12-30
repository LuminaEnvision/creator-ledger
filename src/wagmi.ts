import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, baseSepolia, celo, celoSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Creator Ledger',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains: [baseSepolia, base, mainnet, polygon, optimism, arbitrum, celo, celoSepolia], // Base Sepolia first (default)
    ssr: false, // Because we are using Vite (SPA)
});
