# Troubleshooting Guide

Common issues and solutions for Creator Ledger.

## Edge Function Errors

### "Edge Function error:" or 401/403 errors

**Problem**: Edge Functions are not deployed or authentication is failing.

**Solution**:

1. **Check if Edge Functions are deployed**:
   ```bash
   # List deployed functions
   supabase functions list
   # OR
   npx supabase@latest functions list
   ```

2. **Deploy all Edge Functions**:
   ```bash
   ./scripts/deploy-edge-functions.sh
   ```

3. **Verify environment variables in Supabase Dashboard**:
   - Go to **Edge Functions** → **Settings**
   - Check that these are set:
     - `PROJECT_URL` = Your Supabase project URL
     - `SERVICE_ROLE_KEY` = Your service role key

4. **Check Edge Function logs**:
   - Go to **Supabase Dashboard** → **Edge Functions** → **Logs**
   - Look for errors in the function logs

### "Authentication failed" when signing in

**Problem**: The `auth-with-wallet` Edge Function is not deployed or has errors.

**Solution**:

1. **Deploy the auth-with-wallet function**:
   ```bash
   supabase functions deploy auth-with-wallet
   ```

2. **Check the function logs** for errors

3. **Verify the function returns proper JWT tokens**:
   - The function should use `createSession()` not `generateLink()`
   - Check `supabase/functions/auth-with-wallet/index.ts`

### "Can't see old entries"

**Problem**: Entries exist in database but aren't showing up.

**Possible causes**:

1. **Edge Functions not deployed**:
   - Deploy `get-entries` function:
     ```bash
     supabase functions deploy get-entries
     ```

2. **RLS blocking access**:
   - Check if RLS is enabled without policies
   - Edge Functions should work (they use service role key)

3. **Check browser console**:
   - Look for errors when fetching entries
   - Check Network tab for failed requests

4. **Verify entries exist in database**:
   - Go to **Supabase Dashboard** → **Table Editor** → `ledger_entries`
   - Check if entries exist for your wallet address

5. **Check wallet address format**:
   - Make sure wallet address is lowercase
   - Check that the address matches exactly

### "Can't submit new entries"

**Problem**: Entry submission fails with authentication error.

**Solution**:

1. **Make sure you're authenticated**:
   - Connect your wallet
   - Sign the authentication message when prompted
   - Check browser console for auth errors

2. **Deploy create-entry function**:
   ```bash
   supabase functions deploy create-entry
   ```

3. **Check authentication flow**:
   - Wallet should prompt you to sign a message
   - If not, check browser console for errors
   - Try disconnecting and reconnecting wallet

4. **Verify token is being sent**:
   - Open browser DevTools → Network tab
   - Submit an entry
   - Check the request to `create-entry`
   - Verify `Authorization: Bearer <token>` header is present

## CORS Errors

### "CORS policy" errors

**Problem**: Edge Functions not returning proper CORS headers.

**Solution**:

1. **Redeploy all Edge Functions** (CORS fixes are in the code):
   ```bash
   ./scripts/deploy-edge-functions.sh
   ```

2. **Check OPTIONS requests**:
   - Edge Functions should return 204 for OPTIONS
   - Check Network tab for preflight requests

## Database Issues

### "Table not found" or RLS errors

**Problem**: Database tables don't exist or RLS is blocking access.

**Solution**:

1. **Check if tables exist**:
   - Go to **Supabase Dashboard** → **Table Editor**
   - Verify `users`, `ledger_entries`, `profiles` tables exist

2. **Check RLS status**:
   - Go to **Supabase Dashboard** → **Authentication** → **Policies**
   - RLS should be enabled but NO policies should exist
   - Edge Functions use service role key (bypasses RLS)

3. **Run migrations**:
   - If tables don't exist, run the SQL schema
   - Check `supabase_schema.sql` or database setup docs

## Authentication Issues

### "Authentication required" errors

**Problem**: User is not authenticated or token is invalid.

**Solution**:

1. **Sign in with wallet**:
   - Connect wallet
   - Sign the authentication message
   - Check that token is stored in localStorage

2. **Check token validity**:
   - Open browser console
   - Run: `localStorage.getItem('supabase_auth_token')`
   - Should return a JWT token

3. **Re-authenticate**:
   - Disconnect wallet
   - Clear localStorage: `localStorage.clear()`
   - Reconnect wallet and sign message again

4. **Check auth-with-wallet function**:
   - Make sure it's deployed
   - Check logs for errors
   - Verify it returns `access_token` and `refresh_token`

## Wallet Connection Issues

### Wallet won't connect

**Solution**:

1. **Check wallet extension**:
   - Make sure MetaMask or other wallet is installed
   - Check that it's unlocked

2. **Check network**:
   - Switch to Base network
   - The app works on Base mainnet

3. **Clear cache**:
   - Clear browser cache and localStorage
   - Try in incognito mode

## Build Errors

### TypeScript errors

**Solution**:

```bash
# Clear and rebuild
rm -rf node_modules .vite dist
npm install
npm run build
```

### Linting errors

**Solution**:

```bash
npm run lint
# Fix auto-fixable issues
npm run lint -- --fix
```

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check Supabase Dashboard** → **Edge Functions** → **Logs**
3. **Verify all Edge Functions are deployed**
4. **Verify environment variables are set correctly**
5. **Check that RLS is enabled with NO policies**

## Quick Checklist

- [ ] All Edge Functions deployed
- [ ] Environment variables set in Supabase Dashboard (PROJECT_URL, SERVICE_ROLE_KEY)
- [ ] Environment variables set in `.env.local` (VITE_SUPABASE_URL, etc.)
- [ ] Wallet connected and authenticated
- [ ] RLS enabled with NO policies
- [ ] Database tables exist
- [ ] No CORS errors in browser console

