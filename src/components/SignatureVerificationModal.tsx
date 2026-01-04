import React from 'react';
import { Modal } from './Modal';
import { createVerificationUrl } from '../lib/signatureVerification';
import { useToast } from '../hooks/useToast';

interface SignatureVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    signature: string;
    walletAddress: string;
    message: string;
    entryId?: string;
}

export const SignatureVerificationModal: React.FC<SignatureVerificationModalProps> = ({
    isOpen,
    onClose,
    signature,
    walletAddress,
    message,
    entryId
}) => {
    const { showToast } = useToast();

    const copySignature = () => {
        navigator.clipboard.writeText(signature);
        showToast('Signature copied to clipboard!', 'success');
    };

    const verificationUrl = createVerificationUrl(walletAddress, signature, message, entryId);
    
    const copyVerificationLink = () => {
        navigator.clipboard.writeText(window.location.origin + verificationUrl);
        showToast('Verification link copied!', 'success');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Cryptographic Proof"
            size="md"
        >
            <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground leading-relaxed mb-3">
                        This signature is a <strong className="text-primary">cryptographic proof</strong> that the creator signed a message claiming ownership of this content.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Anyone can verify this signature using the creator's wallet address to confirm the content was authentically claimed by them.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Signature
                    </label>
                    <div className="relative">
                        <textarea
                            readOnly
                            value={signature}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-xs resize-none"
                            rows={4}
                        />
                        <button
                            onClick={copySignature}
                            className="absolute top-2 right-2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Copy signature"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                        <a
                            href={verificationUrl}
                            className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify Signature
                        </a>
                        <button
                            onClick={copyVerificationLink}
                            className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-all flex items-center gap-2"
                            title="Copy verification link"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={`https://basescan.org/address/${walletAddress}#code`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on BaseScan
                        </a>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

