import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../lib/supabase';
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

                // Check if user exists in DB
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('wallet_address, created_at, is_premium, subscription_active, subscription_end')
                    .eq('wallet_address', walletAddress)
                    .maybeSingle(); // Use maybeSingle to avoid errors if not found

                if (fetchError) {
                    // 406 errors are usually transient Supabase issues - log but don't break
                    if (fetchError.code === '406' || fetchError.message?.includes('Not Acceptable')) {
                        console.warn('Supabase API error (non-critical):', fetchError.message);
                    } else if (fetchError.code !== 'PGRST116') {
                        console.error('Error fetching user:', fetchError);
                    }
                }

                if (existingUser) {
                    setUser({
                        walletAddress: existingUser.wallet_address,
                        createdAt: existingUser.created_at,
                    });
                } else {
                    // Create new user
                    const { data: newUser, error: insertError } = await supabase
                        .from('users')
                        .insert([{ wallet_address: walletAddress }])
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error creating user:', insertError);
                        // Fallback
                        setUser({
                            walletAddress: walletAddress,
                            createdAt: new Date().toISOString(),
                        });
                    } else {
                        setUser({
                            walletAddress: newUser.wallet_address,
                            createdAt: newUser.created_at,
                        });
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        syncUser();
    }, [address, isConnected]);

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
