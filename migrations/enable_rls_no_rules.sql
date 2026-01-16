-- Enable RLS on all tables but remove all rules
-- This closes the database to direct access from the frontend
-- Only service role key can access the database
-- All access must go through Edge Functions

-- Enable RLS on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entry_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio_collections ENABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies
-- This ensures no direct access from frontend
-- Query pg_policies to find all existing policies and drop them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all policies on the target tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename IN ('users', 'ledger_entries', 'profiles', 'entry_endorsements', 'user_notifications', 'portfolio_collections')
    LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Verify RLS is enabled (should return 'on' for all tables)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'ledger_entries', 'profiles', 'entry_endorsements', 'user_notifications', 'portfolio_collections')
ORDER BY tablename;

-- Note: After running this migration:
-- 1. Only Edge Functions (using service role key) can access the database
-- 2. Frontend must call Edge Functions instead of direct Supabase queries
-- 3. Edge Functions authenticate users using Supabase Auth tokens
-- 4. All database operations are now controlled by your backend logic

