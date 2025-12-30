import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EntryList } from '../components/EntryList';
import type { LedgerEntry } from '../types';
import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { DynamicNFT } from '../components/DynamicNFT';

export const PublicProfile: React.FC = () => {
    const { address } = useParams<{ address: string }>();
    const [searchParams] = useSearchParams();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

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
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('wallet_address', normalizedAddress)
                    .maybeSingle();

                setProfile(profileData);

                // Fetch premium status and subscription
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('is_premium, subscription_active, subscription_end')
                    .eq('wallet_address', normalizedAddress)
                    .maybeSingle();

                if (userData) {
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
                } else if (userError && userError.code !== 'PGRST116') {
                    console.error('Error fetching user data:', userError);
                }

                // Fetch public entries (only verified ones are shown publicly)
                const { data: entriesData, error: entriesError } = await supabase
                    .from('ledger_entries')
                    .select('*')
                    .eq('wallet_address', normalizedAddress)
                    .eq('verification_status', 'Verified')
                    .order('timestamp', { ascending: false });

                if (!entriesError) {
                    setEntries(entriesData || []);
                } else {
                    console.error('Error fetching entries:', entriesError);
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

    // Calculate level - unlimited, matches on-chain NFT
    // Level should always reflect total verified entries, not filtered results
    const calculateLevel = () => {
        const entryCount = entries.length; // Use all entries, not filtered
        if (entryCount === 0) return 1;
        return entryCount; // Unlimited levels
    };

    const level = calculateLevel();

    if (displayEntries.length === 0 && !profile && !searchParams.get('filter')) {
        return (
            <div className="max-w-md mx-auto text-center py-20 px-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
                <p className="text-muted-foreground">This creator hasn't started their ledger yet.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-6">
            {/* Compact Media Kit Banner - Farcaster Mini App Style */}
            <div className="relative w-full max-w-4xl mx-auto px-3 pt-4">
                <div
                    className="relative min-h-[280px] md:min-h-[320px] w-full rounded-2xl overflow-hidden shadow-lg bg-slate-900 border border-border/50 transition-all"
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

                    {/* Dark Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>

                    {/* Center: The Dynamic NFT with Level ON IT */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="group relative">
                            <div className={`absolute -inset-4 md:-inset-8 rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000 ${isPremium ? 'bg-primary' : 'bg-slate-400'}`}></div>
                            {address && (
                                <DynamicNFT
                                    walletAddress={address}
                                    size="md"
                                    className="transition-all duration-700 group-hover:scale-105 group-hover:rotate-1"
                                />
                            )}
                        </div>
                    </div>

                    {/* Bottom: Compact Profile Section - Mini App Style */}
                    <div className="absolute bottom-0 inset-x-0 z-30 px-4 pb-4 md:pb-6">
                        <div className="max-w-2xl mx-auto">
                            {/* Name and Badge - Compact */}
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight drop-shadow-lg text-white">
                                    {profile?.display_name || ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                </h1>
                                {/* Show subtitle only if there's a display_name (show ENS/address) or if ENS is main name (show address) */}
                                {profile?.display_name ? (
                                    <p className="text-[10px] md:text-xs font-mono opacity-60 tracking-wide uppercase text-white/70">
                                        {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                    </p>
                                ) : ensName ? (
                                    <p className="text-[10px] md:text-xs font-mono opacity-60 tracking-wide uppercase text-white/70">
                                        {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                    </p>
                                ) : null}
                                <div className="flex items-center gap-2">
                            {isPremium ? (
                                        <div className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg flex items-center gap-1.5 border border-white/20">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                            Pro
                                </div>
                            ) : (
                                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wide shadow border border-white/10 text-white">
                                            Essential
                                </div>
                            )}
                        </div>
                            </div>

                            {/* Bio - Compact */}
                        {profile?.bio && (
                                <p className="text-xs md:text-sm font-medium opacity-90 max-w-xl mx-auto text-center text-white/90 mb-4 line-clamp-2 drop-shadow">
                                {profile.bio}
                            </p>
                        )}

                            {/* Stats - Compact Mini App Style */}
                            <div className="flex items-center justify-center gap-4 md:gap-8">
                                <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                                    <span className="text-[8px] font-bold uppercase tracking-wide text-primary/70">Posts</span>
                                    <span className="text-2xl md:text-3xl font-black text-white">{displayEntries.length}</span>
                                </div>
                                <div className="h-12 w-px bg-white/20"></div>
                                <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                                    <span className="text-[8px] font-bold uppercase tracking-wide text-accent/70">Level</span>
                                    <span className="text-2xl md:text-3xl font-black text-white">{level}</span>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Entries Grid - Mini App Style */}
            <div className="max-w-4xl mx-auto px-3 pt-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-0.5 w-8 bg-primary rounded-full"></div>
                    <h2 className="text-lg md:text-xl font-bold">
                        {searchParams.get('filter') ? 'Filtered Portfolio' : 'Verified Media'}
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
    );
};
