import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { HashtagInput } from './HashtagInput';
import type { LedgerEntry } from '../types';

interface EditEntryModalProps {
    entry: LedgerEntry;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
    entry,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const [description, setDescription] = useState(entry.description || '');
    const [customImageUrl, setCustomImageUrl] = useState(entry.custom_image_url || '');
    const [hashtags, setHashtags] = useState<string[]>(() => {
        // Parse existing campaign_tag into array of hashtags
        if (!entry.campaign_tag) return [];
        return entry.campaign_tag
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setDescription(entry.description || '');
            setCustomImageUrl(entry.custom_image_url || '');
            setHashtags(() => {
                if (!entry.campaign_tag) return [];
                return entry.campaign_tag
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0)
                    .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
            });
            setError(null);
        }
    }, [isOpen, entry]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setError(null);

        try {
            // Convert hashtags array to comma-separated string (without # for storage)
            const campaignTag = hashtags
                .map(tag => tag.replace(/^#/, ''))
                .join(', ');

            const { error: updateError } = await supabase
                .from('ledger_entries')
                .update({
                    description: description || null,
                    custom_image_url: customImageUrl || null,
                    campaign_tag: campaignTag || null,
                })
                .eq('id', entry.id)
                .eq('wallet_address', user.walletAddress.toLowerCase());

            if (updateError) throw updateError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update entry');
            console.error('Update error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Edit Entry</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* URL (read-only) */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Content URL <span className="text-muted-foreground">(Immutable)</span>
                        </label>
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-muted-foreground">
                            {entry.url}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            The URL cannot be changed to maintain ledger integrity.
                        </p>
                    </div>

                    {/* Custom Image URL */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Custom Hero Image URL
                            <span className="text-muted-foreground text-xs font-normal ml-2">
                                (Optional: 1200x630px, 1.91:1 ratio, JPG/PNG)
                            </span>
                        </label>
                        <input
                            type="url"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                        />
                        {customImageUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-border">
                                <img
                                    src={customImageUrl}
                                    alt="Preview"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description for this entry..."
                            rows={4}
                            className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Hashtags */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Hashtags
                        </label>
                        <HashtagInput
                            value={hashtags}
                            onChange={setHashtags}
                            placeholder="Type tags and press comma..."
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd>, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">,</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add a tag.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border-2 border-border hover:bg-secondary transition-colors font-semibold"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

