import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useSignMessage } from 'wagmi';
import { useToast } from '../hooks/useToast';

interface EntryEndorsementProps {
    entryId: string;
    walletAddress: string; // Creator's wallet address
    currentEndorsements?: number;
    currentDisputes?: number;
}

export const EntryEndorsement: React.FC<EntryEndorsementProps> = ({
    entryId,
    walletAddress,
    currentEndorsements = 0,
    currentDisputes = 0
}) => {
    const { user } = useAuth();
    const { signMessageAsync } = useSignMessage();
    const { showToast } = useToast();
    const [endorsements, setEndorsements] = useState(currentEndorsements);
    const [disputes, setDisputes] = useState(currentDisputes);
    const [userVote, setUserVote] = useState<'endorse' | 'dispute' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check if user has already voted
    useEffect(() => {
        const checkUserVote = async () => {
            if (!user) {
                setIsChecking(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('entry_endorsements')
                    .select('vote_type')
                    .eq('entry_id', entryId)
                    .eq('endorser_wallet', user.walletAddress.toLowerCase())
                    .maybeSingle();

                if (data) {
                    setUserVote(data.vote_type as 'endorse' | 'dispute');
                }
            } catch (err) {
                console.error('Error checking user vote:', err);
            } finally {
                setIsChecking(false);
            }
        };

        checkUserVote();
    }, [user, entryId]);

    // Fetch current counts
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const { count: endorseCount } = await supabase
                    .from('entry_endorsements')
                    .select('*', { count: 'exact', head: true })
                    .eq('entry_id', entryId)
                    .eq('vote_type', 'endorse');

                const { count: disputeCount } = await supabase
                    .from('entry_endorsements')
                    .select('*', { count: 'exact', head: true })
                    .eq('entry_id', entryId)
                    .eq('vote_type', 'dispute');

                if (endorseCount !== null) {
                    setEndorsements(endorseCount);
                }
                if (disputeCount !== null) {
                    setDisputes(disputeCount);
                }
            } catch (err) {
                console.error('Error fetching endorsement counts:', err);
            }
        };

        fetchCounts();
    }, [entryId]);

    const handleVote = async (voteType: 'endorse' | 'dispute') => {
        if (!user) {
            showToast('Please connect your wallet to endorse or dispute entries.', 'warning');
            return;
        }

        if (user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
            showToast('You cannot vote on your own entries.', 'warning');
            return;
        }

        setIsLoading(true);

        try {
            // Create signature message
            const message = `Creator Ledger Endorsement\n\nI, ${user.walletAddress}, ${voteType === 'endorse' ? 'endorse' : 'dispute'} the entry:\n${entryId}\n\nCreator: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`;
            
            const signature = await signMessageAsync({ message });

            // Check if user already voted (different vote type)
            const { data: existingVote } = await supabase
                .from('entry_endorsements')
                .select('*')
                .eq('entry_id', entryId)
                .eq('endorser_wallet', user.walletAddress.toLowerCase())
                .maybeSingle();

            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    showToast(`You have already ${voteType === 'endorse' ? 'endorsed' : 'disputed'} this entry.`, 'info');
                    setIsLoading(false);
                    return;
                } else {
                    // Update existing vote
                    const { error } = await supabase
                        .from('entry_endorsements')
                        .update({
                            vote_type: voteType,
                            signature: signature,
                            created_at: new Date().toISOString()
                        })
                        .eq('entry_id', entryId)
                        .eq('endorser_wallet', user.walletAddress.toLowerCase());

                    if (error) throw error;

                    // Update counts
                    if (existingVote.vote_type === 'endorse') {
                        setEndorsements(prev => Math.max(0, prev - 1));
                    } else {
                        setDisputes(prev => Math.max(0, prev - 1));
                    }
                }
            } else {
                // Create new vote
                const { error } = await supabase
                    .from('entry_endorsements')
                    .insert({
                        entry_id: entryId,
                        endorser_wallet: user.walletAddress.toLowerCase(),
                        vote_type: voteType,
                        signature: signature
                    });

                if (error) throw error;
            }

            // Update counts
            if (voteType === 'endorse') {
                setEndorsements(prev => prev + 1);
                setDisputes(prev => {
                    if (existingVote?.vote_type === 'dispute') {
                        return Math.max(0, prev - 1);
                    }
                    return prev;
                });
            } else {
                setDisputes(prev => prev + 1);
                setEndorsements(prev => {
                    if (existingVote?.vote_type === 'endorse') {
                        return Math.max(0, prev - 1);
                    }
                    return prev;
                });
            }

            setUserVote(voteType);
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

    return (
        <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <button
                onClick={() => handleVote('endorse')}
                disabled={isLoading || !user || user.walletAddress.toLowerCase() === walletAddress.toLowerCase()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'endorse'
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-secondary/50 hover:bg-green-500/10 text-muted-foreground hover:text-green-600 border border-border'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!user ? 'Connect wallet to endorse' : user.walletAddress.toLowerCase() === walletAddress.toLowerCase() ? "Can't vote on own entries" : 'Endorse this entry'}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{endorsements}</span>
            </button>

            <button
                onClick={() => handleVote('dispute')}
                disabled={isLoading || !user || user.walletAddress.toLowerCase() === walletAddress.toLowerCase()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'dispute'
                        ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                        : 'bg-secondary/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 border border-border'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!user ? 'Connect wallet to dispute' : user.walletAddress.toLowerCase() === walletAddress.toLowerCase() ? "Can't vote on own entries" : 'Dispute this entry'}
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

