import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { edgeFunctions } from '../lib/edgeFunctions';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { PassportMintButton } from './PassportMintButton';
import { useReadContract } from 'wagmi';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';
import { base } from 'wagmi/chains';

interface Notification {
    id: string;
    type: 'verified' | 'endorsement' | 'subscription_expired';
    entry_id?: string;
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
            try {
                const { entries: verifiedEntries } = await edgeFunctions.getEntries({ 
                    wallet_address: user.walletAddress.toLowerCase(),
                    only_verified: true 
                });
                setVerifiedEntriesCount(verifiedEntries?.length || 0);
            } catch (err) {
                console.error('Error fetching verified count:', err);
            }
        };

        fetchVerifiedCount();
    }, [user?.walletAddress]);

    useEffect(() => {
        if (!user?.walletAddress) {
            setIsLoading(false);
            return;
        }

        const checkSubscriptionExpiry = async () => {
            // Check if subscription has expired and create notification if needed
            try {
                const { user: userData } = await edgeFunctions.getUser();

                if (userData && userData.subscription_active && userData.subscription_end) {
                    const now = new Date();
                    const subscriptionEnd = new Date(userData.subscription_end);
                    
                    // If subscription expired in the last 7 days
                    // Note: Edge Function should handle notification creation
                    // For now, we'll let the backend handle this
                    if (subscriptionEnd < now && subscriptionEnd > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
                        // Notification creation should be handled by backend/Edge Function
                        // TODO: Add create-subscription-expired-notification Edge Function if needed
                    }
                }
            } catch (err) {
                console.error('Error checking subscription expiry:', err);
            }
        };

        const fetchNotifications = async () => {
            // Check for expired subscriptions first
            await checkSubscriptionExpiry();

            try {
                const { notifications: notificationsData } = await edgeFunctions.getNotifications(false);
                setNotifications(notificationsData || []);
            } catch (error: any) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            }
            setIsLoading(false);
        };

        fetchNotifications();

        // Set up real-time notifications via Server-Sent Events
        let cleanup: (() => void) | null = null
        let pollInterval: NodeJS.Timeout | null = null

        const setupRealtime = async () => {
            try {
                cleanup = await edgeFunctions.subscribeNotifications(
                    (notification) => {
                        // Add new notification to the list
                        setNotifications(prev => {
                            // Check if notification already exists
                            if (prev.some(n => n.id === notification.id)) {
                                return prev
                            }
                            // Add to beginning of list
                            return [notification, ...prev]
                        })
                    },
                    (error) => {
                        console.error('Notification subscription error:', error)
                        // Fallback to polling if SSE fails
                        if (!pollInterval) {
                            pollInterval = setInterval(() => {
                                fetchNotifications()
                            }, 10000) // Poll every 10 seconds as fallback
                        }
                    }
                )
            } catch (error) {
                console.error('Failed to set up real-time notifications:', error)
                // Fallback to polling
                pollInterval = setInterval(() => {
                    fetchNotifications()
                }, 10000)
            }
        }

        setupRealtime()

        return () => {
            if (cleanup) cleanup()
            if (pollInterval) clearInterval(pollInterval)
        }
    }, [user?.walletAddress]);

    const markAsRead = async (notificationId: string) => {
        try {
            await edgeFunctions.markNotificationRead(notificationId);
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
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

            {/* Subscription Expired Notification */}
            {notifications.filter(n => n.type === 'subscription_expired' && !n.read).map(notification => (
                <div key={notification.id} className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-yellow-400 mb-1">
                                Subscription Expired
                            </h3>
                            <p className="text-sm text-foreground/80 mb-3">
                                {notification.message}
                            </p>
                            <Link
                                to="/pricing"
                                onClick={() => markAsRead(notification.id)}
                                className="inline-block px-4 py-2 rounded-lg bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600 transition-colors"
                            >
                                Renew Subscription
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

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
                                    if (notification.entry_id) {
                                        navigate(`/entry/${notification.entry_id}`);
                                    }
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

