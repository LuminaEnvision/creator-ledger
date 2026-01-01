import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifySignature } from '../lib/signatureVerification';

export const VerifySignature: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const address = searchParams.get('address') || '';
    const signature = searchParams.get('signature') || '';
    const message = decodeURIComponent(searchParams.get('message') || '');

    useEffect(() => {
        if (address && signature && message) {
            verify();
        }
    }, [address, signature, message]);

    const verify = async () => {
        if (!address || !signature || !message) {
            setError('Missing required parameters: address, signature, or message');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const result = await verifySignature(message, signature, address);
            setIsValid(result);
            if (!result) {
                setError('Signature verification failed. The signature does not match the message and address.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setIsValid(false);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full glass-card rounded-2xl p-8 border border-border">
                <h1 className="text-3xl font-black mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Signature Verification
                </h1>

                {isVerifying ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Verifying signature...</p>
                    </div>
                ) : isValid === null ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Preparing verification...</p>
                    </div>
                ) : isValid ? (
                    <div className="space-y-4">
                        <div className="p-6 rounded-xl bg-green-500/10 border-2 border-green-500/30">
                            <div className="flex items-center gap-3 mb-3">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2 className="text-xl font-bold text-green-500">Signature Verified ✓</h2>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                                This signature is <strong>authentic</strong> and was created by the wallet address provided.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Wallet Address
                                </label>
                                <div className="px-4 py-3 rounded-xl bg-background border border-border font-mono text-sm break-all">
                                    {address}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Message
                                </label>
                                <div className="px-4 py-3 rounded-xl bg-background border border-border text-sm whitespace-pre-wrap break-words">
                                    {message}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Signature
                                </label>
                                <div className="px-4 py-3 rounded-xl bg-background border border-border font-mono text-xs break-all">
                                    {signature}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30">
                            <div className="flex items-center gap-3 mb-3">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2 className="text-xl font-bold text-red-500">Verification Failed ✗</h2>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                                {error || 'The signature does not match the provided message and wallet address.'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Wallet Address
                                </label>
                                <div className="px-4 py-3 rounded-xl bg-background border border-border font-mono text-sm break-all">
                                    {address}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Message
                                </label>
                                <div className="px-4 py-3 rounded-xl bg-background border border-border text-sm whitespace-pre-wrap break-words">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        This verification proves that the wallet address signed the message, but does not prove ownership or creation of the content itself.
                    </p>
                </div>
            </div>
        </div>
    );
};

