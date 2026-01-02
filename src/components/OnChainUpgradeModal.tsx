import React, { useState } from 'react';
import { Modal } from './Modal';
import { useWriteContract, useAccount, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseEther } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { config } from '../wagmi';

interface OnChainUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string;
    contentHash: string;
    url: string;
}

export const OnChainUpgradeModal: React.FC<OnChainUpgradeModalProps> = ({
    isOpen,
    onClose,
    entryId,
    contentHash,
    url
}) => {
    const { showToast } = useToast();
    const { writeContractAsync } = useWriteContract();
    const { chain } = useAccount();
    const { switchChainAsync } = useSwitchChain();
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'switching' | 'processing'>('idle');
    
    const handleUpgrade = async () => {
        if (!contentHash || !url) {
            showToast('Missing required data for on-chain upgrade.', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            // Step 1: Switch to Base Sepolia if needed
            if (chain?.id !== baseSepolia.id && switchChainAsync) {
                setStatus('switching');
                showToast('Switching to Base Sepolia network...', 'info');
                try {
                    await switchChainAsync({ chainId: baseSepolia.id });
                    // Wait a bit for chain switch to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (switchError: any) {
                    if (switchError.code === 4001) { // User rejected
                        showToast('Please switch to Base Sepolia network to continue.', 'warning');
                        setIsProcessing(false);
                        setStatus('idle');
                        return;
                    }
                    throw new Error(`Failed to switch network: ${switchError.message || 'Unknown error'}`);
                }
            }

            setStatus('processing');
            
            // Convert content hash to bytes32 (ensure it's 64 hex chars + 0x prefix)
            let contentHashBytes: `0x${string}`;
            if (contentHash.startsWith('0x')) {
                // Remove 0x if present and ensure it's 64 chars
                const hashWithoutPrefix = contentHash.slice(2);
                contentHashBytes = `0x${hashWithoutPrefix.padStart(64, '0')}` as `0x${string}`;
            } else {
                // Add 0x prefix and pad to 64 chars
                contentHashBytes = `0x${contentHash.padStart(64, '0')}` as `0x${string}`;
            }
            
            // Call smart contract to register content hash
            const hash = await writeContractAsync({
                address: PASSPORT_CONTRACT_ADDRESS,
                abi: PASSPORT_ABI,
                functionName: 'registerContentHash',
                args: [contentHashBytes, url],
                value: parseEther('0.0001'), // 0.0001 ETH fee
                chainId: baseSepolia.id,
            });

            showToast('Transaction submitted! Waiting for confirmation...', 'info');

            // Wait for transaction receipt using wagmi
            // The hash is already the transaction hash, and we've ensured the chain is correct before calling writeContractAsync
            await waitForTransactionReceipt(config, {
                hash: hash,
                timeout: 60000
            });

            // Use the hash directly as the transaction hash
            const txHash = hash;

            // Update database with transaction hash
            const { error: updateError } = await supabase
                .from('ledger_entries')
                .update({ tx_hash: txHash })
                .eq('id', entryId);

            if (updateError) {
                console.error('Error updating tx_hash:', updateError);
                showToast('Transaction confirmed but failed to update database. Please contact support.', 'warning');
            } else {
                showToast('✅ Entry upgraded to on-chain storage!', 'success');
                // Small delay to ensure database update is visible
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (err: any) {
            console.error('Error upgrading to on-chain:', err);
            let errorMessage = 'Unknown error';
            let shouldClose = false;
            
            if (err.message?.includes('User rejected') || err.code === 4001) {
                errorMessage = 'Transaction cancelled.';
                showToast('Transaction cancelled.', 'info');
                shouldClose = true; // Close on user cancellation
            } else if (err.message?.includes('already registered')) {
                errorMessage = 'This content is already registered on-chain.';
                showToast(errorMessage, 'warning');
                shouldClose = true; // Close if already registered
            } else if (err.message?.includes('chain') || err.message?.includes('network') || err.message?.includes('Wrong chain')) {
                errorMessage = 'Wrong network detected. Please switch to Base Sepolia and try again.';
                showToast(errorMessage, 'error');
                // Don't close on wrong chain - let user switch and retry
            } else {
                errorMessage = err.message || 'Unknown error';
                showToast(`Failed to upgrade: ${errorMessage}`, 'error');
                // Don't auto-close on other errors - let user see the error and decide
            }
            
            if (shouldClose) {
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
        } finally {
            setIsProcessing(false);
            setStatus('idle');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upgrade to On-Chain Storage"
            size="lg"
        >
            <div className="space-y-6">
                {/* Benefits Section */}
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <h3 className="text-lg font-bold mb-4 text-foreground">Why Upgrade to On-Chain Storage?</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold text-foreground">Immutable Timestamp</p>
                                <p className="text-sm text-muted-foreground">Your claim is permanently recorded on the blockchain with a verifiable timestamp that cannot be altered.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold text-foreground">Prevent Duplicate Claims</p>
                                <p className="text-sm text-muted-foreground">Once registered on-chain, no one else can claim the same content, protecting your ownership across the entire network.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold text-foreground">Stronger Proof for Funders</p>
                                <p className="text-sm text-muted-foreground">Brands and sponsors can verify your claim directly on BaseScan, providing maximum credibility for partnerships.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold text-foreground">Transaction Hash Verification</p>
                                <p className="text-sm text-muted-foreground">Get a transaction hash that links directly to BaseScan, making it easy for anyone to verify your claim independently.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cost Information */}
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-foreground">Upgrade Fee</p>
                            <p className="text-sm text-muted-foreground">One-time payment per entry</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-primary">0.0001 ETH</p>
                            <p className="text-xs text-muted-foreground">~$0.25 - $0.50</p>
                        </div>
                    </div>
                </div>

                {/* Current Status */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Current Status:</strong> Your entry is stored in our database with a cryptographic signature.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">After Upgrade:</strong> Your entry will be permanently recorded on the Base blockchain.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {status === 'switching' ? 'Switching Network...' : 'Processing...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Upgrade to On-Chain
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isProcessing && status === 'processing'}
                        className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-all disabled:opacity-50"
                    >
                        {isProcessing && status === 'processing' ? 'Processing...' : 'Maybe Later'}
                    </button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    You can upgrade this entry to on-chain storage at any time from your dashboard.
                </p>
            </div>
        </Modal>
    );
};

