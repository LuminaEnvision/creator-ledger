import React, { useState } from 'react';
import { EditEntryModal } from './EditEntryModal';
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
            {entries.map((entry) => (
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
                                        onClick={() => alert("PREMIUM ANALYTICS\n\nUpgrade to Pro to unlock:\n• Real-time View Tracking\n• Like & Engagement Counts\n• Performance Benchmarking\n\nAll stats are cryptographically verified to increase your market value.")}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-lg border border-primary/30 text-white/90 shadow-lg group/locked cursor-pointer hover:bg-primary/30 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Unlock Verified Proof</span>
                                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] ml-1 hover:bg-white/40">?</div>

                                        <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-xl bg-card border border-border text-[10px] text-primary opacity-0 group-hover/locked:opacity-100 transition-all pointer-events-none shadow-2xl translate-y-2 group-hover/locked:translate-y-0 z-50">
                                            <p className="font-bold text-primary mb-1">PREMIUM FEATURE</p>
                                            Click to see how on-chain stats can help you land brand deals.
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

                        {/* Integrated Analytics Section */}
                        <div className="my-4">
                            {isPremium ? (
                                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-primary/60">Views</span>
                                        <span className="text-sm font-extrabold text-foreground tracking-tighter">
                                            {((entry.stats?.views || 0) / 1000).toFixed(1)}K
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center border-x border-primary/10">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-primary/60">Likes</span>
                                        <span className="text-sm font-extrabold text-foreground tracking-tighter">
                                            {((entry.stats?.likes || 0) / 1000).toFixed(1)}K
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-primary/60">Engage</span>
                                        <span className="text-sm font-extrabold text-foreground tracking-tighter">
                                            {(((entry.stats?.likes || 0) / (entry.stats?.views || 1)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => alert("SOCIAL PROOF ANALYTICS\n\nThis feature generates verified stats for your post:\n• Total Views\n• Total Engagement\n• Viral Potential\n\nBrands are 3x more likely to work with creators who have verified social proof.")}
                                    className="p-3 rounded-2xl bg-secondary/50 border border-border border-dashed flex items-center justify-center gap-2 group/stats cursor-pointer hover:bg-secondary/80 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Locked Analytics</span>
                                    <div className="w-4 h-4 rounded-full bg-muted-foreground/10 flex items-center justify-center text-[10px] ml-1 text-muted-foreground/40 font-bold border border-muted-foreground/20">?</div>
                                </div>
                            )}
                        </div>

                        {entry.signature && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(entry.signature!);
                                    alert('Signature copied to clipboard!\nYou can verify this at verify.etherscan.io');
                                }}
                                className="w-full mb-4 p-2 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all group/sig text-left relative overflow-hidden"
                                title="Click to copy signature"
                            >
                                <div className="absolute inset-y-0 right-2 flex items-center opacity-0 group-hover/sig:opacity-100 transition-opacity">
                                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </div>
                                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1 group-hover/sig:text-primary transition-colors">On-Chain Proof (Click to Copy)</p>
                                <p className="text-[10px] font-mono text-muted-foreground truncate pr-6">{entry.signature}</p>
                            </button>
                        )}

                        <div className="mt-auto pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Timestamp</span>
                                    <span className="text-xs font-semibold">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                </div>
                                {currentWalletAddress && entry.wallet_address.toLowerCase() === currentWalletAddress.toLowerCase() && (
                                    <button
                                        onClick={() => setEditingEntry(entry)}
                                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                                        title="Edit entry"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full block px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                View Post
                                <svg className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
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
    </>
    );
};
