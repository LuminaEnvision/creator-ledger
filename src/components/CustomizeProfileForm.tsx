import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { checkPremiumStatus } from '../lib/premium';

export const CustomizeProfileForm: React.FC<{ onUpdate: () => void; onClose: () => void }> = ({ onUpdate, onClose }) => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [bannerPreview, setBannerPreview] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ avatar: 0, banner: 0 });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            
            // Fetch profile data
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('wallet_address', user.walletAddress.toLowerCase())
                .maybeSingle();

            if (data) {
                setDisplayName(data.display_name || '');
                setBio(data.bio || '');
                setAvatarUrl(data.avatar_url || '');
                setBannerUrl(data.banner_url || '');
                if (data.avatar_url) setAvatarPreview(data.avatar_url);
                if (data.banner_url) setBannerPreview(data.banner_url);
            }

            // Check premium status
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
        fetchProfile();
    }, [user]);

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 5MB' });
                return;
            }
            setAvatarFile(file);
            setAvatarUrl(''); // Clear URL when file is selected
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 5MB' });
                return;
            }
            setBannerFile(file);
            setBannerUrl(''); // Clear URL when file is selected
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async (file: File, path: string, type: 'avatar' | 'banner'): Promise<string | null> => {
        try {
            const { data, error } = await supabase.storage
                .from('profile-images')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('profile-images')
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (err: any) {
            console.error(`Error uploading ${type}:`, err);
            throw err;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setIsUploading(false);
        setMessage(null);

        try {
            let finalAvatarUrl: string | null = avatarUrl || null;
            let finalBannerUrl: string | null = bannerUrl || null;

            // Upload avatar file if selected (premium only)
            if (avatarFile && isPremium) {
                setIsUploading(true);
                setUploadProgress(prev => ({ ...prev, avatar: 50 }));
                const walletAddress = user.walletAddress.toLowerCase().replace('0x', '');
                const avatarPath = `${walletAddress}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
                const uploadedUrl = await uploadFile(avatarFile, avatarPath, 'avatar');
                finalAvatarUrl = uploadedUrl || finalAvatarUrl;
                setUploadProgress(prev => ({ ...prev, avatar: 100 }));
            } else if (avatarFile && !isPremium) {
                throw new Error('Photo uploads are only available for Pro users. Please upgrade to Pro.');
            }

            // Upload banner file if selected (premium only)
            if (bannerFile && isPremium) {
                setIsUploading(true);
                setUploadProgress(prev => ({ ...prev, banner: 50 }));
                const walletAddress = user.walletAddress.toLowerCase().replace('0x', '');
                const bannerPath = `${walletAddress}/banner-${Date.now()}.${bannerFile.name.split('.').pop()}`;
                const uploadedUrl = await uploadFile(bannerFile, bannerPath, 'banner');
                finalBannerUrl = uploadedUrl || finalBannerUrl;
                setUploadProgress(prev => ({ ...prev, banner: 100 }));
            } else if (bannerFile && !isPremium) {
                throw new Error('Photo uploads are only available for Pro users. Please upgrade to Pro.');
            }

            setIsUploading(false);

            // Save profile data
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    wallet_address: user.walletAddress.toLowerCase(),
                    display_name: displayName,
                    bio: bio,
                    avatar_url: finalAvatarUrl || null,
                    banner_url: finalBannerUrl || null,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            
            // Clear file states
            setAvatarFile(null);
            setBannerFile(null);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
            if (bannerInputRef.current) bannerInputRef.current.value = '';
            
            setMessage({ type: 'success', text: 'Brand profile updated successfully!' });
            onUpdate();
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to save profile' });
        } finally {
            setIsSaving(false);
            setIsUploading(false);
            setUploadProgress({ avatar: 0, banner: 0 });
        }
    };

    return (
        <div className="mt-4 glass-card rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-foreground tracking-tight">Level Up Your Brand</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-accent/20 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Display Name</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Alex Sterling"
                            className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                            Passport Photo
                            {isPremium ? (
                                <span className="ml-2 text-[9px] font-normal text-muted-foreground">(Upload: 400x400px, Square, JPG/PNG, max 5MB)</span>
                            ) : (
                                <>
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                                        URL Only
                                    </span>
                                    <span className="ml-2 text-[9px] font-normal text-muted-foreground">(Link to image URL)</span>
                                </>
                            )}
                        </label>
                        {isPremium ? (
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={handleAvatarFileChange}
                                className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            />
                        ) : (
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => {
                                    setAvatarUrl(e.target.value);
                                    if (e.target.value) {
                                        setAvatarPreview(e.target.value);
                                    }
                                }}
                                placeholder="https://your-photo.com/img.jpg"
                                className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            />
                        )}
                        {avatarPreview && (
                            <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden border-2 border-border bg-background">
                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {isUploading && uploadProgress.avatar > 0 && (
                            <div className="mt-2 w-full bg-secondary rounded-full h-2">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress.avatar}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Media Kit Banner
                        {isPremium ? (
                            <span className="ml-2 text-[9px] font-normal text-muted-foreground">(Upload: 1920x1080px, 16:9 ratio, JPG/PNG, max 5MB)</span>
                        ) : (
                            <>
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                                    URL Only
                                </span>
                                <span className="ml-2 text-[9px] font-normal text-muted-foreground">(Link to image URL)</span>
                            </>
                        )}
                    </label>
                    {isPremium ? (
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleBannerFileChange}
                            className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    ) : (
                        <input
                            type="url"
                            value={bannerUrl}
                            onChange={(e) => {
                                setBannerUrl(e.target.value);
                                if (e.target.value) {
                                    setBannerPreview(e.target.value);
                                }
                            }}
                            placeholder="https://your-banner.com/banner.jpg"
                            className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    )}
                    {bannerPreview && (
                        <div className="mt-3 aspect-[2/1] w-full rounded-2xl overflow-hidden border-2 border-border bg-background">
                            <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {isUploading && uploadProgress.banner > 0 && (
                        <div className="mt-2 w-full bg-secondary rounded-full h-2">
                            <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress.banner}%` }}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Professional Bio
                        <span className="ml-2 text-[9px] font-normal text-muted-foreground">(200 characters max - URLs allowed)</span>
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 200) {
                                setBio(value);
                            }
                        }}
                        placeholder="Tell brands about yourself, add your website, social links, etc. (e.g., https://mysite.com)"
                        maxLength={200}
                        className="w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all h-24 resize-none leading-relaxed"
                    />
                    <div className="mt-1 text-right text-[9px] text-muted-foreground">
                        {bio.length}/200 characters
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
                        }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {message.type === 'success'
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                }
                            </svg>
                        </div>
                        {message.text}
                    </div>
                )}

                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || isUploading}
                        className="flex-[2] bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {(isSaving || isUploading) ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>{isUploading ? 'Uploading...' : 'Saving...'}</span>
                            </>
                        ) : (
                            <>
                                <span>Launch Changes</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

