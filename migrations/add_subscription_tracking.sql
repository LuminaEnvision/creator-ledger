-- Migration: Add subscription tracking for monthly recurring payments
-- This allows tracking of subscription start/end dates and active status

-- Add subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_start timestamptz,
ADD COLUMN IF NOT EXISTS subscription_end timestamptz,
ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false;

-- Create index for efficient subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_end 
ON public.users(subscription_end) 
WHERE subscription_active = true;

-- Function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET 
        subscription_active = false,
        is_premium = false
    WHERE 
        subscription_active = true 
        AND subscription_end IS NOT NULL
        AND subscription_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- You can call this function periodically (e.g., via cron job or scheduled task)
-- Or check on each user login/access

