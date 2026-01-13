-- Migration Script: Run after add_notifications.sql
-- This script updates the notifications table to support subscription_expired type
-- and grants premium access to the rewarded user

-- ============================================================================
-- PART 1: Update user_notifications table to support subscription_expired
-- ============================================================================

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

-- ============================================================================
-- PART 2: Grant 1 month Pro tier to rewarded user
-- ============================================================================

-- Grant 1 month Pro tier to user: 0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932
-- This script rewards the user with premium access for 1 month

-- Ensure user exists in users table
INSERT INTO public.users (wallet_address, is_premium, subscription_active, subscription_start, subscription_end, created_at)
VALUES (
    LOWER('0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932'),
    true,
    true,
    NOW(),
    NOW() + INTERVAL '1 month',
    COALESCE((SELECT created_at FROM public.users WHERE wallet_address = LOWER('0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932')), NOW())
)
ON CONFLICT (wallet_address) 
DO UPDATE SET
    is_premium = true,
    subscription_active = true,
    subscription_start = NOW(),
    subscription_end = NOW() + INTERVAL '1 month',
    -- Don't update created_at if user already exists
    created_at = public.users.created_at;

-- Verify the update
SELECT 
    wallet_address,
    is_premium,
    subscription_active,
    subscription_start,
    subscription_end,
    subscription_end - NOW() as days_remaining
FROM public.users
WHERE wallet_address = LOWER('0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932');

