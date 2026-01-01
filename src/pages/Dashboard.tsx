import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CreateEntryForm } from '../components/CreateEntryForm';
import { EntryList } from '../components/EntryList';
import type { LedgerEntry } from '../types';
import { CustomizeProfileForm } from '../components/CustomizeProfileForm';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { exportToCSV, exportToPDF } from '../lib/export';
import { SignInWithBaseButton } from '@base-org/account-ui/react';
import { createBaseAccountSDK } from '@base-org/account';
import { DynamicNFT } from '../components/DynamicNFT';
import { PassportMintButton } from '../components/PassportMintButton';
import { PortfolioCollections } from '../components/PortfolioCollections';
import { NFTImageFrame } from '../components/NFTImageFrame';
import { isPremiumWhitelisted } from '../lib/premium';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [, setIsBaseAuthLoading] = useState(false);
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Handle Base account authentication
    const handleBaseSignIn = async () => {
        setIsBaseAuthLoading(true);
        try {
            const baseAccountSDK = createBaseAccountSDK({ appName: 'Creator Ledger' });
            const provider = baseAccountSDK.getProvider();
            
            // Request connection to Base account
            await provider.request({ method: 'eth_requestAccounts' });
            
            // Switch to Base Sepolia network if not already on it
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x14a34' }], // Base Sepolia chain ID in hex
                });
            } catch (switchError: any) {
                // If chain doesn't exist, add it
                if (switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x14a34',
                            chainName: 'Base Sepolia',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: ['https://sepolia.base.org'],
                            blockExplorerUrls: ['https://sepolia.basescan.org'],
                        }],
                    });
                }
            }
            
            // After connection, the wagmi useAccount hook will detect the connection
            // and AuthContext will sync the user
            console.log('✅ Base account connected');
        } catch (error: any) {
            console.error('Base account authentication error:', error);
            if (error.code !== 4001) { // User rejected
                alert('Failed to connect Base account. Please try again.');
            }
        } finally {
            setIsBaseAuthLoading(false);
        }
    };
    
    // Check for refresh parameter and trigger refresh
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        const premiumParam = searchParams.get('premium');
        
        if (refreshParam || premiumParam) {
            console.log('🔄 Refresh triggered from URL params:', { refreshParam, premiumParam });
            // Force immediate refresh
            setRefreshTrigger(prev => prev + 1);
            // Remove the parameters from URL
            searchParams.delete('refresh');
            searchParams.delete('premium');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            setIsLoading(true);

            // 1. Fetch user premium status and check subscription
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_premium, subscription_active, subscription_end')
                .eq('wallet_address', user.walletAddress.toLowerCase())
                .maybeSingle(); // Use maybeSingle to avoid errors

            if (userError) {
                console.error('Error fetching user data:', userError);
            }

            if (userData) {
                // Check if subscription is still active (not expired)
                const now = new Date();
                const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null;
                
                // Check if subscription is active (not null/undefined, equals true, and not expired)
                const hasActiveSubscription = userData.subscription_active === true;
                const isNotExpired = !subscriptionEnd || subscriptionEnd > now;
                const isActive = hasActiveSubscription && isNotExpired;
                
                // Premium status: Active subscription OR legacy premium flag (if no subscription system was used)
                // OR whitelisted for testing
                const hasSubscription = userData.subscription_active !== null && userData.subscription_active !== undefined;
                const dbPremiumStatus = isActive || (!hasSubscription && userData.is_premium === true);
                const isWhitelisted = isPremiumWhitelisted(user.walletAddress);
                const premiumStatus = dbPremiumStatus || isWhitelisted;
                
                console.log('Premium check:', {
                    wallet: user.walletAddress.toLowerCase(),
                    subscription_active: userData.subscription_active,
                    subscription_end: subscriptionEnd?.toISOString(),
                    subscription_end_parsed: subscriptionEnd,
                    is_premium: userData.is_premium,
                    now: now.toISOString(),
                    hasActiveSubscription,
                    isNotExpired,
                    isActive,
                    hasSubscription,
                    dbPremiumStatus,
                    isWhitelisted,
                    premiumStatus,
                    currentIsPremium: isPremium,
                    rawData: userData
                });
                
                if (isWhitelisted) {
                    console.log('✅ Premium whitelist active for wallet:', user.walletAddress.toLowerCase());
                }
                
                setIsPremium(premiumStatus);
                
                // Force update if premium status changed
                if (premiumStatus !== isPremium) {
                    console.log('✅ Premium status changed!', { from: isPremium, to: premiumStatus });
                }
                
                // Auto-update if subscription expired
                if (hasActiveSubscription && subscriptionEnd && subscriptionEnd <= now) {
                    console.log('⚠️ Subscription expired, updating database...');
                    await supabase
                        .from('users')
                        .update({ 
                            subscription_active: false,
                            is_premium: false 
                        })
                        .eq('wallet_address', user.walletAddress.toLowerCase());
                    setIsPremium(false);
                }
            } else {
                console.warn('⚠️ No user data found for wallet:', user.walletAddress.toLowerCase());
                console.warn('⚠️ This might mean the user doesn\'t exist in the database yet.');
                console.warn('⚠️ Try clicking "Test Premium" again, or the user will be created on first entry submission.');
                setIsPremium(false);
            }

            // 2. Fetch entries (show all, but unverified will be marked)
            const { data, error } = await supabase
                .from('ledger_entries')
                .select('*')
                .eq('wallet_address', user.walletAddress.toLowerCase())
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching entries:', error);
            } else {
                setEntries(data || []);
            }
            setIsLoading(false);
        };

        fetchUserData();
    }, [user, refreshTrigger]);

    // Also refetch when page becomes visible (user might have upgraded in another tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                setRefreshTrigger(prev => prev + 1);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="glass-card max-w-md w-full text-center space-y-8 p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-black flex items-center justify-center shadow-2xl relative group overflow-hidden border border-white/10">
                        <img src="/assets/logo.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Logo" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">
                            Creator <span className="text-primary">Ledger</span>
                        </h2>
                        <p className="text-muted-foreground text-lg font-medium leading-relaxed px-4">
                            Sign in with Base Account for seamless authentication.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <SignInWithBaseButton
                            align="center"
                            variant="solid"
                            colorScheme="dark"
                            onClick={handleBaseSignIn}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 max-w-4xl mx-auto px-3 ${isPremium ? 'premium-bg' : ''}`}>
            <div className="glass-card p-4 sm:p-6 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                Dashboard
                        </h2>
                            {isPremium && (
                                <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-primary to-accent text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/30">
                                    PRO
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isPremium ? 'Pro Creator' : 'Track and verify content'}
                        </p>
                        <div className="flex gap-2 mt-3">
                        <button
                                onClick={() => setIsEditingProfile(!isEditingProfile)}
                                className="px-4 py-2 rounded-lg glass-card text-xs font-bold hover:bg-accent/20 transition-all border border-primary/20 text-primary"
                            >
                                {isEditingProfile ? 'Cancel' : 'Customize Profile'}
                        </button>
                            {!isPremium && (
                                <Link
                                    to="/pricing"
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center shadow-lg shadow-primary/20"
                                >
                                    GO PRO
                                </Link>
                            )}
                        <button
                                onClick={async () => {
                                    console.log('🔄 Manual refresh triggered, current isPremium:', isPremium);
                                    console.log('🔄 Current user wallet:', user?.walletAddress);
                                    
                                    // Force immediate database fetch
                                    if (user) {
                                        const { data: userData, error } = await supabase
                                            .from('users')
                                            .select('is_premium, subscription_active, subscription_end, wallet_address')
                                            .eq('wallet_address', user.walletAddress.toLowerCase())
                                            .maybeSingle();
                                        
                                        console.log('🔄 Manual fetch result:', { userData, error });
                                        
                                        if (userData) {
                                            const now = new Date();
                                            const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null;
                                            const hasActiveSubscription = userData.subscription_active === true;
                                            const isNotExpired = !subscriptionEnd || subscriptionEnd > now;
                                            const isActive = hasActiveSubscription && isNotExpired;
                                            const hasSubscription = userData.subscription_active !== null && userData.subscription_active !== undefined;
                                            const dbPremiumStatus = isActive || (!hasSubscription && userData.is_premium === true);
                                            const isWhitelisted = isPremiumWhitelisted(user.walletAddress);
                                            const premiumStatus = dbPremiumStatus || isWhitelisted;
                                            
                                            console.log('🔄 Calculated premium status:', { dbPremiumStatus, isWhitelisted, premiumStatus });
                                            setIsPremium(premiumStatus);
                                        }
                                    }
                                    
                                    setRefreshTrigger(prev => prev + 1);
                                }}
                                className="px-3 py-1.5 rounded-lg glass-card text-[10px] font-bold hover:bg-accent/20 transition-all border border-border/50 text-muted-foreground"
                                title="Refresh premium status and data"
                            >
                                🔄
                        </button>
                        </div>
                        {isEditingProfile && (
                            <CustomizeProfileForm
                                onUpdate={() => setRefreshTrigger(prev => prev + 1)}
                                onClose={() => setIsEditingProfile(false)}
                            />
                        )}
                    </div>
                </div>

                {/* NFT Display Section - Clean and Centered */}
                <div className="mt-4 border-t border-border/50">
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="text-center">
                            <p className="text-lg font-black uppercase tracking-wider text-primary mb-1">Your Creator's Passport</p>
                            <p className="text-sm text-muted-foreground">Onchain proof of your original works</p>
                        </div>
                        
                        {user?.walletAddress && (
                            <>
                                {/* NFT - Simple and Centered */}
                                <div className="flex justify-center">
                                    {isPremium ? (
                                        <NFTImageFrame isPro={true} noMargin={true}>
                                            <DynamicNFT
                                                key={`${user.walletAddress}-${refreshTrigger}`}
                                                walletAddress={user.walletAddress}
                                                size="lg"
                                                mode="pro"
                                            />
                                        </NFTImageFrame>
                                    ) : (
                                        <DynamicNFT
                                            key={`${user.walletAddress}-${refreshTrigger}`}
                                            walletAddress={user.walletAddress}
                                            size="lg"
                                            mode="free"
                                        />
                                    )}
                                </div>
                                
                                <PassportMintButton
                                    walletAddress={user.walletAddress}
                                    verifiedEntriesCount={entries.filter(e => e.verification_status === 'Verified').length}
                                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Shareable Media Kit - Main Link (All Entries) */}
                <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-wider text-primary mb-1">Shareable Media Kit</h3>
                                    <p className="text-sm text-muted-foreground">Your complete portfolio with all {entries.filter(e => e.verification_status === 'Verified').length} verified entries</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Link
                                    to={`/u/${user.walletAddress}`}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/80 transition-all text-center shadow-lg shadow-primary/20"
                                >
                                    View
                                </Link>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/u/${user.walletAddress}`);
                                        alert('Link copied to clipboard!');
                                    }}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl glass-card text-sm font-bold hover:bg-accent/20 transition-all border border-border/50"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Collections - Optional Filtered Views */}
                {user?.walletAddress && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                        <PortfolioCollections
                            entries={entries}
                            walletAddress={user.walletAddress}
                        />
                    </div>
                )}
            </div>

            <CreateEntryForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />

            <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold">Your Submissions</h3>
                </div>
                    {isPremium && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    exportToCSV(entries);
                                    setTimeout(() => {
                                        const showInstructions = confirm(
                                            '📊 CSV Export Complete!\n\n' +
                                            'Your CSV file has been downloaded. Here\'s how to use it:\n\n' +
                                            '✨ Quick Tips:\n' +
                                            '• Import into Google Sheets or Excel\n' +
                                            '• Use for portfolio templates on Canva, Notion, or Airtable\n' +
                                            '• Create beautiful media kits with your verified content\n' +
                                            '• Share with brands and agencies\n\n' +
                                            'Would you like to see more detailed instructions?'
                                        );
                                        if (showInstructions) {
                                            window.open('https://www.canva.com/templates/', '_blank');
                                        }
                                    }, 500);
                                }}
                                disabled={entries.length === 0}
                                className="px-5 py-2.5 rounded-xl glass-card hover:bg-accent/20 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                title="Export your content data as CSV"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await exportToPDF(entries);
                                    } catch (error) {
                                        console.error('PDF export error:', error);
                                        alert('Error generating PDF. Please try again.');
                                    }
                                }}
                                disabled={entries.length === 0}
                                className="px-5 py-2.5 rounded-xl glass-card hover:bg-accent/20 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                title="Export your content as a beautiful PDF portfolio"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Export PDF</span>
                            </button>
                        </div>
                    )}
                    {!isPremium && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    alert('🔒 Premium Feature\n\nExport your content library as CSV or PDF is available for Pro Creators.\n\nUpgrade to Pro to:\n• Export CSV for portfolio templates\n• Generate beautiful PDF portfolios\n• Remove submission fees');
                                    navigate('/pricing');
                                }}
                                className="px-5 py-2.5 rounded-xl glass-card hover:bg-accent/20 text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative group"
                                title="Premium feature - Upgrade to unlock"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Export CSV</span>
                                <svg className="w-3 h-3 ml-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    alert('🔒 Premium Feature\n\nExport your content library as CSV or PDF is available for Pro Creators.\n\nUpgrade to Pro to:\n• Export CSV for portfolio templates\n• Generate beautiful PDF portfolios\n• Remove submission fees');
                                    navigate('/pricing');
                                }}
                                className="px-5 py-2.5 rounded-xl glass-card hover:bg-accent/20 text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative group"
                                title="Premium feature - Upgrade to unlock"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Export PDF</span>
                                <svg className="w-3 h-3 ml-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <EntryList 
                    entries={entries} 
                    isLoading={isLoading} 
                    isPremium={isPremium}
                    currentWalletAddress={user?.walletAddress}
                    onEntryUpdated={() => setRefreshTrigger(prev => prev + 1)}
                />
            </div>

        </div>
    );
};
