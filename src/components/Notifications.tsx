import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { PassportMintButton } from './PassportMintButton';
import { useReadContract } from 'wagmi';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';
import { base } from 'wagmi/chains';

interface Notification {
    id: string;
    type: 'verified' | 'endorsement';
    entry_id: string;
    endorser_wallet?: string;
    message: string;
    read: boolean;
    created_at: string;
}

export const Notifications: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user has a passport
    const { data: tokenId } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'addressToTokenId',
        args: user?.walletAddress ? [user.walletAddress.toLowerCase() as `0x${string}`] : undefined,
        chainId: base.id,
        query: {
            enabled: !!user?.walletAddress,
        }
    });

    // Count all verified entries for the user
    const [verifiedEntriesCount, setVerifiedEntriesCount] = useState(0);
    const [passportEntryCount, setPassportEntryCount] = useState(0);

    // Get passport entry count from onchain
    const { data: passportData } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'passportData',
        args: tokenId && tokenId > 0n ? [tokenId] : undefined,
        chainId: base.id,
        query: {
            enabled: !!tokenId && tokenId > 0n && !!user?.walletAddress,
        }
    });

    useEffect(() => {
        if (passportData) {
            setPassportEntryCount(Number(passportData[0]));
        }
    }, [passportData]);

    useEffect(() => {
        if (!user?.walletAddress) {
            setVerifiedEntriesCount(0);
            return;
        }

        const fetchVerifiedCount = async () => {
            const { error, count } = await supabase
                .from('ledger_entries')
                .select('*', { count: 'exact', head: true })
                .eq('wallet_address', user.walletAddress.toLowerCase())
                .eq('verification_status', 'Verified');

            if (!error && count !== null) {
                setVerifiedEntriesCount(count);
            }
        };

        fetchVerifiedCount();
    }, [user?.walletAddress]);

    useEffect(() => {
        if (!user?.walletAddress) {
            setIsLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('wallet_address', user.walletAddress.toLowerCase())
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
            } else {
                setNotifications(data || []);
            }
            setIsLoading(false);
        };

        fetchNotifications();

        // Set up real-time subscription
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'user_notifications',
                filter: `wallet_address=eq.${user.walletAddress.toLowerCase()}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.walletAddress]);

    const markAsRead = async (notificationId: string) => {
        const { error } = await supabase
            .from('user_notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (!error) {
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (isLoading) {
        return null;
    }

    // Calculate entries that need to be claimed (verified but not yet on passport)
    const entriesToClaim = Math.max(0, verifiedEntriesCount - passportEntryCount);

    if (unreadCount === 0 && entriesToClaim === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Verified Content - Claim Passport */}
            {entriesToClaim > 0 && (
                <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-primary mb-1">
                                Your content was verified!
                            </h3>
                            <p className="text-sm text-foreground/80 mb-3">
                                You have {entriesToClaim} verified {entriesToClaim === 1 ? 'entry' : 'entries'} ready to claim. Claim your Creator Passport level now!
                            </p>
                            {user?.walletAddress && (
                                <PassportMintButton 
                                    walletAddress={user.walletAddress}
                                    verifiedEntriesCount={verifiedEntriesCount}
                                    onSuccess={() => {
                                        // Mark verified notifications as read
                                        const verifiedNotifications = notifications.filter(n => n.type === 'verified' && !n.read);
                                        verifiedNotifications.forEach(n => markAsRead(n.id));
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Endorsement Notifications */}
            {notifications.filter(n => n.type === 'endorsement' && !n.read).length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground/90">Recent Endorsements</h3>
                    {notifications
                        .filter(n => n.type === 'endorsement' && !n.read)
                        .slice(0, 5)
                        .map(notification => (
                            <div
                                key={notification.id}
                                className="rounded-lg border border-border bg-background/50 p-3 hover:bg-background/80 transition-colors cursor-pointer"
                                onClick={() => {
                                    markAsRead(notification.id);
                                    navigate(`/entry/${notification.entry_id}`);
                                }}
                            >
                                <p className="text-sm text-foreground/90">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

