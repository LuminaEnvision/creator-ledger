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

