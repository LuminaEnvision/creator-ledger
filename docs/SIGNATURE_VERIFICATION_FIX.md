# Critical Fix: Signature Verification Using Checksum Address

## 🐛 The Bug

**Root Cause**: Using `.toLowerCase()` on Ethereum addresses before signature verification breaks the verification.

### Why This Breaks

Ethereum signature verification:
1. Recovers the signer address from the signature
2. Compares it against the provided address
3. **Checksum mismatch = invalid signature** (no warning, just returns `false`)

### The Problem Code

```typescript
// ❌ BROKEN: Lowercase breaks signature verification
const normalizedAddress = address.toLowerCase();
const isValid = await verifyMessage({
  address: normalizedAddress,  // Wrong format!
  message,
  signature
});
```

**Result**: Signature verification always fails silently, causing:
- Authentication failures
- Entry creation failures
- "No data" because entries aren't being created/verified

## ✅ The Fix

Use `getAddress()` from viem to get checksum format:

```typescript
// ✅ CORRECT: Use checksum address format
import { verifyMessage, getAddress } from 'viem';

const checksumAddress = getAddress(address);
const isValid = await verifyMessage({
  address: checksumAddress,  // Correct format!
  message,
  signature
});
```

## 🔧 Changes Made

### 1. Frontend (`src/lib/signatureVerification.ts`)

**Before**:
```typescript
const normalizedAddress = address.toLowerCase();
const isValid = await verifyMessage({
  address: normalizedAddress as `0x${string}`,
  ...
});
```

**After**:
```typescript
const checksumAddress = getAddress(address);
const isValid = await verifyMessage({
  address: checksumAddress,
  ...
});
```

### 2. Edge Function (`supabase/functions/auth-with-wallet/index.ts`)

**Before**:
```typescript
const isValid = await verifyMessage({
  address: walletAddress as `0x${string}`,
  ...
});
```

**After**:
```typescript
const checksumAddress = getAddress(walletAddress);
const isValid = await verifyMessage({
  address: checksumAddress,
  ...
});
```

## ⚠️ Important Notes

### When to Use Checksum vs Lowercase

**Use checksum (`getAddress`) for**:
- ✅ Signature verification (`verifyMessage`)
- ✅ Address recovery from signatures
- ✅ Any cryptographic operation

**Use lowercase for**:
- ✅ Database queries (stored in lowercase)
- ✅ String comparisons (matching addresses)
- ✅ Storage operations

**Example**:
```typescript
// Signature verification - MUST use checksum
const checksumAddress = getAddress(address);
await verifyMessage({ address: checksumAddress, ... });

// Database query - lowercase is fine
const normalizedAddress = address.toLowerCase();
await supabase.from('users').eq('wallet_address', normalizedAddress);
```

## 🧪 Testing After Fix

1. **Redeploy Edge Functions**:
   ```bash
   supabase functions deploy auth-with-wallet
   ```

2. **Clear local cache/session**:
   - Clear browser localStorage
   - Disconnect and reconnect wallet

3. **Re-sign once** (fresh signature):
   - Connect wallet
   - Sign authentication message
   - Check console for "✅ Signature verification result: { isValid: true }"

4. **Test createEntry**:
   - Submit a new entry
   - Should succeed now

5. **Test getEntries**:
   - View dashboard
   - Entries should appear

## 🔍 Why This Caused "No Data"

The cascade of failures:

1. Frontend signs message → ✅ Works
2. Edge Function verifies signature → ❌ Fails (checksum mismatch)
3. Authentication rejected → ❌ No JWT token
4. Entry creation fails → ❌ "Authentication required"
5. Query returns empty → ❌ No entries to show
6. App shows "no data" → ❌ User sees nothing

**All silently** - no clear error messages pointing to signature verification.

## 📊 Verification

After fix, check logs:

**Edge Function logs** (`auth-with-wallet`):
```
🔐 Verifying signature: { originalAddress: '0x...', checksumAddress: '0x...' }
✅ Signature verification result: { isValid: true, checksumAddress: '0x...' }
```

**Frontend logs**:
```
Signature verification result: { isValid: true, address: '0x...' }
```

## 🚫 Never Do This

**Never normalize addresses before signature verification**:
- ❌ `.toLowerCase()`
- ❌ `.toUpperCase()`
- ❌ Trimming internal chars
- ❌ Regex normalization

**Only allowed**:
- ✅ `getAddress(address)` - checksum format
- ✅ Exact comparison (for non-crypto operations)

## Summary

| Operation | Format | Why |
|-----------|--------|-----|
| Signature verification | Checksum (`getAddress`) | Cryptographic requirement |
| Database queries | Lowercase | Storage format |
| String comparison | Lowercase | Matching addresses |

**Bottom line**: This was a cryptography-level bug, not infrastructure. Fix signature verification and the system will work.

