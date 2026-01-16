# Edge Functions Setup Guide

This guide explains how to migrate from direct Supabase database access to Edge Functions with proper authentication.

## Architecture Overview

Instead of using RLS (Row Level Security) rules, we now use:
1. **RLS enabled but no rules** - Database is closed to direct frontend access
2. **Edge Functions** - All database operations go through authenticated Edge Functions
3. **Supabase Auth** - Users authenticate with JWT tokens that expire and refresh automatically
4. **Service Role Key** - Only Edge Functions (using service role key) can access the database

## Benefits

- **Security**: No direct database access from frontend
- **Control**: All business logic lives in your backend
- **Flexibility**: Update logic without app releases
- **Authentication**: Proper token-based auth with automatic refresh

## Setup Steps

### 1. Enable RLS and Remove All Rules

Run the migration script:

```sql
-- Run: migrations/enable_rls_no_rules.sql
```

This enables RLS on all tables but removes all policies, closing direct database access.

### 2. Set Up Supabase Auth with Wallet Authentication

You need to configure Supabase Auth to support wallet-based authentication. This typically involves:

1. **Enable Wallet Auth Provider** in Supabase Dashboard
2. **Create Auth Function** that verifies wallet signatures
3. **Store wallet address** in user metadata

Example Supabase Auth setup (pseudo-code):

```typescript
// In your frontend, when user connects wallet:
const { data, error } = await supabase.auth.signInWithPassword({
  email: `${walletAddress}@wallet.local`, // Or use custom auth
  password: signature // Or use OTP
})

// Or use custom auth function:
const { data, error } = await supabase.auth.signInWithOtp({
  email: `${walletAddress}@wallet.local`,
  options: {
    data: {
      wallet_address: walletAddress
    }
  }
})
```

### 3. Deploy Edge Functions

Deploy all Edge Functions to Supabase:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy get-user
supabase functions deploy create-user
supabase functions deploy update-user
supabase functions deploy create-entry
supabase functions deploy get-entries
supabase functions deploy get-profile
supabase functions deploy update-profile
supabase functions deploy vote-entry
supabase functions deploy get-notifications
supabase functions deploy mark-notification-read
supabase functions deploy admin-get-entries
supabase functions deploy admin-verify-entry
```

### 4. Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings, set:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep this secret!)

### 5. Update Frontend to Use Edge Functions

Replace direct Supabase queries with Edge Function calls:

**Before:**
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('wallet_address', walletAddress)
```

**After:**
```typescript
import { edgeFunctions } from '../lib/edgeFunctions'

const { user } = await edgeFunctions.getUser()
```

### 6. Update Auth Context

Update `src/context/AuthContext.tsx` to use Supabase Auth:

```typescript
// Get Supabase Auth session
const { data: { session } } = await supabase.auth.getSession()

// Store token for Edge Function calls
const token = session?.access_token

// Extract wallet address from user metadata
const walletAddress = session?.user?.user_metadata?.wallet_address
```

## Edge Functions List

### User Operations
- `get-user` - Get current user data
- `create-user` - Create new user
- `update-user` - Update user (premium status, subscription)

### Entry Operations
- `create-entry` - Create new ledger entry
- `get-entries` - Get entries (supports filtering by wallet, verification status)

### Profile Operations
- `get-profile` - Get user profile
- `update-profile` - Update user profile

### Endorsement Operations
- `vote-entry` - Vote on entry (endorse/dispute)

### Notification Operations
- `get-notifications` - Get user notifications
- `mark-notification-read` - Mark notification as read

### Admin Operations
- `admin-get-entries` - Get all entries (admin only)
- `admin-verify-entry` - Verify entry (admin only)

## Authentication Flow

1. User connects wallet (via wagmi/rainbowkit)
2. Frontend signs a message with wallet
3. Frontend sends signature to Supabase Auth (custom auth function)
4. Supabase Auth returns JWT token with wallet address in metadata
5. Frontend stores token and includes it in Edge Function requests
6. Edge Function verifies token and extracts wallet address
7. Edge Function uses service role key to access database

## Migration Checklist

- [ ] Run `enable_rls_no_rules.sql` migration
- [ ] Set up Supabase Auth with wallet authentication
- [ ] Deploy all Edge Functions
- [ ] Set environment variables in Supabase
- [ ] Update frontend to use Edge Functions
- [ ] Update Auth Context to use Supabase Auth
- [ ] Test all operations through Edge Functions
- [ ] Remove direct Supabase queries from frontend
- [ ] Update documentation

## Troubleshooting

### "Unauthorized" errors
- Check that Supabase Auth is properly configured
- Verify token is being sent in Authorization header
- Check that wallet address is in user metadata

### "Service role key" errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function environment
- Never expose service role key in frontend code

### CORS errors
- Edge Functions include CORS headers automatically
- Check that your frontend domain is allowed in Supabase settings

## Security Notes

- **Never** expose service role key in frontend code
- **Always** authenticate users in Edge Functions
- **Validate** all input data in Edge Functions
- **Use** Supabase Auth tokens, not custom tokens
- **Enable** RLS on all tables (even without rules)

