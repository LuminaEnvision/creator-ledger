import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { detectPlatform } from '../lib/platform';
import { generateEntryHash } from '../lib/hashing';
import { useSignMessage } from 'wagmi';
import { HashtagInput } from './HashtagInput';
import { Link } from 'react-router-dom';
import { checkPremiumStatus } from '../lib/premium';

// Note: Operations fee and NFT minting now happen when admin verifies the entry

export const CreateEntryForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const { user } = useAuth();
    const { signMessageAsync } = useSignMessage();

    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [customImageUrl, setCustomImageUrl] = useState('');
    const [customImageFile, setCustomImageFile] = useState<File | null>(null);
    const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'signing' | 'saving'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const customImageInputRef = useRef<HTMLInputElement>(null);

    // States for metadata
    const [metadata, setMetadata] = useState<{
        title?: string;
        image?: string;
        siteName?: string;
    }>({});

    // Check premium status
    useEffect(() => {
        const fetchPremiumStatus = async () => {
            if (!user) {
                setIsPremium(false);
                return;
            }

            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('is_premium, subscription_active, subscription_end')
                    .eq('wallet_address', user.walletAddress.toLowerCase())
                    .maybeSingle();

                const premiumStatus = checkPremiumStatus(userData, user.walletAddress);
                setIsPremium(premiumStatus);
            } catch (err) {
                console.error('Error checking premium status:', err);
                setIsPremium(false);
            }
        };

        fetchPremiumStatus();
    }, [user]);

    // Debounced metadata fetch when URL changes
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!url || !url.startsWith('http')) {
                setMetadata({});
                return;
            }

            setIsFetching(true);
            try {
                // Using Microlink's free API for metadata fetching
                const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                const data = await response.json();

                if (data.status === 'success') {
                    setMetadata({
                        title: data.data.title,
                        image: data.data.image?.url,
                        siteName: data.data.publisher
                    });
                }
            } catch (err) {
                console.error('Metadata fetch error:', err);
            } finally {
                setIsFetching(false);
            }
        };

        const timeoutId = setTimeout(fetchMetadata, 1000);
        return () => clearTimeout(timeoutId);
    }, [url]);

    const handleCustomImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            if (customImageInputRef.current) customImageInputRef.current.value = '';
            return;
        }

        setCustomImageFile(file);
        setCustomImageUrl(''); // Clear URL when file is selected

        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadCustomImage = async (file: File): Promise<string> => {
        if (!user) throw new Error('User not authenticated');

        const walletAddress = user.walletAddress.toLowerCase().replace('0x', '');
        const imagePath = `${walletAddress}/hero-${Date.now()}.${file.name.split('.').pop()}`;

        const { data, error } = await supabase.storage
            .from('profile-images')
            .upload(imagePath, file, {
                cacheControl: '3600',
                upsert: true,
                onUploadProgress: (event) => {
                    if (event.totalBytes > 0) {
                        const progress = Math.round((event.loaded / event.totalBytes) * 100);
                        setUploadProgress(progress);
                    }
                }
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const platform = detectPlatform(url);
            const timestamp = new Date().toISOString();
            const payloadHash = await generateEntryHash(user.walletAddress, url, timestamp);

            // 1. Proof of Ownership (Signature)
            setStatus('signing');
            const message = `Creator Ledger Verification\n\nI, ${user.walletAddress}, affirm ownership/creation of the content at:\n${url}\n\nTimestamp: ${timestamp}\nHash: ${payloadHash}`;
            const signature = await signMessageAsync({ message });

            // 2. Upload custom hero image if file is selected (premium only)
            let finalCustomImageUrl = customImageUrl;
            if (customImageFile && isPremium) {
                setIsUploading(true);
                setUploadProgress(0);
                finalCustomImageUrl = await uploadCustomImage(customImageFile);
                setUploadProgress(100);
                setIsUploading(false);
            }

            // 3. Save to Supabase (including stats) - Status will be 'Unverified' until admin approves
            // NFT will be minted/updated when admin verifies the entry
            setStatus('saving');

            // Generate some random realistic stats for demo if not provided by Microlink
            // In a production app, this would be fetched from social APIs
            const mockStats = {
                views: Math.floor(Math.random() * 50000) + 1000,
                likes: Math.floor(Math.random() * 5000) + 100,
                shares: Math.floor(Math.random() * 500) + 10
            };

            const { error: insertError } = await supabase
                .from('ledger_entries')
                .insert([
                    {
                        wallet_address: user.walletAddress.toLowerCase(),
                        url,
                        platform,
                        description,
                        campaign_tag: hashtags.map(tag => tag.replace(/^#/, '')).join(', '),
                        timestamp,
                        payload_hash: payloadHash,
                        verification_status: 'Unverified', // Requires admin verification
                        title: metadata.title || null,
                        image_url: metadata.image || null,
                        custom_image_url: finalCustomImageUrl || null,
                        site_name: metadata.siteName || null,
                        signature: signature,
                        stats: mockStats
                    }
                ]);

            if (insertError) throw insertError;

            setUrl('');
            setDescription('');
            setHashtags([]);
            setCustomImageUrl('');
            setCustomImageFile(null);
            setCustomImagePreview(null);
            if (customImageInputRef.current) customImageInputRef.current.value = '';
            setMetadata({});
            setStatus('idle');
            
            // Show success message
            alert('Entry submitted successfully! It is now pending admin verification and will appear publicly once verified.');
            
            onSuccess();
        } catch (err: any) {
            console.error('Error submitting entry:', err);
            if (err.message?.includes('User rejected')) {
                setError('Wallet action required to proceed.');
            } else {
                setError(err.message || 'Failed to submit entry');
            }
        } finally {
            setIsSubmitting(false);
            setStatus('idle');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold">New Ledger Entry</h3>
            </div>

            <div className="space-y-5">
                <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Content URL *
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste your post link here..."
                                className="w-full px-4 py-3 rounded-xl glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            />
                            {isFetching && (
                                <div className="absolute right-3 top-3 animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            )}
                        </div>
                    </div>

                    {/* Preview Thumb (Only shown if metadata found) */}
                    {metadata.image && (
                        <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden glass-card border border-primary/20 bg-muted shrink-0 shadow-lg">
                            <img src={metadata.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {metadata.title && (
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase mb-1">Previewing</p>
                        <p className="text-sm font-semibold line-clamp-1">{metadata.title}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a private note..."
                            className="w-full px-4 py-3 rounded-xl glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Hashtags
                        </label>
                        <HashtagInput
                            value={hashtags}
                            onChange={setHashtags}
                            placeholder="Type tags and press comma..."
                            className="glass-card"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd>, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">,</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add a tag.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Custom Hero {isPremium ? 'Image' : 'URL'}
                            {!isPremium && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                    URL Only
                                </span>
                            )}
                        </label>
                        {isPremium ? (
                            <>
                                <input
                                    ref={customImageInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                    onChange={handleCustomImageFileChange}
                                    className="w-full px-4 py-3 rounded-xl glass-card text-foreground text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                {customImagePreview && (
                                    <div className="mt-2 aspect-[1.91/1] w-full rounded-xl overflow-hidden border-2 border-border bg-background">
                                        <img src={customImagePreview} alt="Hero Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {isUploading && uploadProgress > 0 && (
                                    <div className="mt-2 w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">(Optional: 1200x630px, 1.91:1 ratio, JPG/PNG, max 5MB)</p>
                            </>
                        ) : (
                            <>
                                <input
                                    type="url"
                                    value={customImageUrl}
                                    onChange={(e) => {
                                        setCustomImageUrl(e.target.value);
                                        if (e.target.value) {
                                            setCustomImagePreview(e.target.value);
                                        }
                                    }}
                                    placeholder="https://your-hero-image.com/image.jpg"
                                    className="w-full px-4 py-3 rounded-xl glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">(Optional: Link to hero image URL)</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Policy & Fee Notice */}
                <div className="space-y-3">
                    <div className="p-4 rounded-xl glass-card border-2 border-border bg-muted/20">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-bold mb-1">Content Policy & Verification</p>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                    By submitting, you agree that your content complies with our{' '}
                                    <Link to="/terms" className="text-primary hover:underline font-semibold">
                                        Terms of Service & Content Policy
                                    </Link>
                                    . All submissions are reviewed by administrators before appearing publicly.
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <strong className="text-primary">Note:</strong> Your entry will be reviewed by administrators. Once verified, your Creator's Passport NFT will be minted or updated automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl glass-card border-2 border-destructive/30 bg-destructive/5">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-destructive">{error}</p>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="btn-primary w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                >
                    {(isSubmitting || isUploading) ? (
                        <>
                            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isUploading && 'Uploading Image...'}
                            {status === 'signing' && !isUploading && 'Signing Proof...'}
                            {status === 'saving' && !isUploading && 'Submitting for Review...'}
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Add to My Library
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
