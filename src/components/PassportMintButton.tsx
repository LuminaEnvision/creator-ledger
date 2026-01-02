import React, { useState } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseEther } from 'viem';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';

interface PassportMintButtonProps {
    walletAddress: string;
    verifiedEntriesCount: number;
    onSuccess?: () => void;
}

export const PassportMintButton: React.FC<PassportMintButtonProps> = ({
    walletAddress,
    verifiedEntriesCount,
    onSuccess
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { writeContractAsync } = useWriteContract();

    // Check if user has a passport
    const { data: tokenId, refetch: refetchTokenId } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'addressToTokenId',
        args: [walletAddress.toLowerCase() as `0x${string}`],
        chainId: baseSepolia.id,
        query: {
            enabled: !!walletAddress,
        }
    });

    // Get current entry count from onchain
    const { data: passportData } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'passportData',
        args: tokenId && tokenId > 0n ? [tokenId] : undefined,
        chainId: baseSepolia.id,
        query: {
            enabled: !!tokenId && tokenId > 0n,
        }
    });

    const hasPassport = tokenId && tokenId > 0n;
    const hasVerifiedEntries = verifiedEntriesCount > 0;
    
    // Calculate how many entries need to be added
    const currentEntryCount = passportData ? Number(passportData[0]) : 0;
    const entriesToAdd = Math.max(0, verifiedEntriesCount - currentEntryCount);
    const OPERATIONS_FEE = parseEther('0.00025'); // 0.00025 ETH per entry
    const totalFee = entriesToAdd > 0 ? OPERATIONS_FEE * BigInt(entriesToAdd) : 0n;

    // Don't show button if no verified entries
    if (!hasVerifiedEntries) {
        return null;
    }

    const handleMint = async () => {
        if (!walletAddress) return;

        setIsProcessing(true);
        try {
            if (!hasPassport) {
                // Mint new passport (starts at 0 entries)
                console.log('Minting new passport...');
                await writeContractAsync({
                    address: PASSPORT_CONTRACT_ADDRESS,
                    abi: PASSPORT_ABI,
                    functionName: 'mint',
                    value: 0n, // No fee for minting
                    chainId: baseSepolia.id,
                });
                
                // After minting, upgrade to match verified entries
                if (verifiedEntriesCount > 0) {
                    console.log(`Upgrading passport by ${verifiedEntriesCount} entries...`);
                    const upgradeFee = OPERATIONS_FEE * BigInt(verifiedEntriesCount);
                    await writeContractAsync({
                        address: PASSPORT_CONTRACT_ADDRESS,
                        abi: PASSPORT_ABI,
                        functionName: 'incrementEntryCountBy',
                        args: [BigInt(verifiedEntriesCount)],
                        value: upgradeFee,
                        chainId: baseSepolia.id,
                    });
                    alert(`✅ Passport minted and upgraded to level ${verifiedEntriesCount}!`);
                } else {
                    alert('✅ Passport minted successfully!');
                }
            } else if (entriesToAdd > 0) {
                // Upgrade existing passport by the number of entries needed
                console.log(`Upgrading passport by ${entriesToAdd} entries (from ${currentEntryCount} to ${verifiedEntriesCount})...`);
                await writeContractAsync({
                    address: PASSPORT_CONTRACT_ADDRESS,
                    abi: PASSPORT_ABI,
                    functionName: 'incrementEntryCountBy',
                    args: [BigInt(entriesToAdd)],
                    value: totalFee,
                    chainId: baseSepolia.id,
                });
                alert(`✅ Passport upgraded! Entry count updated from ${currentEntryCount} to ${verifiedEntriesCount}.`);
            } else {
                alert('✅ Your passport is already up to date!');
                setIsProcessing(false);
                return;
            }
            
            // Refresh tokenId and passport data
            await refetchTokenId();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error minting/upgrading passport:', error);
            if (error?.message?.includes('User rejected') || error?.shortMessage?.includes('User rejected')) {
                // User cancelled - no error needed
                return;
            }
            alert(`Error: ${error?.shortMessage || error?.message || 'Failed to mint/upgrade passport'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-sm">
            <button
                onClick={handleMint}
                disabled={isProcessing}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                    </>
                ) : hasPassport && entriesToAdd > 0 ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Upgrade to Level {verifiedEntriesCount}</span>
                        {totalFee > 0n && (
                            <span className="text-xs opacity-90">
                                ({(Number(totalFee) / Number(parseEther('1'))).toFixed(4)} ETH)
                            </span>
                        )}
                    </>
                ) : hasPassport ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Up to Date</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Mint Passport</span>
                    </>
                )}
            </button>
            {entriesToAdd > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                    {entriesToAdd} {entriesToAdd === 1 ? 'entry' : 'entries'} ready to upgrade
                </p>
            )}
        </div>
    );
};


