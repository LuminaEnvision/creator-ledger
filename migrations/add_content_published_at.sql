-- Add content_published_at column to store the actual publication date of the content
-- This is different from timestamp which is when the entry was submitted to Creator Ledger

ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS content_published_at TIMESTAMPTZ;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_content_published_at 
ON ledger_entries(content_published_at);

-- Add comment for clarity
COMMENT ON COLUMN ledger_entries.content_published_at IS 'The actual publication date of the content (fetched from metadata), distinct from timestamp which is when the entry was submitted';

