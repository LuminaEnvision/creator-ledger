import React, { useState, useEffect, useMemo } from 'react';
import type { LedgerEntry } from '../types';

interface PortfolioCollection {
    id: string;
    name: string;
    entryIds: string[];
    createdAt: string;
}

interface PortfolioCollectionsProps {
    entries: LedgerEntry[];
    walletAddress: string;
}

export const PortfolioCollections: React.FC<PortfolioCollectionsProps> = ({
    entries,
    walletAddress
}) => {
    const [collections, setCollections] = useState<PortfolioCollection[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<PortfolioCollection | null>(null);
    const [collectionName, setCollectionName] = useState('');
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchCollections();
    }, [walletAddress]);

    // Debug: Log entries when they change
    useEffect(() => {
        console.log('PortfolioCollections: Entries updated', {
            totalEntries: entries.length,
            entryIds: entries.map(e => ({ id: e.id, title: e.title || e.url }))
        });
    }, [entries]);

    // Refetch collections when entries change to ensure entry IDs are valid
    // (rerender-memo: Extract expensive work into memoized values)
    // (js-set-map-lookups: Use Set/Map for O(1) lookups)
    const cleanedCollections = useMemo(() => {
        if (collections.length === 0 || entries.length === 0) {
            return collections;
        }
        
        // Build Set for O(1) lookups instead of O(n) array.some()
        const entryIdSet = new Set(entries.map(e => e.id));
        
        // Validate and clean up collections with invalid entry IDs
        return collections.map(collection => {
            const validEntryIds = collection.entryIds.filter(id => entryIdSet.has(id));
            
            if (validEntryIds.length !== collection.entryIds.length) {
                console.log(`Collection "${collection.name}" had ${collection.entryIds.length - validEntryIds.length} invalid entry IDs, cleaning up...`);
                return {
                    ...collection,
                    entryIds: validEntryIds
                };
            }
            return collection;
        }).filter(collection => collection.entryIds.length > 0); // Remove empty collections
    }, [collections, entries]);

    useEffect(() => {
        if (cleanedCollections.length !== collections.length || 
            collections.some((col, idx) => col.entryIds.length !== cleanedCollections[idx]?.entryIds.length)) {
            const normalizedAddress = walletAddress?.toLowerCase() || '';
            if (normalizedAddress) {
                localStorage.setItem(`collections_${normalizedAddress}`, JSON.stringify(cleanedCollections));
                setCollections(cleanedCollections);
            }
        }
    }, [cleanedCollections, collections, walletAddress]);

    const fetchCollections = async () => {
        try {
            // Normalize wallet address to lowercase for consistent storage
            const normalizedAddress = walletAddress?.toLowerCase() || '';
            if (!normalizedAddress) return;
            
            // Store collections in localStorage for now (can be moved to Supabase later)
            const stored = localStorage.getItem(`collections_${normalizedAddress}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                console.log('Loaded collections:', parsed);
                setCollections(parsed);
            } else {
                console.log('No collections found in localStorage for:', normalizedAddress);
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
        }
    };

    const saveCollections = (newCollections: PortfolioCollection[]) => {
        try {
            // Normalize wallet address to lowercase for consistent storage
            const normalizedAddress = walletAddress?.toLowerCase() || '';
            if (!normalizedAddress) {
                console.error('Cannot save collections: wallet address is missing');
                return;
            }
            
            const key = `collections_${normalizedAddress}`;
            localStorage.setItem(key, JSON.stringify(newCollections));
            console.log('Saved collections:', newCollections, 'to key:', key);
            setCollections(newCollections);
            
            // Dispatch custom event to notify parent components
            window.dispatchEvent(new Event('collectionsUpdated'));
        } catch (error) {
            console.error('Error saving collections:', error);
            alert('Failed to save collection. Please try again.');
        }
    };

    const handleCreateCollection = () => {
        setCollectionName('');
        setSelectedEntryIds(new Set());
        setEditingCollection(null);
        setIsModalOpen(true);
    };

    const handleEditCollection = (collection: PortfolioCollection) => {
        setCollectionName(collection.name);
        setSelectedEntryIds(new Set(collection.entryIds));
        setEditingCollection(collection);
        setIsModalOpen(true);
    };

    const handleSaveCollection = () => {
        if (!collectionName.trim()) {
            alert('Please enter a collection name');
            return;
        }

        const newCollection: PortfolioCollection = {
            id: editingCollection?.id || `collection_${Date.now()}`,
            name: collectionName.trim(),
            entryIds: Array.from(selectedEntryIds),
            createdAt: editingCollection?.createdAt || new Date().toISOString()
        };

        if (editingCollection) {
            const updated = collections.map(c => c.id === editingCollection.id ? newCollection : c);
            saveCollections(updated);
        } else {
            saveCollections([...collections, newCollection]);
        }

        setIsModalOpen(false);
        setCollectionName('');
        setSelectedEntryIds(new Set());
        setEditingCollection(null);
    };

    const handleDeleteCollection = (id: string) => {
        if (confirm('Are you sure you want to delete this collection?')) {
            saveCollections(collections.filter(c => c.id !== id));
        }
    };

    const generateShareLink = (collection: PortfolioCollection) => {
        const baseUrl = `${window.location.origin}/u/${walletAddress}`;
        const filterParam = collection.entryIds.join(',');
        return `${baseUrl}?filter=${filterParam}`;
    };

    const copyShareLink = (collection: PortfolioCollection) => {
        const link = generateShareLink(collection);
        navigator.clipboard.writeText(link);
        alert('Shareable link copied to clipboard!');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-1">Portfolio Collections</h4>
                    <p className="text-xs text-muted-foreground">Create filtered views to share with different audiences</p>
                </div>
                <button
                    onClick={handleCreateCollection}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-all"
                >
                    + New Collection
                </button>
            </div>

            {collections.length === 0 ? (
                <div className="p-6 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No collections yet</p>
                    <p className="text-xs text-muted-foreground">Create a collection to share filtered portfolios with different audiences</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {collections.map((collection) => {
                        // Filter entries and validate that entry IDs still exist
                        const filteredEntries = entries.filter(e => collection.entryIds.includes(e.id));
                        const missingEntries = collection.entryIds.filter(id => !entries.some(e => e.id === id));
                        
                        // Debug logging
                        console.log('Collection:', collection.name, {
                            collectionEntryIds: collection.entryIds,
                            totalEntries: entries.length,
                            filteredCount: filteredEntries.length,
                            missingCount: missingEntries.length,
                            entryIds: entries.map(e => e.id)
                        });
                        
                        // If some entries are missing, update the collection to remove invalid IDs
                        if (missingEntries.length > 0 && filteredEntries.length > 0) {
                            console.warn('Some entry IDs in collection are missing:', missingEntries);
                            // Optionally auto-fix: remove invalid entry IDs
                            const updatedCollection = {
                                ...collection,
                                entryIds: collection.entryIds.filter(id => entries.some(e => e.id === id))
                            };
                            const updatedCollections = collections.map(c => 
                                c.id === collection.id ? updatedCollection : c
                            );
                            saveCollections(updatedCollections);
                        }
                        
                        const shareLink = generateShareLink(collection);
                        
                        return (
                            <div key={collection.id} className="p-4 rounded-xl glass-card border border-border/50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h5 className="font-bold text-sm mb-1">{collection.name}</h5>
                                        <p className="text-xs text-muted-foreground">
                                            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.open(shareLink, '_blank')}
                                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white text-xs font-bold transition-all"
                                            title="View collection"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => copyShareLink(collection)}
                                            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                                            title="Copy shareable link"
                                        >
                                            Copy Link
                                        </button>
                                        <button
                                            onClick={() => handleEditCollection(collection)}
                                            className="px-3 py-1.5 rounded-lg glass-card hover:bg-accent/20 text-xs font-bold transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCollection(collection.id)}
                                            className="px-3 py-1.5 rounded-lg glass-card hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span className="font-mono text-[10px] truncate max-w-xs">
                                        {generateShareLink(collection)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Collection Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">
                                {editingCollection ? 'Edit Collection' : 'Create Collection'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-accent/20 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Collection Name</label>
                                <input
                                    type="text"
                                    value={collectionName}
                                    onChange={(e) => setCollectionName(e.target.value)}
                                    placeholder="e.g., For Funders, For Employers, Tech Portfolio"
                                    className="w-full px-4 py-2 rounded-xl glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Select Entries ({selectedEntryIds.size} selected)
                                </label>
                                <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-xl border border-border bg-muted/20">
                                    {entries.filter(e => e.verification_status === 'Verified').map((entry) => (
                                        <label
                                            key={entry.id}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 cursor-pointer border border-transparent hover:border-primary/20 transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEntryIds.has(entry.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedEntryIds);
                                                    if (e.target.checked) {
                                                        newSet.add(entry.id);
                                                    } else {
                                                        newSet.delete(entry.id);
                                                    }
                                                    setSelectedEntryIds(newSet);
                                                }}
                                                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{entry.title || entry.url}</p>
                                                <p className="text-xs text-muted-foreground">{entry.platform}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {entries.filter(e => e.verification_status === 'Verified').length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                        No verified entries available. Verify entries first to add them to collections.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-border">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg glass-card hover:bg-accent/20 text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCollection}
                                    disabled={!collectionName.trim() || selectedEntryIds.size === 0}
                                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingCollection ? 'Update' : 'Create'} Collection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

