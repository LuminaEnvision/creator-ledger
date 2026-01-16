import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { edgeFunctions } from '../lib/edgeFunctions';
import { useSignMessage } from 'wagmi';
import { useToast } from '../hooks/useToast';
import { ProfileDisplay } from './ProfileDisplay';

interface EntryEndorsementProps {
    entryId: string;
    walletAddress: string; // Creator's wallet address
    currentEndorsements?: number;
    currentDisputes?: number;
    isOwner?: boolean; // Whether the current user is the entry owner
}

export const EntryEndorsement: React.FC<EntryEndorsementProps> = ({
    entryId,
    walletAddress,
    currentEndorsements = 0,
    currentDisputes = 0,
    isOwner = false
}) => {
    const { user } = useAuth();
    const { signMessageAsync } = useSignMessage();
    const { showToast } = useToast();
    const [endorsements, setEndorsements] = useState(currentEndorsements);
    const [disputes, setDisputes] = useState(currentDisputes);
    const [userVote, setUserVote] = useState<'endorse' | 'dispute' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [endorsers, setEndorsers] = useState<Array<{ wallet: string; timestamp: string }>>([]);
    const [showEndorsers, setShowEndorsers] = useState(false);

    // Check if user has already voted
    useEffect(() => {
        const checkUserVote = async () => {
            if (!user) {
                setIsChecking(false);
                return;
            }

            try {
                const { userVote: voteData } = await edgeFunctions.getEndorsements(entryId);
                if (voteData) {
                    setUserVote(voteData as 'endorse' | 'dispute');
                }
            } catch (err) {
                console.error('Error checking user vote:', err);
            } finally {
                setIsChecking(false);
            }
        };

        checkUserVote();
    }, [user, entryId]);

    // Fetch current counts and endorsers list
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const { endorseCount, disputeCount, endorsers: endorsersData } = await edgeFunctions.getEndorsements(entryId);

                if (endorseCount !== null && endorseCount !== undefined) {
                    setEndorsements(endorseCount);
                }
                if (disputeCount !== null && disputeCount !== undefined) {
                    setDisputes(disputeCount);
                }

                // If owner, set list of endorsers
                if (isOwner && endorsersData) {
                    setEndorsers(endorsersData.map((e: any) => ({
                        wallet: e.endorser_wallet,
                        timestamp: e.created_at
                    })));
                }
            } catch (err) {
                console.error('Error fetching endorsement counts:', err);
            }
        };

        fetchCounts();
    }, [entryId, isOwner]);

    const handleVote = async (voteType: 'endorse' | 'dispute') => {
        if (!user) {
            showToast('Please connect your wallet to endorse or dispute entries.', 'warning');
            return;
        }

        // This check is now handled by isOwner prop, but keep as safety
        if (user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
            showToast('You cannot vote on your own entries.', 'warning');
            return;
        }

        setIsLoading(true);

        try {
            // Create signature message
            const message = `Creator Ledger Endorsement\n\nI, ${user.walletAddress}, ${voteType === 'endorse' ? 'endorse' : 'dispute'} the entry:\n${entryId}\n\nCreator: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`;
            
            const signature = await signMessageAsync({ message });

            // Vote via Edge Function (handles duplicate checking, updates, and notifications)
            await edgeFunctions.voteEntry({
                entry_id: entryId,
                vote_type: voteType,
                signature: signature
            });

            // Refresh counts and user vote
            const { endorseCount, disputeCount, userVote: newUserVote } = await edgeFunctions.getEndorsements(entryId);
            if (endorseCount !== null && endorseCount !== undefined) setEndorsements(endorseCount);
            if (disputeCount !== null && disputeCount !== undefined) setDisputes(disputeCount);
            if (newUserVote) setUserVote(newUserVote as 'endorse' | 'dispute');

            showToast(`Entry ${voteType === 'endorse' ? 'endorsed' : 'disputed'} successfully!`, 'success');
        } catch (err: any) {
            console.error('Error voting:', err);
            if (err.message?.includes('User rejected')) {
                showToast('Signature cancelled.', 'info');
            } else {
                showToast(`Failed to ${voteType === 'endorse' ? 'endorse' : 'dispute'} entry: ${err.message}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                <span>Loading...</span>
            </div>
        );
    }

    // If owner, show endorsers list instead of voting buttons
    if (isOwner) {
        return (
            <div className="pt-2 border-t border-border/30">
                {endorsements > 0 ? (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowEndorsers(!showEndorsers)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="font-semibold text-green-600">{endorsements}</span>
                            <span>endorsement{endorsements !== 1 ? 's' : ''}</span>
                            <svg className={`w-3 h-3 transition-transform ${showEndorsers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showEndorsers && (
                            <div className="ml-6 space-y-1.5 max-h-40 overflow-y-auto">
                                {endorsers.map((endorser, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[10px] text-muted-foreground py-1">
                                        <ProfileDisplay 
                                            walletAddress={endorser.wallet}
                                            showAvatar={true}
                                            showLink={true}
                                            size="sm"
                                            className="text-[10px]"
                                        />
                                        <span className="text-[9px]">
                                            {new Date(endorser.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>No endorsements yet</span>
                    </div>
                )}
                {disputes > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-500 font-semibold">{disputes}</span>
                        <span>dispute{disputes !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>
        );
    }

    // For non-owners: show voting buttons
    return (
        <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <button
                onClick={() => handleVote('endorse')}
                disabled={isLoading || !user}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'endorse'
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-secondary/50 hover:bg-green-500/10 text-muted-foreground hover:text-green-600 border border-border'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!user ? 'Connect wallet to endorse' : 'Endorse this entry'}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{endorsements}</span>
            </button>

            <button
                onClick={() => handleVote('dispute')}
                disabled={isLoading || !user}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'dispute'
                        ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                        : 'bg-secondary/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 border border-border'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!user ? 'Connect wallet to dispute' : 'Dispute this entry'}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{disputes}</span>
            </button>

            {!user && (
                <span className="text-[10px] text-muted-foreground italic">
                    Connect wallet to vote
                </span>
            )}
        </div>
    );
};

