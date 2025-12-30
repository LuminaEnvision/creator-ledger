import React, { useState, useEffect } from 'react';
import type { LedgerEntry } from '../types';

export interface VisibilitySettings {
    isPublic: boolean;
    hiddenTags: string[];
    hiddenPosts: string[];
    dateRange: {
        start: string | null;
        end: string | null;
    } | null;
    hiddenPlatforms: string[];
    minVerificationStatus?: 'Unverified' | 'Verified';
}

interface VisibilitySettingsProps {
    entry: LedgerEntry;
    allEntries: LedgerEntry[];
    settings: VisibilitySettings;
    onChange: (settings: VisibilitySettings) => void;
}

export const VisibilitySettingsComponent: React.FC<VisibilitySettingsProps> = ({
    entry: _entry,
    allEntries,
    settings,
    onChange
}) => {
    const [localSettings, setLocalSettings] = useState<VisibilitySettings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const updateSettings = (updates: Partial<VisibilitySettings>) => {
        const newSettings = { ...localSettings, ...updates };
        setLocalSettings(newSettings);
        onChange(newSettings);
    };

    // Get unique tags from all entries
    const allTags = Array.from(
        new Set(
            allEntries
                .flatMap(e => (e.campaign_tag || '').split(',').map(t => t.trim()).filter(Boolean))
        )
    ).sort();

    // Get unique platforms
    const allPlatforms = Array.from(new Set(allEntries.map(e => e.platform))).sort();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold mb-4">Visibility Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Control which entries are visible when sharing your profile. Hidden entries won't appear in shared views.
                </p>
            </div>

            {/* Public/Private Toggle */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="font-semibold block">Make Entry Public</span>
                        <span className="text-sm text-muted-foreground">
                            When public, this entry appears in your public profile
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateSettings({ isPublic: !localSettings.isPublic })}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                            localSettings.isPublic ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                        <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                                localSettings.isPublic ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </label>
            </div>

            {/* Hide by Tags */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="font-semibold block mb-3">Hide Entries with These Tags</label>
                <p className="text-sm text-muted-foreground mb-3">
                    Select tags to hide. Entries with these tags won't appear in shared views.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allTags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tags available</p>
                    ) : (
                        allTags.map(tag => (
                            <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={localSettings.hiddenTags.includes(tag)}
                                    onChange={(e) => {
                                        const newTags = e.target.checked
                                            ? [...localSettings.hiddenTags, tag]
                                            : localSettings.hiddenTags.filter(t => t !== tag);
                                        updateSettings({ hiddenTags: newTags });
                                    }}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm">#{tag}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Hide by Posts */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="font-semibold block mb-3">Hide Specific Posts</label>
                <p className="text-sm text-muted-foreground mb-3">
                    Select individual posts to hide from shared views.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allEntries.slice(0, 20).map(entry => (
                        <label key={entry.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={localSettings.hiddenPosts.includes(entry.id)}
                                onChange={(event) => {
                                    const newPosts = event.target.checked
                                        ? [...localSettings.hiddenPosts, entry.id]
                                        : localSettings.hiddenPosts.filter(id => id !== entry.id);
                                    updateSettings({ hiddenPosts: newPosts });
                                }}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm truncate flex-1">
                                {entry.title || entry.url.substring(0, 50)}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Hide by Platform */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="font-semibold block mb-3">Hide Entries by Platform</label>
                <div className="space-y-2">
                    {allPlatforms.map(platform => (
                        <label key={platform} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={localSettings.hiddenPlatforms?.includes(platform) || false}
                                onChange={(e) => {
                                    const current = localSettings.hiddenPlatforms || [];
                                    const newPlatforms = e.target.checked
                                        ? [...current, platform]
                                        : current.filter(p => p !== platform);
                                    updateSettings({ hiddenPlatforms: newPlatforms });
                                }}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{platform}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="font-semibold block mb-3">Hide Entries by Date Range</label>
                <p className="text-sm text-muted-foreground mb-3">
                    Hide entries within a specific date range.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
                        <input
                            type="date"
                            value={localSettings.dateRange?.start || ''}
                            onChange={(e) => updateSettings({
                                dateRange: {
                                    ...localSettings.dateRange,
                                    start: e.target.value || null,
                                    end: localSettings.dateRange?.end || null
                                }
                            })}
                            className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                        <input
                            type="date"
                            value={localSettings.dateRange?.end || ''}
                            onChange={(e) => updateSettings({
                                dateRange: {
                                    ...localSettings.dateRange,
                                    start: localSettings.dateRange?.start || null,
                                    end: e.target.value || null
                                }
                            })}
                            className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                        />
                    </div>
                </div>
                {localSettings.dateRange?.start || localSettings.dateRange?.end ? (
                    <button
                        type="button"
                        onClick={() => updateSettings({ dateRange: null })}
                        className="mt-2 text-xs text-primary hover:underline"
                    >
                        Clear date range
                    </button>
                ) : null}
            </div>

            {/* Verification Status Filter */}
            <div className="p-4 rounded-lg border-2 border-border bg-background">
                <label className="font-semibold block mb-3">Minimum Verification Status</label>
                <select
                    value={localSettings.minVerificationStatus || 'all'}
                    onChange={(e) => updateSettings({
                        minVerificationStatus: e.target.value === 'all' ? undefined : e.target.value as 'Unverified' | 'Verified'
                    })}
                    className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                >
                    <option value="all">Show All</option>
                    <option value="Unverified">Unverified or Higher</option>
                    <option value="Verified">Verified Only</option>
                </select>
            </div>
        </div>
    );
};

