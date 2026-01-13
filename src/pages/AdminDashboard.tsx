import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { LedgerEntry } from '../types';
import { isAdmin as checkIsAdmin } from '../lib/admin';
import { useReadContract, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';
import { config } from '../wagmi';
import { useToast } from '../hooks/useToast';
import { ProfileDisplay } from '../components/ProfileDisplay';

interface DuplicateGroup {
    contentHash: string;
    url: string;
    entries: LedgerEntry[];
}

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [processingEntryId, setProcessingEntryId] = useState<string | null>(null);
    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
    const { writeContractAsync } = useWriteContract();
    const { showToast } = useToast();

    // Check if user is admin (frontend check)
    const userIsAdmin = checkIsAdmin(user?.walletAddress);

    // Check if user is registered as admin in the contract
    const { data: isContractAdmin } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'admins',
        args: user?.walletAddress ? [user.walletAddress.toLowerCase() as `0x${string}`] : undefined,
        chainId: base.id,
        query: {
            enabled: !!userIsAdmin && !!user?.walletAddress,
        }
    });

    // Check contract owner (for reference)
    const { data: contractOwner } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'owner',
        chainId: base.id,
        query: {
            enabled: !!userIsAdmin,
        }
    });

    useEffect(() => {
        if (userIsAdmin && user?.walletAddress) {
            const normalizedAddress = user.walletAddress.toLowerCase();
            console.log('AdminDashboard: Checking admin status', {
                userWallet: user.walletAddress,
                normalizedWallet: normalizedAddress,
                isContractAdmin: isContractAdmin,
                contractAddress: PASSPORT_CONTRACT_ADDRESS,
                chainId: base.id
            });
            
            if (isContractAdmin === false) {
                console.warn('AdminDashboard: Admin wallet is not registered in contract!', {
                    adminWallet: user.walletAddress,
                    normalizedWallet: normalizedAddress,
                    isContractAdmin: isContractAdmin,
                    message: 'mintFor and incrementEntryCount will fail - admin must be added to contract by owner'
                });
            } else if (isContractAdmin === true) {
                console.log('AdminDashboard: Admin wallet is registered in contract - mintFor will work');
            } else if (isContractAdmin === undefined) {
                console.log('AdminDashboard: Admin status check is still loading...');
            }
        }
    }, [userIsAdmin, isContractAdmin, user?.walletAddress]);

    const fetchAllEntries = async () => {
        const { data, error } = await supabase
            .from('ledger_entries')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching entries:', error);
        } else {
            setEntries(data || []);
        }
    };

    // Detect duplicate entries (same content_hash claimed by different wallets)
    const detectDuplicates = (allEntries: LedgerEntry[]) => {
        const hashMap = new Map<string, LedgerEntry[]>();
        
        // Group entries by content_hash
        allEntries.forEach(entry => {
            if (entry.content_hash) {
                if (!hashMap.has(entry.content_hash)) {
                    hashMap.set(entry.content_hash, []);
                }
                hashMap.get(entry.content_hash)!.push(entry);
            }
        });
        
        // Find groups with multiple entries (duplicates)
        const duplicates: DuplicateGroup[] = [];
        hashMap.forEach((entriesList, contentHash) => {
            if (entriesList.length > 1) {
                // Check if entries are from different wallets
                const uniqueWallets = new Set(entriesList.map(e => e.wallet_address.toLowerCase()));
                if (uniqueWallets.size > 1) {
                    // Only show duplicates if at least one entry is NOT rejected
                    // If all entries are rejected, don't show the alert
                    const hasNonRejected = entriesList.some(e => e.verification_status !== 'Rejected');
                    if (hasNonRejected) {
                        duplicates.push({
                            contentHash,
                            url: entriesList[0].url,
                            entries: entriesList,
                        });
                    }
                }
            }
        });
        
        return duplicates;
    };

    useEffect(() => {
        if (userIsAdmin) {
            fetchAllEntries();
        }
    }, [user, userIsAdmin]);

    useEffect(() => {
        if (entries.length > 0) {
            const duplicates = detectDuplicates(entries);
            setDuplicateGroups(duplicates);
        }
    }, [entries]);

    const handleVerify = async (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        setProcessingEntryId(id);

        try {
            // Only update database verification status - user will mint/upgrade their own passport
            const { error: dbError } = await supabase
                .from('ledger_entries')
                .update({ verification_status: 'Verified' })
                .eq('id', id);

            if (dbError) {
                console.error('Error updating database:', dbError);
                showToast('Failed to verify entry. Please try again.', 'error');
                return;
            }

            // Create notification for the creator
            const { error: notifError } = await supabase
                .from('user_notifications')
                .insert({
                    wallet_address: entry.wallet_address.toLowerCase(),
                    type: 'verified',
                    entry_id: id,
                    message: 'Your content was verified! Claim your Creator Passport level.',
                    read: false
                });

            if (notifError) {
                console.error('Error creating notification:', notifError);
                // Don't fail the verification if notification fails
            }

            // Update local state
            setEntries(prev => prev.map(e => e.id === id ? { ...e, verification_status: 'Verified' } : e));
            showToast('✅ Entry verified! User will be notified to claim their passport.', 'success');
        } catch (err: any) {
            console.error('Error in verification process:', err);
            showToast('Failed to verify entry. Please try again.', 'error');
        } finally {
            setProcessingEntryId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Please provide a reason for rejection (optional):');
        if (reason === null) return; // User cancelled

        const { error } = await supabase
            .from('ledger_entries')
            .update({ verification_status: 'Rejected' })
            .eq('id', id);

        if (error) {
            console.error('Error rejecting entry:', error);
            alert('Failed to reject entry');
        } else {
            setEntries(prev => prev.map(e => e.id === id ? { ...e, verification_status: 'Rejected' } : e));
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted-foreground">Please connect your wallet.</p>
            </div>
        );
    }

    if (!userIsAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground">You are not authorized to access the admin dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h2>
                <p className="text-muted-foreground mt-1">Review and verify content submissions</p>
            </div>

            {userIsAdmin && isContractAdmin === false && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-yellow-400 mb-1">Admin Status Check</h3>
                            <p className="text-sm text-yellow-300/90 mb-2">
                                Checking admin status for: <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded font-mono">{user.walletAddress}</code>
                            </p>
                            <p className="text-sm text-yellow-300/90 mb-2">
                                Contract: <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded font-mono">{PASSPORT_CONTRACT_ADDRESS}</code>
                            </p>
                            <p className="text-sm text-yellow-300/70 mb-2">
                                <strong>Note:</strong> The admin wallet <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded font-mono">0x7d85fcbb505d48e6176483733b62b51704e0bf95</code> is confirmed registered on-chain. 
                                If your wallet matches this address, try refreshing the page or check your network connection.
                            </p>
                            {contractOwner && (
                                <p className="text-sm text-yellow-300/70">
                                    Contract owner: <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded font-mono">{contractOwner}</code>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {userIsAdmin && isContractAdmin === true && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm text-green-300/90">
                                ✓ Admin wallet is registered in contract. You can verify entries and mint NFTs.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Content Alerts */}
            {duplicateGroups.length > 0 && (
                <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <svg className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-orange-400 mb-1">
                                ⚠️ Duplicate Content Detected ({duplicateGroups.length})
                            </h3>
                            <p className="text-sm text-orange-300/90 mb-4">
                                The following content has been claimed by multiple users. Review carefully to determine the legitimate owner.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {duplicateGroups.map((group) => {
                            const verifiedEntries = group.entries.filter(e => e.verification_status === 'Verified');
                            
                            return (
                                <div key={group.contentHash} className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
                                    <div className="mb-3">
                                        <a
                                            href={group.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-400 hover:text-orange-300 font-semibold text-sm break-all"
                                        >
                                            {group.url}
                                        </a>
                                        <p className="text-xs text-orange-300/70 mt-1">
                                            Claimed by {group.entries.length} different wallet{group.entries.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {group.entries.map((entry) => {
                                            const isVerified = entry.verification_status === 'Verified';
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                                        isVerified
                                                            ? 'border-green-500/30 bg-green-500/10'
                                                            : 'border-orange-500/20 bg-orange-500/5'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <ProfileDisplay 
                                                                walletAddress={entry.wallet_address}
                                                                showAvatar={true}
                                                                showLink={true}
                                                                size="sm"
                                                            />
                                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                                isVerified
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                                {entry.verification_status}
                                                            </span>
                                                            {isVerified && (
                                                                <span className="text-xs text-green-400 font-semibold">
                                                                    ✓ Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {entry.content_published_at 
                                                                ? `Published: ${new Date(entry.content_published_at).toLocaleString()}`
                                                                : `Submitted: ${new Date(entry.timestamp).toLocaleString()}`
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={`/u/${entry.wallet_address}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors"
                                                        >
                                                            View Profile
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {verifiedEntries.length > 1 && (
                                        <div className="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                                            <p className="text-xs text-red-400 font-semibold">
                                                ⚠️ Multiple verified claims! This content has been verified for {verifiedEntries.length} different wallets.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {entries.map((entry) => {
                                // Check if this entry is part of a duplicate group
                                const isDuplicate = duplicateGroups.some(group => 
                                    group.entries.some(e => e.id === entry.id)
                                );
                                const duplicateGroup = duplicateGroups.find(group => 
                                    group.entries.some(e => e.id === entry.id)
                                );
                                const duplicateCount = duplicateGroup ? duplicateGroup.entries.length : 0;
                                
                                return (
                                <tr 
                                    key={entry.id} 
                                    className={`hover:bg-muted/30 transition-colors ${
                                        isDuplicate ? 'bg-orange-500/5 border-l-4 border-orange-500' : ''
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <ProfileDisplay 
                                                walletAddress={entry.wallet_address}
                                                showAvatar={true}
                                                showLink={true}
                                                size="sm"
                                            />
                                            {isDuplicate && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold" title={`This content is claimed by ${duplicateCount} different wallets`}>
                                                    ⚠️ Duplicate
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-col gap-2">
                                            <a
                                                href={entry.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline truncate block max-w-md"
                                                title={entry.url}
                                            >
                                                {entry.url}
                                            </a>
                                            <a
                                                href={entry.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors w-fit"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View Content
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            entry.verification_status === 'Verified'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : entry.verification_status === 'Rejected'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {entry.verification_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-3">
                                            {entry.verification_status === 'Unverified' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(entry.id)}
                                                        disabled={processingEntryId === entry.id}
                                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingEntryId === entry.id ? 'Verifying & Minting NFT...' : 'Verify'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(entry.id)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {entry.verification_status === 'Verified' && (
                                                <button
                                                    onClick={() => handleReject(entry.id)}
                                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors text-xs"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                            {entry.verification_status === 'Rejected' && (
                                                <button
                                                    onClick={() => handleVerify(entry.id)}
                                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
