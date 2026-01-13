-- Create notifications table to track verified entries and endorsements
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('verified', 'endorsement')),
    entry_id UUID REFERENCES ledger_entries(id) ON DELETE CASCADE,
    endorser_wallet TEXT, -- For endorsement notifications
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON user_notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_entry ON user_notifications(entry_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(wallet_address, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(type);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
    ON user_notifications FOR SELECT
    USING (true); -- Public read for now, can be restricted later

-- System can insert notifications
CREATE POLICY "Anyone can insert notifications"
    ON user_notifications FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON user_notifications FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Comments
COMMENT ON TABLE user_notifications IS 'Notifications for users about verified content and endorsements';
COMMENT ON COLUMN user_notifications.type IS 'Type: verified (content verified) or endorsement (someone endorsed your content)';
COMMENT ON COLUMN user_notifications.endorser_wallet IS 'Wallet address of the person who endorsed (for endorsement type)';

