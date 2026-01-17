# Debugging Edge Functions - Data Not Showing Guide

This guide helps you diagnose why data isn't showing after migrating to Edge Functions.

## 🔍 Quick Diagnostic Checklist

### 1. Check Frontend is Using Edge Functions

✅ **Verify**: Search your frontend code for any remaining direct database calls:

```bash
# Search for direct Supabase calls (should only find storage operations)
grep -r "supabase\.from(" src/ --exclude-dir=node_modules
```

**Expected**: Only `supabase.storage.from()` calls (for file uploads) - these are OK.

**If you find**: `supabase.from('users')`, `supabase.from('ledger_entries')`, etc. → **These need to be replaced with Edge Functions!**

### 2. Verify Authentication Token is Being Sent

✅ **Check**: Open browser DevTools → Network tab → Look for Edge Function requests

**What to look for**:
- Request should have `Authorization: Bearer <token>` header
- If missing → Frontend isn't sending token
- If present but 403 → Token is invalid/expired

**Fix**: Check `src/lib/edgeFunctions.ts` - `callEdgeFunction` should add token to headers:

```typescript
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

### 3. Check Edge Function Logs

✅ **View logs**: Go to Supabase Dashboard → Edge Functions → Logs

**What to look for**:
- `🔐 Auth check:` - Shows if auth header is present
- `✅ Token verified:` - Shows successful authentication
- `❌ Token verification failed:` - Shows auth errors
- `📊 Querying entries:` - Shows query parameters
- `✅ Entries fetched successfully:` - Shows successful queries
- `❌ Error fetching entries:` - Shows database errors

### 4. Verify Environment Variables

✅ **Check**: Supabase Dashboard → Edge Functions → Settings

**Required variables**:
- `PROJECT_URL` = Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SERVICE_ROLE_KEY` = Your service role key

**Common issues**:
- ❌ Variables not set → Functions can't connect to database
- ❌ Wrong variable names → Functions fail silently
- ❌ Old/expired keys → Authentication fails

### 5. Test Edge Functions Directly

✅ **Test with curl**:

```bash
# Test get-entries (public, no auth needed)
curl "https://YOUR_PROJECT.supabase.co/functions/v1/get-entries?wallet_address=0x..." \
  -H "Content-Type: application/json"

# Test create-entry (requires auth)
curl "https://YOUR_PROJECT.supabase.co/functions/v1/create-entry" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url":"https://example.com","platform":"twitter","payload_hash":"0x..."}'
```

**Expected responses**:
- ✅ `200 OK` with data → Function works
- ❌ `403 Forbidden` → Auth issue
- ❌ `500 Internal Server Error` → Check logs for details

## 🐛 Common Issues & Solutions

### Issue 1: "Data not showing" but no errors in console

**Symptoms**:
- UI shows empty state
- No errors in browser console
- Network tab shows 200 OK responses

**Diagnosis**:
1. Check Edge Function logs - are queries returning empty arrays?
2. Check if RLS is blocking queries (Edge Functions use service role, should bypass RLS)
3. Verify query parameters are correct

**Solution**:
```typescript
// Add logging in frontend
const { entries } = await edgeFunctions.getEntries({ wallet_address })
console.log('📊 Entries received:', entries?.length, entries)
```

### Issue 2: "Authentication required" errors

**Symptoms**:
- 403 errors in Network tab
- "Authentication required" messages

**Diagnosis**:
1. Check if token is being sent (Network tab → Headers → Authorization)
2. Check Edge Function logs for auth errors
3. Verify token is valid (not expired)

**Solution**:
```typescript
// Check token before calling Edge Function
const token = await getAuthToken()
console.log('🔑 Token status:', { hasToken: !!token, tokenLength: token?.length })

if (!token) {
  // Trigger authentication
  await authenticateWithWallet(walletAddress, signMessageAsync)
}
```

### Issue 3: Edge Functions return empty data

**Symptoms**:
- Edge Functions return `{ entries: [] }` but data exists in database
- No errors in logs

**Diagnosis**:
1. Check query filters (wallet_address, verification_status)
2. Verify RLS isn't blocking (Edge Functions should bypass with service role)
3. Check database directly in Supabase Dashboard

**Solution**:
- Check Edge Function logs for query parameters
- Verify wallet address format (should be lowercase)
- Test query directly in Supabase SQL Editor

### Issue 4: Environment variable errors

**Symptoms**:
- Edge Functions fail with "Server configuration error"
- Functions return 500 errors

**Diagnosis**:
1. Check Supabase Dashboard → Edge Functions → Settings
2. Verify variable names: `PROJECT_URL` and `SERVICE_ROLE_KEY` (not `SUPABASE_URL`)
3. Check if variables are set correctly

**Solution**:
- Set variables in Supabase Dashboard
- Redeploy Edge Functions after setting variables
- Check function logs for "Missing environment variables" errors

## 📊 Enhanced Logging

All Edge Functions now include detailed logging:

### Authentication Logs
```
🔐 Auth check: { hasAuthHeader: true, method: 'GET', url: '...' }
📝 Token extracted: { tokenLength: 200, tokenPrefix: 'eyJ...' }
🔍 Verifying token with Supabase Auth...
✅ Token verified: { userId: '...', email: '...' }
✅ Wallet address extracted: { walletAddress: '0x...' }
```

### Query Logs
```
📊 Querying entries: { targetWallet: '0x...', isOwnProfile: true, onlyVerified: false }
✅ Entries fetched successfully: { count: 5 }
```

### Error Logs
```
❌ Token verification failed: { error: 'Invalid token', hasUser: false }
❌ Error fetching entries: { error: '...', code: '...', details: '...' }
```

## 🧪 Testing Locally

Test Edge Functions locally with Supabase CLI:

```bash
# Start local Supabase
supabase start

# Serve Edge Functions locally
supabase functions serve

# Test function
curl "http://localhost:54321/functions/v1/get-entries?wallet_address=0x..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Check logs in terminal for real-time debugging.

## 📝 Debugging Checklist

Use this checklist when data isn't showing:

- [ ] Frontend uses Edge Functions (no direct DB calls)
- [ ] Authentication token is being sent in requests
- [ ] Token is valid (not expired)
- [ ] Edge Function environment variables are set
- [ ] Edge Function logs show successful queries
- [ ] Database has data (check Supabase Dashboard)
- [ ] Query parameters are correct (wallet_address format)
- [ ] RLS is enabled but Edge Functions use service role (bypasses RLS)
- [ ] Network tab shows successful responses (200 OK)
- [ ] Frontend handles empty data gracefully

## 🔗 Related Documentation

- [Edge Functions Setup](./DEVELOPER_SETUP.md#edge-functions)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [No Direct DB Access Rule](../.cursor/skills/no-direct-db-access/SKILL.md)

