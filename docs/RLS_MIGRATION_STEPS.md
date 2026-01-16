# RLS Migration Steps

This guide explains how to run the RLS migration to close direct database access.

## Overview

The migration `enable_rls_no_rules.sql` will:
1. Enable RLS on all tables
2. Remove all existing RLS policies
3. Close database to direct frontend access
4. Only Edge Functions (using service role key) can access the database

## Prerequisites

Before running the migration:

- [ ] All Edge Functions are deployed
- [ ] Supabase Auth is set up
- [ ] Frontend is migrated to use Edge Functions (or has fallbacks)
- [ ] You have backup of your database

## Migration Steps

### 1. Review the Migration Script

Open `migrations/enable_rls_no_rules.sql` and review:
- Which tables will have RLS enabled
- Which policies will be dropped
- The verification query at the end

### 2. Run the Migration

**Option A: Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `migrations/enable_rls_no_rules.sql`
4. Paste into editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Review results

**Option B: Supabase CLI**

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
# Or run specific migration:
psql $DATABASE_URL -f migrations/enable_rls_no_rules.sql
```

### 3. Verify RLS is Enabled

After running the migration, verify:

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'ledger_entries', 'profiles', 'entry_endorsements', 'user_notifications', 'portfolio_collections')
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

### 4. Verify No Policies Exist

```sql
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'ledger_entries', 'profiles', 'entry_endorsements', 'user_notifications', 'portfolio_collections');
```

This should return no rows (no policies).

### 5. Test Edge Functions

After migration:
1. Test authentication with wallet
2. Test all Edge Functions
3. Verify frontend can access data via Edge Functions
4. Verify direct Supabase calls fail (as expected)

## What Happens After Migration

### ✅ Works
- Edge Functions (using service role key)
- Supabase Auth operations
- Admin operations via service role

### ❌ Blocked
- Direct `supabase.from()` calls from frontend
- Any database access without service role key
- RLS policies (none exist, so all access is blocked)

## Rollback (If Needed)

If you need to rollback:

```sql
-- Disable RLS on all tables (NOT RECOMMENDED for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE entry_endorsements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collections DISABLE ROW LEVEL SECURITY;
```

**Warning**: Only rollback if absolutely necessary. The whole point is to close direct access.

## Troubleshooting

### "Permission denied" errors
- Expected for direct Supabase calls
- Use Edge Functions instead
- Check Edge Function authentication

### Edge Functions return 403
- Check token is valid
- Verify Supabase Auth is set up
- Check Edge Function authentication logic

### Edge Functions return 500
- Check service role key is set in Edge Function environment
- Verify Edge Function has proper error handling
- Check Supabase logs

## Security Notes

After migration:
- ✅ Database is closed to direct access
- ✅ Only Edge Functions can access database
- ✅ Service role key is only in Edge Functions
- ✅ All access is authenticated via Supabase Auth
- ✅ Tokens automatically refresh

## Next Steps

After successful migration:
1. Remove fallback direct database calls from frontend
2. Test all functionality via Edge Functions
3. Monitor Edge Function logs
4. Update documentation

## Related

- `migrations/enable_rls_no_rules.sql` - Migration script
- `docs/EDGE_FUNCTIONS_SETUP.md` - Edge Functions setup
- `docs/NO_DIRECT_DB_ACCESS.md` - No direct DB access guide

