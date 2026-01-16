---
name: no-direct-db-access
description: Enforce that frontend code never directly accesses the database. All database operations must go through Edge Functions with proper authentication. This ensures security, control, and the ability to update logic without app releases.
---

# No Direct Database Access Rule

## When to Apply

This skill should be used when:
- Reviewing frontend code for database operations
- Writing new features that need database access
- Refactoring existing code
- Code reviews and PR checks

## Core Principle

**NEVER let your frontend directly talk to your database. This is a bad design.**

### Why This Matters

1. **Security**: Direct database access from frontend means exposing your database structure and potentially allowing unauthorized access
2. **Control**: If logic lives in your backend (Edge Functions), you can:
   - Update code without releasing a new app version
   - Immediately cut access if there's an issue
   - Change logic and fix bugs instantly
   - Have ultimate control over all database operations
3. **Token Management**: Edge Functions handle token expiration and refresh automatically via Supabase Auth
4. **Service Role Key**: Only Edge Functions (using service role key) should access the database

## Rules

### ❌ FORBIDDEN: Direct Database Access

```typescript
// ❌ BAD: Direct Supabase client usage in frontend
import { supabase } from '../lib/supabase'

const { data } = await supabase
  .from('users')
  .select('*')
  .eq('wallet_address', walletAddress)

const { error } = await supabase
  .from('ledger_entries')
  .insert([{ ... }])

const { data } = await supabase
  .from('profiles')
  .update({ ... })
  .eq('wallet_address', walletAddress)
```

### ✅ CORRECT: Use Edge Functions

```typescript
// ✅ GOOD: Use Edge Functions with authentication
import { edgeFunctions } from '../lib/edgeFunctions'

const { user } = await edgeFunctions.getUser()
const { entry } = await edgeFunctions.createEntry({ ... })
const { profile } = await edgeFunctions.updateProfile({ ... })
```

## Edge Function Authentication

All Edge Functions must:

1. **Extract user ID from token**: Token expiration and refresh is handled automatically by Supabase Auth
2. **Return 403 immediately**: If token is invalid or expired, return 403 immediately
3. **Use service role key**: Only Edge Functions use service role key to access database
4. **Validate all input**: Edge Functions validate and sanitize all input data

## Migration Checklist

When migrating from direct database access to Edge Functions:

- [ ] Identify all `supabase.from()` calls in frontend code
- [ ] Create corresponding Edge Function if it doesn't exist
- [ ] Replace direct calls with Edge Function calls
- [ ] Ensure proper error handling (403 for auth errors)
- [ ] Test that token refresh works automatically
- [ ] Verify service role key is only used in Edge Functions
- [ ] Remove direct Supabase client imports from frontend

## Files to Check

Common locations where direct database access might exist:

- `src/pages/*.tsx` - Page components
- `src/components/*.tsx` - React components
- `src/context/*.tsx` - Context providers
- `src/hooks/*.tsx` - Custom hooks

## Enforcement

This rule should be enforced:

1. **In code reviews**: Flag any direct `supabase.from()` calls
2. **In linting**: Add ESLint rule to detect direct Supabase usage
3. **In CI/CD**: Run checks to ensure no direct database access
4. **In documentation**: Document all available Edge Functions

## Benefits

✅ **Security**: No direct database access from frontend
✅ **Control**: Update logic without app releases
✅ **Speed**: Fix bugs immediately without waiting for app store approval
✅ **Flexibility**: Change business logic in backend without frontend changes
✅ **Token Management**: Automatic token refresh handled by Supabase Auth

## Related

- See `docs/EDGE_FUNCTIONS_SETUP.md` for Edge Functions setup
- See `supabase/functions/` for available Edge Functions
- See `src/lib/edgeFunctions.ts` for frontend helper library

