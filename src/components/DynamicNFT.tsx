import React, { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { PASSPORT_CONTRACT_ADDRESS, PASSPORT_ABI } from '../lib/contracts';

interface DynamicNFTProps {
    walletAddress: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    mode?: 'free' | 'pro';
}

export const DynamicNFT: React.FC<DynamicNFTProps> = ({
    walletAddress,
    className = '',
    size = 'md',
    mode = 'free'
}) => {
    const [nftImage, setNftImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get token ID - specify chain ID explicitly
    const { data: tokenId, error: tokenIdError, isLoading: isLoadingTokenId, refetch: refetchTokenId } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'addressToTokenId',
        args: walletAddress ? [walletAddress.toLowerCase() as `0x${string}`] : undefined,
        chainId: base.id, // Explicitly specify Base
        query: {
            enabled: !!walletAddress && walletAddress.startsWith('0x'),
            retry: 2,
            staleTime: 0, // Always consider data stale to force refetch
            gcTime: 0, // Don't cache
        }
    });

    // Refetch when component mounts or wallet address changes
    useEffect(() => {
        if (walletAddress && walletAddress.startsWith('0x')) {
            refetchTokenId();
        }
    }, [walletAddress, refetchTokenId]);

    useEffect(() => {
        console.log('DynamicNFT: Contract check', {
            contractAddress: PASSPORT_CONTRACT_ADDRESS,
            walletAddress,
            tokenId: tokenId?.toString(),
            isLoadingTokenId,
            error: tokenIdError?.message
        });
    }, [PASSPORT_CONTRACT_ADDRESS, walletAddress, tokenId, isLoadingTokenId, tokenIdError]);

    useEffect(() => {
        if (tokenIdError) {
            // If error is "no data" (0x), it means no passport exists - this is expected
            if (tokenIdError.message?.includes('returned no data') || tokenIdError.message?.includes('0x')) {
                console.log('DynamicNFT: No passport found for wallet (this is normal if user hasn\'t minted yet):', walletAddress);
                setIsLoading(false);
            } else {
                console.error('DynamicNFT: Error fetching tokenId:', {
                    error: tokenIdError,
                    contractAddress: PASSPORT_CONTRACT_ADDRESS,
                    walletAddress,
                    message: tokenIdError.message
                });
                setIsLoading(false);
            }
        }
        if (tokenId !== undefined && !isLoadingTokenId) {
            console.log('DynamicNFT: TokenId found:', tokenId?.toString(), 'for wallet:', walletAddress);
            // tokenId of 0 means no passport has been minted for this address
            if (tokenId === 0n || tokenId === undefined) {
                console.log('DynamicNFT: TokenId is 0 - no passport minted yet for this address');
                setIsLoading(false);
            }
        }
    }, [tokenId, tokenIdError, walletAddress, isLoadingTokenId]);

    // Fetch tokenURI and extract image (only if tokenId is valid)
    const { data: tokenURI, error: tokenURIError, refetch: refetchTokenURI } = useReadContract({
        address: PASSPORT_CONTRACT_ADDRESS,
        abi: PASSPORT_ABI,
        functionName: 'tokenURI',
        args: tokenId && tokenId > 0n ? [tokenId] : undefined,
        chainId: base.id, // Explicitly specify Base
        query: {
            enabled: !!tokenId && tokenId > 0n, // Only fetch if tokenId is valid
            retry: 2,
            staleTime: 0, // Always consider data stale to force refetch
            gcTime: 0, // Don't cache
        }
    });

    useEffect(() => {
        // Reset loading state when dependencies change
        if (tokenId === undefined || isLoadingTokenId) {
            return;
        }

        if (tokenURIError) {
            console.error('DynamicNFT: Error fetching tokenURI:', tokenURIError);
            setIsLoading(false);
            return;
        }

        if (!tokenURI) {
            // If tokenId is valid but no tokenURI yet, keep loading
            if (tokenId && tokenId > 0n) {
                return; // Still loading tokenURI
            }
            console.log('DynamicNFT: No tokenURI available', { tokenId, walletAddress });
            setIsLoading(false);
            return;
        }

        const fetchNFTImage = async () => {
            try {
                console.log('DynamicNFT: Fetching image from tokenURI', { 
                    tokenURILength: tokenURI.length,
                    tokenURIPreview: tokenURI.substring(0, 150) 
                });
                
                // tokenURI is base64 encoded JSON with prefix "data:application/json;base64,"
                let base64Data = tokenURI;
                if (tokenURI.startsWith('data:application/json;base64,')) {
                    base64Data = tokenURI.replace('data:application/json;base64,', '');
                }
                
                const jsonString = atob(base64Data);
                const metadata = JSON.parse(jsonString);
                
                console.log('DynamicNFT: Parsed metadata', { 
                    hasImage: !!metadata.image,
                    imageType: metadata.image?.substring(0, 50),
                    metadataKeys: Object.keys(metadata)
                });
                
                // Extract image from metadata (it's base64 encoded SVG)
                if (metadata.image) {
                    let imageData = metadata.image;
                    
                    // Handle different image formats
                    if (imageData.startsWith('data:image/svg+xml;base64,')) {
                        // Already in correct format
                        setNftImage(imageData);
                    } else if (imageData.startsWith('data:image/svg+xml,')) {
                        // SVG without base64 - encode it
                        const svgContent = decodeURIComponent(imageData.replace('data:image/svg+xml,', ''));
                        setNftImage(`data:image/svg+xml;base64,${btoa(svgContent)}`);
                    } else if (!imageData.startsWith('data:')) {
                        // Assume it's base64 SVG content without prefix
                        setNftImage(`data:image/svg+xml;base64,${imageData}`);
                    } else {
                        // Use as-is
                        setNftImage(imageData);
                    }
                    
                    console.log('DynamicNFT: Image set successfully', { 
                        imageLength: imageData.length,
                        imageType: imageData.substring(0, 50)
                    });
                    setIsLoading(false);
                } else {
                    console.warn('DynamicNFT: No image in metadata', metadata);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('DynamicNFT: Error parsing NFT metadata:', error, { 
                    tokenURIPreview: tokenURI.substring(0, 150),
                    errorMessage: error instanceof Error ? error.message : String(error)
                });
                setIsLoading(false);
            }
        };

        fetchNFTImage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenURI, tokenId, walletAddress]); // Only include stable dependencies

    // Refetch tokenURI when tokenId changes
    useEffect(() => {
        if (tokenId && tokenId > 0n) {
            refetchTokenURI();
        }
    }, [tokenId, refetchTokenURI]);

    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48 md:w-64 md:h-64',
        lg: 'w-64 h-64 md:w-80 md:h-80'
    };
    
    // If className includes w-full or h-full, use those instead of size classes
    const hasFullSize = className?.includes('w-full') || className?.includes('h-full');

    // Show "No Passport" if tokenId is 0, undefined, or if there was an error indicating no passport
    const hasNoPassport = (!tokenId || tokenId === 0n) && !isLoadingTokenId && (!tokenIdError || tokenIdError.message?.includes('returned no data') || tokenIdError.message?.includes('0x'));
    
    if (hasNoPassport && !isLoading && !isLoadingTokenId) {
        return (
            <div className={`${hasFullSize ? '' : sizeClasses[size]} rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center ${className || ''}`}>
                <div className="text-center">
                    <div className="text-white/40 text-xs font-bold uppercase mb-1">No Passport</div>
                    <div className="text-white/20 text-2xl">—</div>
                    <div className="text-white/30 text-[10px] mt-2 px-2">Mint when you submit your first entry</div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={`${hasFullSize ? '' : sizeClasses[size]} rounded-3xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center ${className || ''}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If we have tokenId but no image after loading, show error state
    if (tokenId && tokenId > 0n && !nftImage && !isLoading && !tokenURIError) {
        return (
            <div className={`${hasFullSize ? '' : sizeClasses[size]} rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center ${className || ''}`}>
                <div className="text-center p-4">
                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Passport #{tokenId.toString()}</div>
                    <div className="text-white/20 text-2xl">—</div>
                    <div className="text-white/30 text-[10px] mt-2 px-2">Image loading...</div>
                </div>
            </div>
        );
    }

    // Pro mode styling
    const proStyles = mode === 'pro' 
        ? 'ring-1 ring-primary/40 shadow-[0_0_40px_rgba(var(--primary-rgb),0.25)]' 
        : '';
    
    const borderStyle = mode === 'pro' 
        ? 'border-primary/30' 
        : 'border-white/10';

    return (
        <div className={`${hasFullSize ? 'w-full h-full' : sizeClasses[size]} rounded-3xl overflow-hidden shadow-2xl border-2 ${borderStyle} bg-black ${proStyles} ${className || ''}`}>
            {nftImage ? (
                <img
                    src={nftImage}
                    alt={`Creator Passport NFT #${tokenId?.toString() || ''}`}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                    onError={(e) => {
                        console.error('Failed to load NFT image, showing fallback');
                        // Show fallback instead of hiding
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            parent.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                    <div class="text-center p-4">
                                        <div class="text-white/40 text-xs font-bold uppercase mb-1">Passport #${tokenId?.toString() || 'N/A'}</div>
                                        <div class="text-white/20 text-2xl">—</div>
                                        <div class="text-white/30 text-[10px] mt-2">Image unavailable</div>
                                    </div>
                                </div>
                            `;
                        }
                    }}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-white/40 text-sm">Loading NFT...</div>
                </div>
            )}
        </div>
    );
};


