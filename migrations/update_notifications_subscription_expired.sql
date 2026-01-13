-- Migration: Update user_notifications table to support subscription_expired type
-- Run this if you already ran add_notifications.sql before the subscription_expired type was added

-- Drop the old constraint if it exists (PostgreSQL doesn't support direct ALTER of CHECK constraints)
DO $$ 
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_notifications_type_check'
    ) THEN
        ALTER TABLE user_notifications DROP CONSTRAINT user_notifications_type_check;
    END IF;
END $$;

-- Add the new constraint with subscription_expired type
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_type_check 
CHECK (type IN ('verified', 'endorsement', 'subscription_expired'));

-- Update the comment to reflect the new type
COMMENT ON COLUMN user_notifications.type IS 'Type: verified (content verified), endorsement (someone endorsed your content), or subscription_expired (subscription has expired)';

