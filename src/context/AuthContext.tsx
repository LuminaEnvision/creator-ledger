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

    useEffect(() => {
        const syncUser = async () => {
            if (!isConnected || !address) {
                setUser(null);
                return;
            }

            setIsLoading(true);
            try {
                const walletAddress = address.toLowerCase();

                // Check if we have a valid auth token
                let token = await getAuthToken();
                
                // If no token, authenticate with wallet
                if (!token && signMessageAsync) {
                    try {
                        const authResult = await authenticateWithWallet(walletAddress, signMessageAsync);
                        token = authResult.access_token;
                    } catch (authError: any) {
                        console.warn('Wallet authentication failed, will try Edge Function:', authError);
                        // Continue to try Edge Function call - it will handle auth
                    }
                }

                // Use Edge Functions to get/create user (no direct DB access)
                // Only try if we have a token (user is authenticated)
                if (token) {
                    try {
                        const { user: userData } = await edgeFunctions.getUser();
                        
                        if (userData) {
                            setUser({
                                walletAddress: userData.wallet_address,
                                createdAt: userData.created_at,
                            });
                        } else {
                            // Create new user via Edge Function
                            const { user: newUser } = await edgeFunctions.createUser();
                            setUser({
                                walletAddress: newUser.wallet_address,
                                createdAt: newUser.created_at,
                            });
                        }
                    } catch (edgeError: any) {
                        console.warn('Edge Function failed:', edgeError);
                        // If getUser/createUser fails, still set user from wallet (they can view entries)
                        setUser({
                            walletAddress: walletAddress,
                            createdAt: new Date().toISOString(),
                        });
                    }
                } else {
                    // No token - user not authenticated yet, but they can still view public data
                    // Set user from wallet address so they can see entries
                    setUser({
                        walletAddress: walletAddress,
                        createdAt: new Date().toISOString(),
                    });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        syncUser();
    }, [address, isConnected, signMessageAsync]);

    return (
        <AuthContext.Provider value={{ user, isLoading, error }}>
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
