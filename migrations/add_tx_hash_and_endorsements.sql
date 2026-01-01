-- Add transaction hash column to ledger_entries
-- This stores the blockchain transaction hash when NFT is minted/updated
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Create endorsement table for viewer voting
CREATE TABLE IF NOT EXISTS entry_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
    endorser_wallet TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('endorse', 'dispute')),
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(entry_id, endorser_wallet)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_endorsements_entry ON entry_endorsements(entry_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_wallet ON entry_endorsements(endorser_wallet);
CREATE INDEX IF NOT EXISTS idx_endorsements_vote_type ON entry_endorsements(vote_type);

-- Enable RLS
ALTER TABLE entry_endorsements ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see endorsements)
CREATE POLICY "Public read access for endorsements"
    ON entry_endorsements FOR SELECT
    USING (true);

-- Anyone can insert endorsements (with wallet signature verification)
CREATE POLICY "Anyone can insert endorsements"
    ON entry_endorsements FOR INSERT
    WITH CHECK (true);

-- Users can update their own endorsements
CREATE POLICY "Users can update own endorsements"
    ON entry_endorsements FOR UPDATE
    USING (endorser_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address')
    WITH CHECK (endorser_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Comments
COMMENT ON COLUMN ledger_entries.tx_hash IS 'Blockchain transaction hash for on-chain verification';
COMMENT ON TABLE entry_endorsements IS 'Viewer endorsements and disputes for ledger entries';
COMMENT ON COLUMN entry_endorsements.vote_type IS 'Type of vote: endorse (like) or dispute (flag)';

