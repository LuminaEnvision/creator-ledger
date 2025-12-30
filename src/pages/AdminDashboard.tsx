import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { LedgerEntry } from '../types';
import { isAdmin as checkIsAdmin } from '../lib/admin';
import { useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [processingEntryId, setProcessingEntryId] = useState<string | null>(null);

    // Check if user is admin (frontend check)
    const userIsAdmin = checkIsAdmin(user?.walletAddress);

    // Check if user is registered as admin in the contract
    const { data: isContractAdmin } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'admins',
        args: user?.walletAddress ? [user.walletAddress.toLowerCase() as `0x${string}`] : undefined,
        chainId: baseSepolia.id,
        query: {
            enabled: !!userIsAdmin && !!user?.walletAddress,
        }
    });

    // Check contract owner (for reference)
    const { data: contractOwner } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'owner',
        chainId: baseSepolia.id,
        query: {
            enabled: !!userIsAdmin,
        }
    });

    useEffect(() => {
        if (userIsAdmin && user?.walletAddress) {
            if (isContractAdmin === false) {
                console.warn('AdminDashboard: Admin wallet is not registered in contract!', {
                    adminWallet: user.walletAddress,
                    isContractAdmin: isContractAdmin,
                    message: 'mintFor and incrementEntryCount will fail - admin must be added to contract by owner'
                });
            } else if (isContractAdmin === true) {
                console.log('AdminDashboard: Admin wallet is registered in contract - mintFor will work');
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

    useEffect(() => {
        if (userIsAdmin) {
            fetchAllEntries();
        }
    }, [user, userIsAdmin]);

    const handleVerify = async (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        setProcessingEntryId(id);

        try {
            // Only update database status - no on-chain transaction
            // User will mint/upgrade their passport themselves
            const { error: dbError } = await supabase
                .from('ledger_entries')
                .update({ verification_status: 'Verified' })
                .eq('id', id);

            if (dbError) {
                console.error('Error verifying entry:', dbError);
                alert('Failed to verify entry');
                setProcessingEntryId(null);
                return;
            }

            // Update local state
            setEntries(prev => prev.map(e => e.id === id ? { ...e, verification_status: 'Verified' } : e));
            alert('Entry verified successfully! The user can now mint/upgrade their passport.');
        } catch (err: any) {
            console.error('Error in verification process:', err);
            alert(`Verification error: ${err?.message || 'Please try again.'}`);
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
                            <h3 className="text-sm font-semibold text-yellow-400 mb-1">Admin Not Registered in Contract</h3>
                            <p className="text-sm text-yellow-300/90 mb-2">
                                Your admin wallet ({user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}) is not registered as an admin in the contract.
                                The <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded">mintFor</code> and <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded">incrementEntryCount</code> functions require admin registration.
                            </p>
                            {contractOwner && (
                                <p className="text-sm text-yellow-300/70">
                                    Contact the contract owner ({contractOwner.slice(0, 6)}...{contractOwner.slice(-4)}) to add your wallet as an admin using the <code className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded">addAdmin</code> function.
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
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                                        {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
