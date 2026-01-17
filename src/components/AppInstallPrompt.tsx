import React, { useState, useEffect } from 'react';
import { useFarcaster } from '../context/FarcasterContext';
import { detectEnvironment } from '../lib/environment';
import { sdk } from '@farcaster/miniapp-sdk';

export const AppInstallPrompt: React.FC = () => {
    const { isAvailable: isFarcasterAvailable } = useFarcaster();
    const [isDismissed, setIsDismissed] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const env = detectEnvironment();

    // Determine which environment we're in
    const isFarcasterEnvironment = env.isFarcasterEnv || (env.isFarcaster && !env.isBase);
    const isBaseEnvironment = env.isBase || env.environment === 'base';

    useEffect(() => {
        // Check if user has already dismissed the prompt
        const dismissed = localStorage.getItem('appInstallPromptDismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        // Show prompt if in Farcaster or Base App environment
        // Show different flows based on the specific environment
        if (isFarcasterAvailable && (isFarcasterEnvironment || isBaseEnvironment)) {
            // Show after a short delay to not interrupt initial load
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isFarcasterAvailable, isFarcasterEnvironment, isBaseEnvironment]);

    const handleAddToFarcaster = async () => {
        try {
            // Add app to Farcaster collection
            await sdk.actions.addMiniApp();
            // Mark as dismissed after successful add
            handleDismiss();
        } catch (error) {
            console.error('Error adding app to Farcaster:', error);
            // Don't dismiss on error so user can try again
        }
    };

    const handlePinToBase = async () => {
        try {
            // Pin app to Base App home (uses same SDK method but different context)
            await sdk.actions.addMiniApp();
            // Mark as dismissed after successful pin
            handleDismiss();
        } catch (error) {
            console.error('Error pinning app to Base:', error);
            // Don't dismiss on error so user can try again
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        setShowPrompt(false);
        localStorage.setItem('appInstallPromptDismissed', 'true');
    };

    if (isDismissed || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="glass-card p-6 rounded-2xl border-2 border-primary/30 shadow-2xl relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Dismiss"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="text-lg font-bold mb-1">
                                {isBaseEnvironment
                                    ? 'Pin Creator Ledger to Base App'
                                    : 'Add Creator Ledger to Farcaster'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isBaseEnvironment
                                    ? 'Pin this app to your Base App home for easy access to your creator portfolio and ledger entries.'
                                    : 'Add this app to your Farcaster collection for quick access to your creator portfolio and ledger entries.'}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={isBaseEnvironment ? handlePinToBase : handleAddToFarcaster}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
                            >
                                {isBaseEnvironment ? 'Pin to Base App' : 'Add to Farcaster'}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2.5 rounded-xl glass-card border border-border hover:bg-muted/50 transition-colors text-sm font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

