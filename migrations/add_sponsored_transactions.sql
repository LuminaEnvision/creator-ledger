-- Migration: Add sponsored transactions tracking
-- Tracks how many sponsored transactions each user has used (first 3 are free)

-- Add column to track sponsored transaction count
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sponsored_transactions_count INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_sponsored_count ON users(sponsored_transactions_count);

-- Comments
COMMENT ON COLUMN users.sponsored_transactions_count IS 'Number of sponsored (gasless) transactions used by this user. First 3 entries and NFT upgrades are sponsored.';

