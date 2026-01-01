import React from 'react';
import { Modal } from './Modal';

interface SignatureVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    signature: string;
}

export const SignatureVerificationModal: React.FC<SignatureVerificationModalProps> = ({
    isOpen,
    onClose,
    signature
}) => {
    const copySignature = () => {
        navigator.clipboard.writeText(signature);
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

                <div className="flex gap-3 pt-2">
                    <a
                        href="https://verify.etherscan.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        Verify on Etherscan
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

