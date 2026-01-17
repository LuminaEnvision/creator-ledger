import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { edgeFunctions } from '../lib/edgeFunctions';
import { authenticateWithWallet, getAuthToken } from '../lib/supabaseAuth';
import type { User } from '../types';

// We override the AuthState interface slightly since RainbowKit handles connect/disconnect UI
interface RainbowAuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    // Helper function to request authentication when needed (e.g., when submitting entries)
    requestAuthentication: () => Promise<boolean>;
    // connect/disconnect are handled by RainbowKit UI, so we might not expose them or just keep them as no-ops/wrappers if needed
    // But for compatibility with existing code, let's keep the shape but they might not be used directly
}

const AuthContext = createContext<RainbowAuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to request authentication when needed (e.g., when submitting entries)
    const requestAuthentication = async (): Promise<boolean> => {
        if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        if (!signMessageAsync || typeof signMessageAsync !== 'function') {
            throw new Error('Wallet signing not available. Please reconnect your wallet and try again.');
        }

        try {
            const walletAddress = address.toLowerCase();
            const authResult = await authenticateWithWallet(walletAddress, signMessageAsync);
            
            // Update user state with authenticated user
            if (authResult.user) {
                setUser({
                    walletAddress: authResult.user.user_metadata?.wallet_address || walletAddress,
                    createdAt: authResult.user.created_at || new Date().toISOString(),
                });
            }
            
            return true;
        } catch (authError: any) {
            console.error('Authentication failed:', authError);
            throw authError;
        }
    };

    useEffect(() => {
        const syncUser = async () => {
            if (!isConnected || !address) {
                setUser(null);
                return;
            }

            setIsLoading(true);
            try {
                const walletAddress = address.toLowerCase();

                // NEW FLOW: Don't automatically authenticate with signature
                // User can browse without signing. Signature will be requested when they try to submit/create entries.
                
                // Check if we have a valid auth token (from previous session)
                const token = await getAuthToken();

                // If we have a token, try to get user data
                if (token) {
                    try {
                        const { user: userData } = await edgeFunctions.getUser();
                        
                        if (userData) {
                            setUser({
                                walletAddress: userData.wallet_address,
                                createdAt: userData.created_at,
                            });
                        }
                    } catch (edgeError: any) {
                        // Token might be expired or invalid - that's okay, user can still browse
                        console.log('ℹ️ Token invalid or expired, user can browse without auth:', edgeError.message);
                    }
                }

                // Set user from wallet address so they can see entries (even without auth)
                // This allows browsing without requiring signature
                setUser({
                    walletAddress: walletAddress,
                    createdAt: new Date().toISOString(),
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        syncUser();
    }, [address, isConnected]);

    return (
        <AuthContext.Provider value={{ user, isLoading, error, requestAuthentication }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
