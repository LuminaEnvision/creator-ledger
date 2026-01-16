import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { edgeFunctions } from '../lib/edgeFunctions';
import { EntryList } from '../components/EntryList';
import type { LedgerEntry } from '../types';
import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { PassportDisplay } from '../components/PassportDisplay';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export const PublicProfile: React.FC = () => {
    const { address } = useParams<{ address: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showPassport, setShowPassport] = useState(false);
    const { showToast } = useToast();

    // Only fetch ENS name if address is valid, and handle errors gracefully
    const { data: ensName, error: ensError } = useEnsName({
        address: address ? (address as `0x${string}`) : undefined,
        chainId: mainnet.id,
        query: {
            enabled: !!address && address.startsWith('0x'),
            retry: 0, // Disable retries to avoid CORS spam
            refetchOnWindowFocus: false, // Don't refetch on focus
        }
    });

    // Suppress ENS errors (CORS issues are expected with third-party services)
    useEffect(() => {
        if (ensError && !ensError.message?.includes('CORS')) {
            // Only log non-CORS errors
            console.warn('ENS resolution error (non-critical):', ensError.message);
        }
    }, [ensError]);

    useEffect(() => {
        const fetchPublicData = async () => {
            if (!address) return;

            setIsLoading(true);
            try {
                // Normalize address to lowercase for consistent queries
                const normalizedAddress = address.toLowerCase();

                // Fetch profile info
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('wallet_address', normalizedAddress)
                    .maybeSingle();

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 is "not found" which is expected for users without profiles
                    if (profileError.code === 'NOT_FOUND' || profileError.message?.includes('NOT_FOUND')) {
                        console.warn('Profiles table not found or RLS issue:', profileError.message);
                    } else {
                        console.error('Error fetching profile:', profileError);
                    }
                }

                setProfile(profileData);

                // Fetch premium status and subscription
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('is_premium, subscription_active, subscription_end')
                    .eq('wallet_address', normalizedAddress)
                    .maybeSingle();

                if (userError) {
                    // PGRST116 is "not found" which is expected for users not in database
                    if (userError.code === 'PGRST116') {
                        // User doesn't exist yet - this is fine
                        setIsPremium(false);
                    } else if (userError.code === 'NOT_FOUND' || userError.message?.includes('NOT_FOUND')) {
                        console.warn('Users table not found or RLS issue:', userError.message);
                        setIsPremium(false);
                    } else {
                        console.error('Error fetching user data:', userError);
                        setIsPremium(false);
                    }
                } else if (userData) {
                    // Check if subscription is still active (not expired)
                    const now = new Date();
                    const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null;
                    const isActive = userData.subscription_active === true && 
                        (!subscriptionEnd || subscriptionEnd > now);
                    
                    // Premium status: Active subscription takes priority over legacy flag
                    // If subscription exists but is expired, user is NOT premium (even if legacy flag is true)
                    // Legacy flag only grants premium if no subscription system was ever used
                    // OR whitelisted for testing
                    const hasSubscription = userData.subscription_active !== null && userData.subscription_active !== undefined;
                    const dbPremiumStatus = isActive || (!hasSubscription && userData.is_premium === true);
                    // Note: Public profiles don't use whitelist (only for logged-in users)
                    const premiumStatus = dbPremiumStatus;
                    setIsPremium(premiumStatus);
                } else {
                    setIsPremium(false);
                }

                // Check if current user is viewing their own profile
                const isOwnProfile = user && user.walletAddress.toLowerCase() === normalizedAddress;
                
                // Fetch entries: show all to owner, only verified to public
                let query = supabase
                    .from('ledger_entries')
                    .select('*')
                    .eq('wallet_address', normalizedAddress);
                
                // Only filter by verification status if not viewing own profile
                if (!isOwnProfile) {
                    query = query.eq('verification_status', 'Verified');
                }
                
                const { data: entriesData, error: entriesError } = await query
                    .order('timestamp', { ascending: false });

                if (entriesError) {
                    if (entriesError.code === 'NOT_FOUND' || entriesError.message?.includes('NOT_FOUND')) {
                        console.warn('Ledger entries table not found or RLS issue:', entriesError.message);
                        setEntries([]);
                    } else {
                        console.error('Error fetching entries:', entriesError);
                        setEntries([]);
                    }
                } else {
                    setEntries(entriesData || []);
                }
            } catch (err) {
                console.error('Error fetching public data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicData();
    }, [address, refreshKey]);

    // Apply filter from URL query parameter
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam && entries.length > 0) {
            const filterIds = filterParam.split(',').filter(Boolean);
            const filtered = entries.filter(e => filterIds.includes(e.id));
            setFilteredEntries(filtered);
        } else {
            setFilteredEntries(entries);
        }
    }, [entries, searchParams]);

    // Refresh data when component mounts or when explicitly triggered
    useEffect(() => {
        // Small delay to ensure address is set
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
    }, [address]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground animate-pulse">Loading Media Kit...</p>
            </div>
        );
    }

    // Use filtered entries if filter is applied, otherwise use all entries
    const displayEntries = searchParams.get('filter') ? filteredEntries : entries;

    // Calculate level - unlimited, matches onchain NFT
    // Level should always reflect total verified entries, not filtered results
    // (rerender-memo: Extract expensive work into memoized values)
    const level = useMemo(() => {
        const entryCount = entries.length; // Use all entries, not filtered
        if (entryCount === 0) return 1;
        return entryCount; // Unlimited levels
    }, [entries.length]);

    // Check if current user is viewing their own profile
    const isOwnProfile = user && address && user.walletAddress.toLowerCase() === address.toLowerCase();

    if (displayEntries.length === 0 && !profile && !searchParams.get('filter')) {
        return (
            <div className="max-w-md mx-auto text-center py-20 px-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                    {isOwnProfile ? 'No Entries Yet' : 'Profile Not Found'}
                </h2>
                <p className="text-muted-foreground">
                    {isOwnProfile 
                        ? "You haven't submitted any entries yet. Submit your first entry from the Dashboard!"
                        : "This creator hasn't started their ledger yet."}
                </p>
            </div>
        );
    }

    // Get display name: profile name > ENS > wallet address
    const displayName = profile?.display_name || ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');
    const subtitle = profile?.display_name 
        ? (ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''))
        : (ensName ? (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '') : '');

    return (
        <div className="bg-background pb-6">
            {/* Single shared wrapper for all content */}
            <div className="max-w-5xl mx-auto px-6">
                {/* Banner Section - Clean, no NFT overlay */}
                <div className="relative w-full pt-4">
                    <div
                        className="relative min-h-[200px] md:min-h-[240px] w-full rounded-2xl overflow-hidden shadow-lg bg-slate-900 border border-border/50 transition-all"
                        style={{
                            backgroundImage: profile?.banner_url
                                ? `url(${profile.banner_url})`
                                : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Artistic Default Patterns if no banner */}
                        {!profile?.banner_url && (
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
                                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]"></div>
                            </div>
                        )}

                        {/* Subtle overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                </div>

                {/* Profile Info Section - Below Banner */}
                <div className="pt-6">
                    <div className="flex flex-col items-center">
                        {/* Creator Info - Centered */}
                        <div className="w-full max-w-2xl space-y-4 flex flex-col items-center text-center">
                        {/* Creator Name Heading */}
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                    {displayName}
                                </h1>
                                {isPremium && (
                                    <svg 
                                        className="w-6 h-6 md:w-7 md:h-7 text-primary" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                        aria-label="Verified Pro Creator"
                                    >
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-xs md:text-sm font-mono text-muted-foreground uppercase tracking-wide">
                                    {subtitle}
                                </p>
                            )}
                            {/* Copy Address Button - Always visible when address exists */}
                            {address && (
                                <div className="flex items-center gap-2 justify-center mt-2">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {address.slice(0, 6)}...{address.slice(-4)}
                                    </span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(address);
                                                showToast('Address copied to clipboard!', 'success');
                                            } catch (err) {
                                                console.error('Failed to copy address:', err);
                                                showToast('Failed to copy address', 'error');
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary border border-primary/30 text-xs font-semibold"
                                        title={`Click to copy full address: ${address}`}
                                        aria-label="Copy wallet address"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Copy</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Badge */}
                        <div className="flex items-center gap-2">
                            {isPremium ? (
                                <div className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg flex items-center gap-1.5 border border-green-300/20">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Pro Creator
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wide border border-border">
                                    Essential
                                </div>
                            )}
                        </div>

                        {/* Bio - Below heading with link support */}
                        {profile?.bio && (
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl break-words">
                                {profile.bio.split(/(https?:\/\/[^\s]+)/g).map((part: string, index: number) => {
                                    if (part.match(/^https?:\/\//)) {
                                        return (
                                            <a
                                                key={index}
                                                href={part}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary/80 underline break-all inline"
                                            >
                                                {part}
                                            </a>
                                        );
                                    }
                                    return <span key={index}>{part}</span>;
                                })}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Posts</span>
                                <span className="text-2xl md:text-3xl font-black text-foreground">{displayEntries.length}</span>
                            </div>
                            <div className="h-12 w-px bg-border"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Level</span>
                                <span className="text-2xl md:text-3xl font-black text-foreground">{level}</span>
                            </div>
                        </div>

                        {/* View Creator's Passport Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => setShowPassport(v => !v)}
                                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group"
                            >
                                <span>{showPassport ? 'Hide' : "View"} Creator's Passport</span>
                                <svg className={`w-4 h-4 transition-transform ${showPassport ? 'rotate-180' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Inline Passport Display - Centered */}
                        {showPassport && address && (
                            <div className="w-full pt-2">
                                <PassportDisplay
                                    walletAddress={address}
                                    isPremium={isPremium}
                                />
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                {/* Compact Entries Grid - Mini App Style */}
                <div className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-0.5 w-8 bg-primary rounded-full"></div>
                        <h2 className="text-lg md:text-xl font-bold">
                            {searchParams.get('filter') 
                                ? 'Filtered Portfolio' 
                                : (user && user.walletAddress.toLowerCase() === address?.toLowerCase())
                                    ? 'Your Content'
                                    : 'Verified Media'}
                        </h2>
                        {searchParams.get('filter') && (
                            <span className="text-xs text-muted-foreground">
                                ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})
                            </span>
                        )}
                    </div>
                    <EntryList 
                        entries={displayEntries} 
                        isLoading={isLoading} 
                        isPremium={isPremium} 
                    />
                    {searchParams.get('filter') && displayEntries.length === 0 && (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border bg-white/5">
                            <p className="text-muted-foreground">No entries match this filter.</p>
                        </div>
                    )}
                </div>

                {/* Public Footer */}
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">
                        Verified by <span className="font-bold text-primary">Creator Ledger</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
