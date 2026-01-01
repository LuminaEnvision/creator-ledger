-- Add content_hash column to prevent duplicate content claims
-- This creates a deterministic hash from the URL to detect if content was already claimed
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_ledger_entries_content_hash ON ledger_entries(content_hash);

-- Add unique constraint to prevent same content from being claimed multiple times
-- Note: This allows same content to be claimed by different wallets (which is valid)
-- but prevents the same wallet from claiming the same content twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_wallet_content_hash 
ON ledger_entries(wallet_address, content_hash);

-- Comment
COMMENT ON COLUMN ledger_entries.content_hash IS 'SHA-256 hash of normalized URL to prevent duplicate content claims';

