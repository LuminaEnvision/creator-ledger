import React, { useState } from 'react';
import { EditEntryModal } from './EditEntryModal';
import { EntryEndorsement } from './EntryEndorsement';
import { SignatureVerificationModal } from './SignatureVerificationModal';
import { useToast } from '../hooks/useToast';
import type { LedgerEntry } from '../types';

interface EntryListProps {
    entries: LedgerEntry[];
    isLoading: boolean;
    isPremium?: boolean;
    currentWalletAddress?: string; // To show edit button only for own entries
    onEntryUpdated?: () => void;
}

export const EntryList: React.FC<EntryListProps> = ({ 
    entries, 
    isLoading, 
    isPremium = false,
    currentWalletAddress,
    onEntryUpdated
}) => {
    const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
    const [signatureModal, setSignatureModal] = useState<{ 
        isOpen: boolean; 
        signature: string; 
        walletAddress: string;
        message: string;
        entryId?: string;
    }>({ 
        isOpen: false, 
        signature: '',
        walletAddress: '',
        message: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();
    
    const entriesPerPage = 9;
    const totalPages = Math.ceil(entries.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const currentEntries = entries.slice(startIndex, endIndex);
    
    // Reset to page 1 when entries change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [entries.length]);
    if (isLoading && entries.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border bg-white/5 backdrop-blur-sm">
                <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-muted-foreground">Your library is empty. Add your first content piece above!</p>
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEntries.map((entry) => (
                <div key={entry.id} className="glass-card group flex flex-col rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl">
                    {/* Visual Preview Header */}
                    <div className="relative aspect-video bg-muted overflow-hidden">
                        {(entry.custom_image_url || entry.image_url) ? (
                            <img
                                src={entry.custom_image_url || entry.image_url}
                                alt={entry.title || 'Post preview'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                                <span className="text-4xl font-bold opacity-20">{entry.platform[0]}</span>
                            </div>
                        )}

                        {/* Verification Status Badge */}
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                            {entry.verification_status === 'Unverified' && (
                                <div className="px-2.5 py-1 rounded-full bg-yellow-500/80 backdrop-blur-lg border border-yellow-400/50 text-white shadow-lg">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Pending Review</span>
                                </div>
                            )}
                            {entry.verification_status === 'Verified' && (
                                <div className="px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-lg border border-green-400/50 text-white shadow-lg">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                </div>
                            )}
                            {entry.verification_status === 'Rejected' && (
                                <div className="px-2.5 py-1 rounded-full bg-red-500/80 backdrop-blur-lg border border-red-400/50 text-white shadow-lg">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Rejected</span>
                                </div>
                            )}
                        </div>

                        {/* Verification Unified Badge */}
                        <div className="absolute top-3 right-3 z-10">
                            {entry.signature ? (
                                isPremium ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-lg border border-green-400/50 text-white shadow-xl group/verify cursor-help">
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Verified Authenticity</span>

                                        <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-xl bg-card border border-border text-[10px] text-muted-foreground opacity-0 group-hover/verify:opacity-100 transition-all pointer-events-none shadow-2xl translate-y-2 group-hover/verify:translate-y-0">
                                            <p className="font-bold text-green-500 mb-1">PRO PROOF</p>
                                            This content is cryptographically signed by the creator's wallet on-chain.
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => showToast("Upgrade to Pro to unlock premium features.", 'info', 5000)}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-lg border border-primary/30 text-white/90 shadow-lg group/locked cursor-pointer hover:bg-primary/30 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Unlock Verified Proof</span>
                                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] ml-1 hover:bg-white/40">?</div>

                                        <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-xl bg-card border border-border text-[10px] text-primary opacity-0 group-hover/locked:opacity-100 transition-all pointer-events-none shadow-2xl translate-y-2 group-hover/locked:translate-y-0 z-50">
                                            <p className="font-bold text-primary mb-1">PREMIUM FEATURE</p>
                                            Click to view on-chain verification.
                                        </div>
                                    </div>
                                )
                            ) : null}
                        </div>

                        <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                                {entry.platform}
                            </span>
                        </div>
                    </div>

                    {/* Content Detail */}
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1 line-clamp-2 leading-tight">
                                {entry.title || entry.url}
                                <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-flex items-center justify-center p-1 rounded-md bg-secondary text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </h4>
                            {entry.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-snug">
                                    {entry.description}
                                </p>
                            )}
                        </div>



                        <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
                            {/* Verification Details - Professional for Funders/Hirers */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Verified</span>
                                    <span className="text-xs font-semibold text-foreground">
                                        {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                
                                {/* Transaction Link - If available */}
                                {(entry as any).tx_hash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${(entry as any).tx_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors group/tx"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span className="font-mono truncate">View on BaseScan</span>
                                        <svg className="w-3 h-3 group-hover/tx:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                )}
                                
                                {/* Signature Proof Link */}
                                {entry.signature && (
                                    <button
                                        onClick={() => {
                                            // Reconstruct the message that was signed
                                            const message = `Creator Ledger Verification\n\nI, ${entry.wallet_address}, affirm ownership/creation of the content at:\n${entry.url}\n\nTimestamp: ${entry.timestamp}\nHash: ${entry.payload_hash}`;
                                            setSignatureModal({ 
                                                isOpen: true, 
                                                signature: entry.signature!,
                                                walletAddress: entry.wallet_address,
                                                message: message,
                                                entryId: entry.id
                                            });
                                        }}
                                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors group/sig"
                                        title="View cryptographic proof"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span className="font-semibold">Cryptographic Proof</span>
                                        <svg className="w-3 h-3 opacity-0 group-hover/sig:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    View Original
                                    <svg className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                                {currentWalletAddress && entry.wallet_address.toLowerCase() === currentWalletAddress.toLowerCase() && (
                                    <button
                                        onClick={() => setEditingEntry(entry)}
                                        className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-primary border border-border"
                                        title="Edit entry"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Endorsement System - Only show on public profiles (when currentWalletAddress is not the creator) */}
                            {(!currentWalletAddress || entry.wallet_address.toLowerCase() !== currentWalletAddress.toLowerCase()) && (
                                <EntryEndorsement
                                    entryId={entry.id}
                                    walletAddress={entry.wallet_address}
                                    currentEndorsements={entry.endorsement_count}
                                    currentDisputes={entry.dispute_count}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                >
                    Previous
                </button>
                <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                currentPage === page
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                >
                    Next
                </button>
            </div>
        )}
        
        {editingEntry && (
            <EditEntryModal
                entry={editingEntry}
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                onSuccess={() => {
                    setEditingEntry(null);
                    onEntryUpdated?.();
                }}
            />
        )}
        <SignatureVerificationModal
            isOpen={signatureModal.isOpen}
            onClose={() => setSignatureModal({ isOpen: false, signature: '', walletAddress: '', message: '' })}
            signature={signatureModal.signature}
            walletAddress={signatureModal.walletAddress}
            message={signatureModal.message}
            entryId={signatureModal.entryId}
        />
    </>
    );
};
