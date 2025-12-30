import React from 'react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service & Content Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-2xl space-y-8">
                {/* Content Policy */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Content Policy</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-primary">✅ Allowed Content</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Original creative works (videos, posts, articles, artwork)</li>
                                <li>Content you own or have rights to publish</li>
                                <li>Content from platforms: X (Twitter), TikTok, Instagram, YouTube, and other legitimate platforms</li>
                                <li>Educational, informative, or entertainment content</li>
                                <li>Content that complies with platform terms of service</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-destructive">❌ Prohibited Content</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Illegal content or content promoting illegal activities</li>
                                <li>Hate speech, harassment, or discriminatory content</li>
                                <li>Copyrighted material you don't own or have permission to use</li>
                                <li>Spam, scams, or fraudulent content</li>
                                <li>Explicit adult content (NSFW)</li>
                                <li>Violence, gore, or graphic content</li>
                                <li>Content that violates platform terms of service</li>
                                <li>Misinformation or disinformation</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Verification Criteria */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Verification Criteria</h2>
                    <div className="space-y-3 text-muted-foreground">
                        <p>Content will be verified by administrators based on:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Compliance with Content Policy above</li>
                            <li>Authenticity of the content URL</li>
                            <li>Ownership verification (wallet signature)</li>
                            <li>Content is accessible and not removed/deleted</li>
                            <li>Content matches the description provided</li>
                        </ul>
                        <p className="mt-4 font-semibold text-foreground">
                            Unverified content will not appear in public profiles until approved by an administrator.
                        </p>
                    </div>
                </section>

                {/* Data Storage & Privacy */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Data Storage & Privacy</h2>
                    <div className="space-y-4 text-muted-foreground">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">Where Your Data is Stored</h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Database:</strong> Supabase (PostgreSQL) - hosted on secure cloud infrastructure</li>
                                <li><strong>Blockchain:</strong> Base network - NFT metadata and entry counts stored on-chain</li>
                                <li><strong>Content URLs:</strong> Only links are stored, not the actual content files</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">Who Can See Your Data</h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Public Profile:</strong> Verified entries are visible to anyone who visits your profile URL</li>
                                <li><strong>Your Dashboard:</strong> Only you can see all your entries (including unverified ones)</li>
                                <li><strong>Administrators:</strong> Can see all entries for content moderation purposes</li>
                                <li><strong>Blockchain:</strong> NFT data is publicly visible on Base network</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">Data Retention</h3>
                            <p>All ledger entries are permanently stored and cannot be deleted to maintain the integrity of your content history. This ensures:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                                <li>Immutable record of your creative work</li>
                                <li>Verifiable history for sponsors and brands</li>
                                <li>On-chain proof of ownership</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Content Download */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Content Download & Export</h2>
                    <div className="space-y-3 text-muted-foreground">
                        <p><strong className="text-foreground">Users cannot download content files</strong> from Creator Ledger. We only store:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>URLs (links) to your content</li>
                            <li>Metadata (title, description, platform)</li>
                            <li>Timestamps and verification status</li>
                            <li>On-chain signatures for proof of ownership</li>
                        </ul>
                        <p className="mt-4">
                            <strong className="text-foreground">You can export your ledger</strong> as CSV or PDF for reporting purposes, but this only contains metadata, not the actual content files.
                        </p>
                    </div>
                </section>

                {/* User Responsibilities */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
                    <div className="space-y-3 text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>You are responsible for ensuring you have rights to submit the content</li>
                            <li>You must comply with all applicable laws and platform terms</li>
                            <li>You must provide accurate information about your content</li>
                            <li>You are responsible for maintaining access to your wallet</li>
                            <li>You understand that verified entries become publicly visible</li>
                        </ul>
                    </div>
                </section>

                {/* Platform Rights */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Platform Rights</h2>
                    <div className="space-y-3 text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>We reserve the right to reject or remove content that violates our Content Policy</li>
                            <li>We reserve the right to deny verification for any reason</li>
                            <li>We may suspend accounts that repeatedly violate policies</li>
                            <li>Administrators review all content before verification</li>
                            <li>We are not responsible for content hosted on external platforms</li>
                        </ul>
                    </div>
                </section>

                {/* Fees */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Fees & Payments</h2>
                    <div className="space-y-3 text-muted-foreground">
                        <p><strong className="text-foreground">Free Users:</strong> Pay 0.00025 ETH per entry submission to cover on-chain verification costs (plus network gas fees). This fee goes to operations address: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">0x7eB8F203167dF3bC14D59536E671528dd97FB72a</code></p>
                        <p><strong className="text-foreground">Pro Users:</strong> Monthly subscription of 15 USDC. No submission fees. Subscription automatically renews each month. You can cancel or renew at any time from the Pricing page.</p>
                        <p className="text-xs italic">Subscriptions are managed through Base Pay. Payment is required monthly to maintain Pro status.</p>
                    </div>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Questions & Support</h2>
                    <p className="text-muted-foreground">
                        If you have questions about these terms or need to report content violations, please contact the administrators through the platform.
                    </p>
                </section>

                {/* Agreement */}
                <section className="border-t border-border pt-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                            By using Creator Ledger, you agree to these Terms of Service and Content Policy. 
                            Failure to comply may result in content rejection, account suspension, or removal of entries.
                        </p>
                    </div>
                </section>

                <div className="flex justify-center pt-6">
                    <Link
                        to="/"
                        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

