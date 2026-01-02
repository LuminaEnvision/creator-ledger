import React, { useEffect } from 'react';
import { DynamicNFT } from './DynamicNFT';
import { ProNFT } from './ProNFT';

interface PassportModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
    isPremium?: boolean;
    buttonPosition?: { top: number; left: number } | null;
}

export const PassportModal: React.FC<PassportModalProps> = ({ isOpen, onClose, walletAddress, isPremium = false, buttonPosition }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            const originalOverflow = document.body.style.overflow;
            const originalPosition = document.body.style.position;
            const originalTop = document.body.style.top;
            const originalWidth = document.body.style.width;
            
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            
            return () => {
                document.body.style.overflow = originalOverflow || '';
                document.body.style.position = originalPosition || '';
                document.body.style.top = originalTop || '';
                document.body.style.width = originalWidth || '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content - positioned below button */}
            <div className="fixed inset-0 z-[9999] overflow-y-auto pointer-events-none">
                <div 
                    className="relative w-full max-w-lg bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 pointer-events-auto mx-auto"
                    style={buttonPosition ? {
                        marginTop: `${Math.max(buttonPosition.top + 8, 20)}px`,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        maxWidth: '32rem'
                    } : {
                        marginTop: '6rem',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        maxWidth: '32rem'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-border">
                        <h3 className="text-xl font-black text-foreground tracking-tight">Creator Passport</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent/20 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* NFT Display */}
                    <div className="p-8 flex flex-col items-center gap-6">
                        <div className="group relative w-full max-w-[400px]">
                            {/* Glow effect */}
                            <div className={`absolute -inset-8 rounded-[4rem] blur-3xl opacity-40 group-hover:opacity-60 transition duration-1000 ${isPremium ? 'bg-primary' : 'bg-slate-400'}`}></div>
                            
                            {/* Decorative rings */}
                            <div className="absolute -inset-4 rounded-[3rem] border-2 border-primary/20 group-hover:border-primary/40 transition-colors"></div>
                            <div className="absolute -inset-2 rounded-[2.5rem] border border-primary/10"></div>
                            
                            {/* NFT Container */}
                            <div className="relative z-10 p-4 bg-background/50 backdrop-blur-sm rounded-[2rem] border-2 border-primary/30 shadow-xl">
                                {isPremium ? (
                                    <ProNFT
                                        size="lg"
                                        className="transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 w-full h-full"
                                    />
                                ) : (
                                    <DynamicNFT
                                        walletAddress={walletAddress}
                                        size="lg"
                                        mode="free"
                                        className="transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1"
                                    />
                                )}
                            </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground text-center">
                            Onchain proof of original works
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

