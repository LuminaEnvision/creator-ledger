import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { edgeFunctions } from '../lib/edgeFunctions';
import { BasePayButton } from '@base-org/account-ui/react';
import { pay } from '@base-org/account';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { isAddress, getAddress } from 'viem';

import { FreePassport } from '../components/passports/FreePassport';
import { PremiumPassport } from '../components/passports/PremiumPassport';
import { NFTImageFrame } from '../components/NFTImageFrame';
import { isPremiumWhitelisted } from '../lib/premium';

export const Pricing: React.FC = () => {
    const { user } = useAuth();
    const { address, isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);
    const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const checkPremium = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            const { user: userData } = await edgeFunctions.getUser();
            const data = userData;

            if (data) {
                // Check if subscription is still active (not expired)
                const now = new Date();
                const subscriptionEnd = data.subscription_end ? new Date(data.subscription_end) : null;
                const isActive = data.subscription_active === true &&
                    (!subscriptionEnd || subscriptionEnd > now);

                // Premium status: Active subscription takes priority over legacy flag
                // If subscription exists but is expired, user is NOT premium (even if legacy flag is true)
                // Legacy flag only grants premium if no subscription system was ever used
                // OR whitelisted for testing
                const hasSubscription = data.subscription_active !== null && data.subscription_active !== undefined;
                const dbPremiumStatus = isActive || (!hasSubscription && data.is_premium === true);
                const isWhitelisted = user ? isPremiumWhitelisted(user.walletAddress) : false;
                const premiumStatus = dbPremiumStatus || isWhitelisted;
                setIsPremium(premiumStatus);

                if (isWhitelisted) {
                    console.log('✅ Premium whitelist active for wallet:', user?.walletAddress.toLowerCase());
                }

                if (subscriptionEnd) {
                    setSubscriptionEnd(subscriptionEnd);
                }

                // Auto-update if subscription expired
                if (data.subscription_active && subscriptionEnd && subscriptionEnd <= now) {
                    await edgeFunctions.updateUser({
                        subscription_active: false,
                        is_premium: false
                    });
                    setIsPremium(false);
                    setSubscriptionEnd(null);
                }
            }
            setIsLoading(false);
        };
        checkPremium();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleTestPremium = async () => {
        if (!user) {
            openConnectModal?.();
            return;
        }

        setIsProcessing(true);
        try {
            // Calculate subscription dates (30 days from now) for test mode
            const now = new Date();
            const subscriptionEnd = new Date(now);
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

            const walletAddress = user.walletAddress.toLowerCase();

            // First, check if user exists, if not create them
            try {
                const { user: existingUser } = await edgeFunctions.getUser();
                if (!existingUser) {
                    // Create user first if they don't exist
                    await edgeFunctions.createUser();
                }
            } catch (err: any) {
                // User might not exist, try to create
                try {
                    await edgeFunctions.createUser();
                } catch (createErr: any) {
                    console.error('Error creating user:', createErr);
                    throw new Error('Failed to create user: ' + createErr.message);
                }
            }

            // Update user premium status and subscription via Edge Function (bypass payment for testing)
            await edgeFunctions.updateUser({
                is_premium: true,
                subscription_active: true,
                subscription_start: now.toISOString(),
                subscription_end: subscriptionEnd.toISOString()
            });

            console.log('✅ Test premium activated:', {
                is_premium: true,
                subscription_active: true,
                subscription_end: subscriptionEnd.toISOString(),
                wallet: walletAddress
            });

            // Wait longer for database to commit and propagate
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Verify the update worked by fetching again
            const { user: verifyUser } = await edgeFunctions.getUser();

            console.log('🔍 Verification fetch:', verifyUser);

            // Only set premium state after successful verification to avoid desynchronization
            if (verifyUser && verifyUser.subscription_active === true) {
                setIsPremium(true);
            } else {
                console.error('❌ Verification failed! User data:', verifyUser);
                alert('⚠️ Warning: Premium activation may not have saved correctly. Please refresh the page manually.');
                // Don't set isPremium to true if verification failed
                return; // Exit early to prevent navigation
            }

            alert(`✅ Test mode: Premium subscription activated until ${subscriptionEnd.toLocaleDateString()}! (No payment required)\n\nRedirecting to Dashboard...`);

            // Navigate to dashboard with refresh parameters (stays in-app)
            navigate('/?refresh=' + Date.now() + '&premium=' + Date.now());
        } catch (err: any) {
            console.error('Failed to activate test premium:', err);
            alert(`Failed to activate premium: ${err?.message || 'Please try again.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpgrade = async () => {
        if (!user || !isConnected || !address) {
            openConnectModal?.();
            return;
        }

        // Operations address - same as the one receiving submission fees
        // This address receives both submission fees (from free users) and subscription payments
        const OPERATIONS_ADDRESS = '0x7eB8F203167dF3bC14D59536E671528dd97FB72a' as `0x${string}`;

        // Set processing state before validation to ensure consistent state
        setIsProcessing(true);

        // Validate and format the operations address
        let formattedTreasuryAddress: `0x${string}`;
        try {
            if (!isAddress(OPERATIONS_ADDRESS)) {
                throw new Error(`Invalid operations address format: ${OPERATIONS_ADDRESS}`);
            }
            // Use getAddress to get proper checksummed address
            formattedTreasuryAddress = getAddress(OPERATIONS_ADDRESS) as `0x${string}`;
        } catch (addrError: any) {
            console.error('Address validation error:', addrError);
            alert(`Payment configuration error: ${addrError.message}.`);
            setIsProcessing(false);
            return;
        }
        try {
            // Use Base Pay SDK to process payment
            // Note: Base Pay SDK expects the address to be a valid Ethereum address
            const result = await pay({
                amount: '9.00',
                to: formattedTreasuryAddress,
                testnet: true // Set to false for mainnet
            });

            if (result && result.id) {
                // Calculate subscription dates (30 days from now)
                const now = new Date();
                const subscriptionEnd = new Date(now);
                subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // Add 1 month

                // Update user premium status and subscription via Edge Function
                await edgeFunctions.updateUser({
                    is_premium: true,
                    subscription_active: true,
                    subscription_start: now.toISOString(),
                    subscription_end: subscriptionEnd.toISOString()
                });

                setIsPremium(true);
                alert(`Success! Your Pro Creator subscription is now active until ${subscriptionEnd.toLocaleDateString()}.`);
                navigate('/');
            }
        } catch (err: any) {
            console.error('Payment failed:', err);
            alert(`Payment failed: ${err?.message || 'Please try again.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const TierCard = ({ title, price, features, isPro, isActive, image, nftComponent, subscriptionEndDate }: { title: string, price: string, features: string[], isPro?: boolean, isActive?: boolean, image?: string, nftComponent?: React.ReactNode, subscriptionEndDate?: Date | null }) => {
        return (
            <div className={`relative glass-card p-8 rounded-3xl flex flex-col h-full border-2 transition-all duration-500 ${isPro ? 'border-primary shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)] z-10' : 'border-border/50 hover:border-primary/30'}`}>

                <div className="mb-8 min-h-[96px] flex flex-col justify-end">
                    <h3 className="text-xl font-bold uppercase tracking-tighter">
                        {title}
                    </h3>

                    <div className="flex items-baseline gap-1 h-[40px]">
                        <span className="text-4xl font-black leading-none">
                            {price}
                        </span>

                        {/* RESERVED SLOT - always takes space for alignment */}
                        <span className="text-muted-foreground text-sm w-[60px]">
                            {price !== 'Free' ? '/month' : ''}
                        </span>
                    </div>
                </div>

                <NFTImageFrame isPro={isPro}>
                    {nftComponent ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {nftComponent}
                        </div>
                    ) : image ? (
                        <img
                            src={image}
                            alt={`${title} NFT`}
                            className="w-full h-full object-cover"
                        />
                    ) : null}
                </NFTImageFrame>

                <ul className="space-y-4 mb-10 flex-1">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <svg className={`w-5 h-5 mt-0.5 shrink-0 ${isPro ? 'text-primary' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className={isPro ? 'text-foreground font-medium' : 'text-muted-foreground'}>{feature}</span>
                        </li>
                    ))}
                </ul>

                {isActive ? (
                    <div className="w-full space-y-2">
                        <div className="w-full py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-center">
                            <div className="font-bold text-sm mb-1">Current Plan</div>
                            {subscriptionEndDate && isPro && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                    Renews {subscriptionEndDate.toLocaleDateString()}
                                </div>
                            )}
                        </div>
                        {isPro ? (
                            <button
                                onClick={handleUpgrade}
                                disabled={isProcessing}
                                className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Renew Subscription'}
                            </button>
                        ) : (
                            <div className="w-full py-2 rounded-xl bg-secondary/50 text-muted-foreground text-xs font-bold uppercase tracking-wider text-center">
                                Free Plan Active
                            </div>
                        )}
                    </div>
                ) : isPro ? (
                    <div className="w-full space-y-2">
                        {/* Test Mode Button - Only show in development */}
                        {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_MODE === 'true') && (
                            <button
                                onClick={handleTestPremium}
                                disabled={isProcessing}
                                className="w-full py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🧪 Test Premium (No Payment)
                            </button>
                        )}
                        {!isConnected ? (
                            <button
                                onClick={() => openConnectModal?.()}
                                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Connect Wallet to Upgrade
                            </button>
                        ) : (
                            <div>
                                {isProcessing ? (
                                    <div className="w-full py-4 rounded-2xl bg-primary/50 text-white font-black uppercase tracking-widest text-center cursor-not-allowed">
                                        Processing payment...
                                    </div>
                                ) : (
                                    <BasePayButton
                                        colorScheme="dark"
                                        onClick={handleUpgrade}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        disabled
                        className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-bold text-sm cursor-not-allowed uppercase tracking-wider"
                    >
                        Already Active
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
                    Level Up Your <span className="text-primary italic">Presence</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                    Secure your digital legacy with onchain verification.
                    Monthly subscription keeps your Pro status active.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch pt-8">
                <TierCard
                    title="Essential"
                    price="Free"
                    isActive={!isPremium && !!user}
                    nftComponent={
                        <FreePassport
                            walletAddress={user?.walletAddress || '0x520...c560'}
                            entryCount={12}
                            size="lg"
                            className="w-full h-full transform scale-90"
                        />
                    }
                    subscriptionEndDate={null}
                    features={[
                        "Basic Ledger Submission",
                        "Platform Auto-Detection",
                        "Public Profile Page",
                        "Basic Social Proofing",
                        "Standard Verification (Manual)",
                    ]}
                />
                <TierCard
                    title="Pro Creator"
                    price="9 USDC"
                    isPro={true}
                    isActive={isPremium}
                    nftComponent={
                        <PremiumPassport
                            walletAddress={user?.walletAddress || '0x520...c560'}
                            entryCount={248}
                            username="YOU"
                            size="lg"
                            className="w-full h-full transform scale-90"
                        />
                    }
                    subscriptionEndDate={subscriptionEnd}
                    features={[
                        "Cryptographic Onchain Proof",
                        "Verified View Tracking",
                        "Custom Profile Themes",
                        "Priority Admin Review",
                        "Advanced Export (CSV/PDF)",
                        "Exclusive 'Pro' Badge",
                        "Priority Support"
                    ]}
                />
            </div>

            <div className="mt-20 glass-card p-10 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Need a Custom Solution?</h2>
                        <p className="text-slate-400 font-medium">For agencies managing 10+ creators, we offer enterprise pricing and bulk verification.</p>
                    </div>
                    <a
                        href="mailto:crtrledger@gmail.com?subject=Enterprise Pricing Inquiry"
                        className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all inline-block text-center"
                    >
                        Contact Sales
                    </a>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold">
                Secure payments powered by <span className="text-primary">Base</span>
            </div>
        </div>
    );
};
