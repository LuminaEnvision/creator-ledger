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
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Enable all operations" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own data" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own data" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own data" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own data" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Public read access" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete" ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop all policies on specific tables
DROP POLICY IF EXISTS ALL ON users;
DROP POLICY IF EXISTS ALL ON ledger_entries;
DROP POLICY IF EXISTS ALL ON profiles;
DROP POLICY IF EXISTS ALL ON entry_endorsements;
DROP POLICY IF EXISTS ALL ON user_notifications;
DROP POLICY IF EXISTS ALL ON portfolio_collections;

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

