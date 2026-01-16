# Supabase Auth Setup with Wallet Authentication

This guide explains how to set up Supabase Auth with wallet-based authentication for the Creator Ledger application.

## Overview

We use a custom wallet authentication flow:
1. User signs a message with their wallet
2. Signature is verified by Edge Function
3. Supabase Auth user is created/updated with wallet address in metadata
4. JWT token is returned and stored
5. Token automatically refreshes via Supabase Auth

## Setup Steps

### 1. Deploy Auth Edge Function

Deploy the wallet authentication Edge Function:

```bash
supabase functions deploy auth-with-wallet
```

### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings, ensure:
- `SUPABASE_URL` is set
- `SUPABASE_SERVICE_ROLE_KEY` is set (keep secret!)

### 3. Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider (we use email format: `wallet@wallet.local`)
3. Disable email confirmation (since we verify via wallet signature)
4. Configure JWT settings:
   - JWT expiry: 3600 (1 hour) - tokens auto-refresh
   - Refresh token rotation: Enabled

### 4. Update Frontend

The frontend is already set up to use wallet authentication:

```typescript
import { authenticateWithWallet, getAuthToken } from '../lib/supabaseAuth'

// Authenticate when user connects wallet
const { access_token } = await authenticateWithWallet(walletAddress, signMessageAsync)

// Get token for Edge Function calls (auto-refreshes)
const token = await getAuthToken()
```

### 5. Test Authentication

1. Connect wallet in the app
2. Check browser console for authentication flow
3. Verify token is stored in localStorage
4. Test Edge Function calls with token

## How It Works

### Authentication Flow

```
User connects wallet
    ↓
Frontend requests signature
    ↓
User signs message
    ↓
Frontend sends to auth-with-wallet Edge Function
    ↓
Edge Function verifies signature
    ↓
Edge Function creates/updates Supabase Auth user
    ↓
Edge Function returns JWT token
    ↓
Frontend stores token
    ↓
Token automatically refreshes via Supabase Auth
```

### Token Management

- **Expiration**: Tokens expire after 1 hour (configurable)
- **Refresh**: Supabase Auth automatically refreshes tokens
- **Storage**: Tokens stored in localStorage (can be moved to secure storage)
- **Usage**: Token included in `Authorization: Bearer <token>` header

### Edge Function Authentication

All Edge Functions:
1. Extract token from `Authorization` header
2. Verify token with Supabase Auth
3. Extract wallet address from user metadata
4. Return 403 immediately if token is invalid
5. Use service role key for database access

## Security Considerations

1. **Service Role Key**: Never expose in frontend, only in Edge Functions
2. **Token Storage**: Consider using httpOnly cookies in production
3. **Signature Verification**: Always verify wallet signatures server-side
4. **Token Refresh**: Handled automatically by Supabase Auth
5. **403 Response**: Edge Functions immediately return 403 for invalid tokens

## Troubleshooting

### "Authentication required" error
- Check that wallet is connected
- Verify `auth-with-wallet` Edge Function is deployed
- Check that token is stored in localStorage

### "Invalid or expired token" error
- Token may have expired - Supabase Auth should auto-refresh
- Check Supabase Auth configuration
- Verify token is being sent in Authorization header

### Edge Function returns 403
- Token is invalid or expired
- Check token in browser DevTools → Application → Local Storage
- Try re-authenticating with wallet

## Next Steps

After setting up Supabase Auth:
1. ✅ Migrate all direct Supabase calls to Edge Functions
2. ✅ Run RLS migration to close database access
3. ✅ Test all Edge Functions with authenticated requests
4. ✅ Remove fallback direct database calls

## Related Documentation

- `docs/EDGE_FUNCTIONS_SETUP.md` - Edge Functions setup
- `docs/NO_DIRECT_DB_ACCESS.md` - No direct DB access guide
- `supabase/functions/auth-with-wallet/index.ts` - Auth Edge Function

