# Migration Progress: Direct DB Access → Edge Functions

## Status: In Progress

This document tracks the migration from direct Supabase database access to Edge Functions.

## Completed ✅

1. **Edge Functions Created** (12 functions)
   - ✅ User operations: get-user, create-user, update-user
   - ✅ Entry operations: create-entry, get-entries
   - ✅ Profile operations: get-profile, update-profile
   - ✅ Endorsement operations: vote-entry
   - ✅ Notification operations: get-notifications, mark-notification-read
   - ✅ Admin operations: admin-get-entries, admin-verify-entry

2. **Authentication Setup**
   - ✅ Created `auth-with-wallet` Edge Function
   - ✅ Created `supabaseAuth.ts` helper library
   - ✅ Updated `edgeFunctions.ts` to use Supabase Auth tokens
   - ✅ Updated `AuthContext.tsx` to use Edge Functions

3. **Documentation**
   - ✅ `docs/EDGE_FUNCTIONS_SETUP.md` - Complete setup guide
   - ✅ `docs/NO_DIRECT_DB_ACCESS.md` - Enforcement guide
   - ✅ `docs/SUPABASE_AUTH_SETUP.md` - Auth setup guide
   - ✅ `docs/RLS_MIGRATION_STEPS.md` - RLS migration guide
   - ✅ `.cursor/skills/no-direct-db-access/` - Enforcement skill

4. **Partially Migrated**
   - ✅ `src/context/AuthContext.tsx` - Uses Edge Functions (with fallback)
   - ✅ `src/pages/Dashboard.tsx` - Main data fetching migrated (some manual refresh still uses direct calls)

## Remaining Migration (14 files)

Files that still have direct `supabase.from()` calls:

1. `src/components/CreateEntryForm.tsx` - Entry creation
2. `src/pages/Pricing.tsx` - Premium status updates
3. `src/pages/PublicProfile.tsx` - Profile and entries fetching
4. `src/pages/AdminDashboard.tsx` - Admin operations
5. `src/components/Notifications.tsx` - Notification fetching
6. `src/components/EntryEndorsement.tsx` - Endorsement operations
7. `src/components/ProfileDisplay.tsx` - Profile fetching
8. `src/components/WalletConnect.tsx` - User creation
9. `src/components/OnChainUpgradeModal.tsx` - Entry fetching
10. `src/components/PassportDisplay.tsx` - Entry and profile fetching
11. `src/components/EditEntryModal.tsx` - Entry updates
12. `src/components/CustomizeProfileForm.tsx` - Profile updates
13. `src/components/EditProfileModal.tsx` - Profile updates
14. `src/pages/Dashboard.tsx` - Manual refresh button (partially migrated)

## Migration Pattern

For each file, replace:

```typescript
// ❌ OLD: Direct database access
import { supabase } from '../lib/supabase'
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value)
```

With:

```typescript
// ✅ NEW: Edge Functions
import { edgeFunctions } from '../lib/edgeFunctions'
const { data } = await edgeFunctions.getTableName({ field: value })
```

## Next Steps

1. **Complete Frontend Migration**
   - Migrate remaining 14 files to use Edge Functions
   - Remove all direct `supabase.from()` calls
   - Test all functionality

2. **Deploy Edge Functions**
   - Deploy `auth-with-wallet` function
   - Deploy all other Edge Functions
   - Set environment variables

3. **Set Up Supabase Auth**
   - Configure Supabase Auth
   - Test wallet authentication
   - Verify token refresh works

4. **Run RLS Migration**
   - Run `migrations/enable_rls_no_rules.sql`
   - Verify RLS is enabled
   - Verify no policies exist
   - Test Edge Functions still work

5. **Remove Fallbacks**
   - Remove fallback direct database calls
   - Remove `supabase` imports from frontend
   - Update error handling

## Testing Checklist

After migration:
- [ ] User authentication works
- [ ] User creation works
- [ ] Entry creation works
- [ ] Entry fetching works
- [ ] Profile operations work
- [ ] Endorsements work
- [ ] Notifications work
- [ ] Admin operations work
- [ ] Token refresh works automatically
- [ ] Edge Functions return 403 for invalid tokens
- [ ] Direct Supabase calls fail (as expected)

## Notes

- Fallback direct calls are temporarily kept for compatibility during migration
- All fallbacks should be removed after RLS migration
- Edge Functions handle token refresh automatically
- Service role key is only in Edge Functions

