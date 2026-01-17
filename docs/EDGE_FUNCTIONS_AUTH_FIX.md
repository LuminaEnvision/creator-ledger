# Critical Fix: Public Read Operations and Auth Token Handling

## 🐛 The Bug

**Root Cause**: Public read operations were sending auth tokens even when `requireAuth: false`, causing RLS to filter data differently for logged-in vs anonymous users.

### The Problem

```typescript
// BEFORE (BROKEN):
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

**Result**:
- ✅ Anonymous users: No token → No RLS filtering → See data
- ❌ Logged-in users: Token sent → RLS filters → See nothing

### The Fix

```typescript
// AFTER (FIXED):
if (token && requireAuth) {
  headers['Authorization'] = `Bearer ${token}`
}
```

**Result**:
- ✅ Anonymous users: No token → No RLS filtering → See data
- ✅ Logged-in users: No token for public reads → No RLS filtering → See data
- ✅ Authenticated operations: Token sent → Proper auth → Work correctly

## 🔧 Changes Made

### 1. Frontend (`src/lib/edgeFunctions.ts`)

**Fixed**: Only send auth token when `requireAuth: true`

```typescript
// Public read operations
async getEntries(...) {
  return callEdgeFunction('get-entries', {
    requireAuth: false  // No token sent
  })
}

// Authenticated operations
async createEntry(...) {
  return callEdgeFunction('create-entry', {
    requireAuth: true  // Token sent
  })
}
```

### 2. Edge Functions (`get-entries`, `get-profile`)

**Fixed**: Explicitly branch public vs authenticated logic

```typescript
// BEFORE: Always tried to authenticate
let walletAddress = null
try {
  walletAddress = await authenticateUser(req)
} catch {
  // Silent failure
}

// AFTER: Only authenticate if token present
const authHeader = req.headers.get('Authorization')
let walletAddress = null

if (authHeader && authHeader.startsWith('Bearer ')) {
  try {
    walletAddress = await authenticateUser(req)
  } catch {
    // Log but proceed as public
  }
} else {
  // Explicitly public request
}
```

### 3. Error Handling

**Fixed**: Don't mask real backend errors

```typescript
// BEFORE: Generic error messages
if (response.status === 403) {
  errorMessage = 'Authentication required'
}

// AFTER: Preserve original error details
const originalError = errorDetails.error || errorDetails.message
// Log full details for debugging
console.error('Edge Function error:', { status, details: errorDetails })
```

## ✅ Verification Checklist

After deploying this fix:

- [ ] Anonymous users can view public profiles
- [ ] Logged-in users can view public profiles
- [ ] Logged-in users can view their own entries
- [ ] Write operations (create-entry) require authentication
- [ ] Edge Function logs show "Public request" for unauthenticated reads
- [ ] Edge Function logs show "Authenticated request" for authenticated reads

## 🧪 Testing

### Test 1: Public Read (No Auth)

```bash
# Should work without token
curl "https://YOUR_PROJECT.supabase.co/functions/v1/get-entries?wallet_address=0x..."
```

**Expected**: Returns entries, logs "📖 Public request (no auth token)"

### Test 2: Authenticated Read (With Auth)

```bash
# Should work with token
curl "https://YOUR_PROJECT.supabase.co/functions/v1/get-entries?wallet_address=0x..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns entries, logs "✅ Authenticated request"

### Test 3: Write Operation (Requires Auth)

```bash
# Should require token
curl "https://YOUR_PROJECT.supabase.co/functions/v1/create-entry" \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url":"...","platform":"twitter","payload_hash":"..."}'
```

**Expected**: Creates entry successfully

## 📊 Edge Function Logs

After fix, you should see:

**Public Request**:
```
📖 Public request (no auth token)
📊 Querying entries: { targetWallet: '0x...', hasAuth: false }
✅ Entries fetched successfully: { count: 5 }
```

**Authenticated Request**:
```
🔐 Auth check: { hasAuthHeader: true, ... }
✅ Token verified: { userId: '...' }
✅ Authenticated request: { walletAddress: '0x...' }
📊 Querying entries: { targetWallet: '0x...', hasAuth: true }
✅ Entries fetched successfully: { count: 5 }
```

## ⚠️ Known Issues

### Token in Query String (subscribe-notifications)

**Issue**: EventSource doesn't support custom headers, so token is passed as query param.

**Location**: `src/lib/edgeFunctions.ts` line 274

```typescript
url.searchParams.append('token', token)  // ⚠️ Security concern
```

**Risk**: Token appears in:
- Browser history
- Server logs
- Reverse proxy logs

**Mitigation**: 
- Edge Function extracts token immediately and doesn't log it
- Consider using short-lived subscription tokens in the future
- Or exchange JWT → session ID for SSE connections

**Status**: Documented, acceptable for now (SSE limitation)

## 🔗 Related

- [Debugging Guide](./DEBUGGING_EDGE_FUNCTIONS.md)
- [No Direct DB Access Rule](../.cursor/skills/no-direct-db-access/SKILL.md)
- [Edge Functions Setup](./DEVELOPER_SETUP.md#edge-functions)

