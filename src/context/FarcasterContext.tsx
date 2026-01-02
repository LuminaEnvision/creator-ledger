import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
    fid: number | null;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
    bio: string | null;
    custodyAddress: string | null;
    verifications: string[];
}

interface FarcasterContextType {
    user: FarcasterUser | null;
    isLoading: boolean;
    error: string | null;
    isAvailable: boolean;
    connectWallet: () => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export const FarcasterProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FarcasterUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean>(false);

    // Check if Farcaster SDK is available
    useEffect(() => {
        const checkAvailability = async () => {
            try {
                // Check if we're in a Farcaster environment
                const context = await sdk.context;
                setIsAvailable(!!context);
                
                if (context) {
                    // Fetch user data
                    await fetchUserData();
                }
            } catch (err) {
                console.log('Farcaster SDK not available:', err);
                setIsAvailable(false);
            }
        };

        checkAvailability();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const context = await sdk.context;
            
            if (!context) {
                setIsAvailable(false);
                return;
            }

            const farcasterUser: FarcasterUser = {
                fid: context.user?.fid || null,
                username: context.user?.username || null,
                displayName: context.user?.displayName || null,
                pfpUrl: context.user?.pfpUrl || null,
                bio: (context.user as any)?.bio || null,
                custodyAddress: (context.user as any)?.custodyAddress || null,
                verifications: (context.user as any)?.verifications || [],
            };

            setUser(farcasterUser);
        } catch (err: any) {
            console.error('Error fetching Farcaster user data:', err);
            setError(err.message || 'Failed to fetch Farcaster user data');
        } finally {
            setIsLoading(false);
        }
    };

    const connectWallet = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Get Ethereum provider from Farcaster SDK
            // The SDK provides an EIP-1193 compatible provider
            const provider = await sdk.wallet.getEthereumProvider();
            
            if (!provider) {
                throw new Error('Wallet provider not available');
            }

            // Request account access
            await provider.request({ method: 'eth_requestAccounts' });

            // The Farcaster SDK provider should be EIP-1193 compatible
            // Wagmi's injected connector should detect it automatically
            // If needed, we can expose it via window.ethereum for wagmi to detect
            if (typeof window !== 'undefined' && provider) {
                // Expose provider for wagmi to detect
                (window as any).ethereum = provider;
            }

            console.log('✅ Farcaster wallet connected');
            
            // Refresh user data after wallet connection
            await fetchUserData();
        } catch (err: any) {
            console.error('Error connecting Farcaster wallet:', err);
            setError(err.message || 'Failed to connect wallet');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FarcasterContext.Provider value={{ user, isLoading, error, isAvailable, connectWallet }}>
            {children}
        </FarcasterContext.Provider>
    );
};

export const useFarcaster = () => {
    const context = useContext(FarcasterContext);
    if (context === undefined) {
        // Return default values if not in FarcasterProvider
        return {
            user: null,
            isLoading: false,
            error: null,
            isAvailable: false,
            connectWallet: async () => {},
        };
    }
    return context;
};

