# No Direct Database Access - Enforcement Guide

## Core Principle

**NEVER let your frontend directly talk to your database. This is a bad design.**

As emphasized by Burak Eregar's best practices:

> "Having your client talk to your db literally means leaving the keys and authority to someone else and losing all the control and speed you could have. Don't do that."

## Why This Matters

### 1. Security
- Direct database access exposes your database structure
- RLS policies can be bypassed or misconfigured
- Service role key should NEVER be in frontend code

### 2. Control & Speed
- **Update logic without app releases**: If logic lives in backend (Edge Functions), you can update code instantly
- **Immediate bug fixes**: Fix issues without waiting for Apple/Google app store approval
- **Ultimate control**: Change business logic, cut access, or fix bugs immediately

### 3. Token Management
- Token expiration and refresh is handled automatically by Supabase Auth
- Edge Functions extract user ID from token automatically
- No need to worry about token refresh - it's handled by the auth provider

### 4. Immediate 403 Response
- Edge Functions should immediately return 403 if token is invalid
- This prevents unauthorized access attempts
- Clear error handling for expired tokens

## Current Status

### ✅ Edge Functions Created
All Edge Functions are created and ready to use:
- `get-user`, `create-user`, `update-user`
- `create-entry`, `get-entries`
- `get-profile`, `update-profile`
- `vote-entry`
- `get-notifications`, `mark-notification-read`
- `admin-get-entries`, `admin-verify-entry`

### ⚠️ Migration Needed
The frontend still has direct database calls that need to be migrated:

**Files with direct Supabase calls:**
- `src/pages/Dashboard.tsx` - User data and entries fetching
- `src/components/CreateEntryForm.tsx` - Entry creation
- `src/pages/Pricing.tsx` - User premium status updates
- `src/pages/PublicProfile.tsx` - Profile and entries fetching
- `src/context/AuthContext.tsx` - User sync
- And more...

## Migration Steps

### Step 1: Set Up Supabase Auth
1. Configure Supabase Auth with wallet-based authentication
2. Users sign in and get JWT tokens
3. Tokens automatically refresh via Supabase Auth

### Step 2: Update Edge Functions Auth
Edge Functions now:
- ✅ Immediately return 403 for invalid tokens
- ✅ Extract wallet address from token metadata
- ✅ Use service role key for database access

### Step 3: Replace Direct Calls

**Before:**
```typescript
// ❌ BAD: Direct database access
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('wallet_address', walletAddress)
```

**After:**
```typescript
// ✅ GOOD: Use Edge Functions
import { edgeFunctions } from '../lib/edgeFunctions'

const { user } = await edgeFunctions.getUser()
```

### Step 4: Update Auth Context
Update `src/context/AuthContext.tsx` to:
1. Use Supabase Auth for authentication
2. Get JWT token from session
3. Include token in Edge Function requests

### Step 5: Run RLS Migration
Run `migrations/enable_rls_no_rules.sql` to:
- Enable RLS on all tables
- Remove all RLS policies
- Close database to direct frontend access

## Edge Function Authentication Flow

```
1. Frontend gets JWT token from Supabase Auth
   ↓
2. Frontend includes token in Authorization header
   ↓
3. Edge Function verifies token (Supabase Auth handles refresh)
   ↓
4. If invalid → Immediately return 403
   ↓
5. If valid → Extract wallet address from user metadata
   ↓
6. Use service role key to access database
   ↓
7. Return response
```

## Enforcement

### Code Review Checklist
- [ ] No `supabase.from()` calls in frontend code
- [ ] All database operations go through Edge Functions
- [ ] Edge Functions return 403 for invalid tokens
- [ ] Service role key only in Edge Functions (never in frontend)

### Linting Rules
Add ESLint rule to detect direct Supabase usage:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "../lib/supabase",
        "message": "Use Edge Functions instead of direct Supabase access. See docs/NO_DIRECT_DB_ACCESS.md"
      }]
    }]
  }
}
```

### CI/CD Checks
Add pre-commit hook or CI check:
```bash
# Check for direct Supabase database calls
if grep -r "supabase\.from(" src/; then
  echo "ERROR: Direct database access detected. Use Edge Functions instead."
  exit 1
fi
```

## Benefits Summary

✅ **Security**: No direct database access from frontend
✅ **Control**: Update logic without app releases
✅ **Speed**: Fix bugs immediately without app store approval
✅ **Token Management**: Automatic refresh handled by Supabase Auth
✅ **403 Response**: Immediate rejection of invalid tokens
✅ **Service Role Key**: Only used in Edge Functions, never in frontend

## Related Documentation

- `docs/EDGE_FUNCTIONS_SETUP.md` - Complete Edge Functions setup guide
- `supabase/functions/README.md` - Edge Functions overview
- `.cursor/skills/no-direct-db-access/SKILL.md` - Agent skill for enforcement

