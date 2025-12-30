import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; onUpdate: () => void }> = ({ isOpen, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user || !isOpen) return;
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
            }
        };
        fetchProfile();
    }, [user, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    wallet_address: user.walletAddress.toLowerCase(),
                    display_name: displayName,
                    bio: bio,
                    avatar_url: avatarUrl,
                    banner_url: bannerUrl,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Brand profile updated successfully!' });
            onUpdate();
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save profile' });
        } finally {
            setIsSaving(false);
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop - increased opacity for better clarity */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content - centered like Create Collection modal */}
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Level Up Your Brand</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="e.g. Alex Sterling"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Passport Photo URL
                                    <span className="ml-2 text-[9px] font-normal text-slate-400">(Recommended: 400x400px, Square, JPG/PNG)</span>
                                </label>
                                <input
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://your-photo.com/img.jpg"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                Media Kit Banner URL
                                <span className="ml-2 text-[9px] font-normal text-slate-400">(Required: 1920x1080px, 16:9 ratio, JPG/PNG, max 5MB)</span>
                            </label>
                            <input
                                type="url"
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                                placeholder="https://your-banner.com/banner.jpg"
                                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            />
                            {bannerUrl && (
                                <div className="mt-3 aspect-[2/1] w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                                    <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Professional Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="What do you want brands to know about you? (160 characters max)"
                                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all h-24 resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success'
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
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

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
        </div>
    );
};
