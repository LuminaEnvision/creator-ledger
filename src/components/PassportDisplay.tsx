import React from 'react';
import { DynamicNFT } from './DynamicNFT';
import { ProNFT } from './ProNFT';

interface PassportDisplayProps {
    walletAddress: string;
    isPremium?: boolean;
}

export const PassportDisplay: React.FC<PassportDisplayProps> = ({ walletAddress, isPremium = false }) => {
    return (
        <div className="mt-4 glass-card rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300 mx-auto">
            <div className="text-center mb-4">
                <h3 className="text-xl font-black text-foreground tracking-tight">Creator's Passport</h3>
            </div>

            {/* NFT Display - Clean and Centered */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center">
                    {isPremium ? (
                        <ProNFT
                            size="md"
                            className="w-full h-full"
                        />
                    ) : (
                        <DynamicNFT
                            walletAddress={walletAddress}
                            size="md"
                            mode="free"
                        />
                    )}
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                    Onchain proof of original works
                </p>
            </div>
        </div>
    );
};

