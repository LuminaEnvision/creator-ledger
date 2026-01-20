# Vercel Environment Variables Review

## ✅ Keep These (Correct)

### Required:
- ✅ `VITE_SUPABASE_URL` - Used in frontend ✅
- ✅ `VITE_SUPABASE_ANON_KEY` - Used in frontend ✅
- ✅ `VITE_WALLETCONNECT_PROJECT_ID` - Used in frontend ✅

### Optional (if used):
- ✅ `VITE_PASSPORT_CONTRACT_ADDRESS` - **IF** you want to make contract address configurable
  - Currently hardcoded in `src/lib/contracts.ts`
  - Contract addresses are public, so safe to expose
  - **Recommendation**: Keep it if you plan to make it configurable, otherwise remove

- ⚠️ `VITE_TREASURY_ADDRESS` - **ONLY if used in frontend**
  - Not found in frontend code
  - **Recommendation**: Remove unless you're using it

---

## ❌ Remove These (Not Needed in Vercel)

### Should NOT be in Vercel:

1. ❌ **`BASE_RPC_URL`** - **REMOVE**
   - **Why**: Only used in `hardhat.config.cjs` for local contract deployment
   - **Not prefixed with VITE_**: Won't be accessible in frontend anyway
   - **Where it belongs**: Local `.env.local` only
   - **Action**: Delete from Vercel

2. ❌ **`BASESCAN_API_KEY`** - **REMOVE**
   - **Why**: Only used in `hardhat.config.cjs` for contract verification
   - **Not prefixed with VITE_**: Won't be accessible in frontend anyway
   - **Where it belongs**: Local `.env.local` only
   - **Action**: Delete from Vercel

---

## 📋 Final Vercel Environment Variables

### Required (3):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_WALLETCONNECT_PROJECT_ID
```

### Optional (1-2):
```
VITE_PASSPORT_CONTRACT_ADDRESS  # Only if making it configurable
VITE_TREASURY_ADDRESS            # Only if used in frontend (not found)
```

### Remove (2):
```
BASE_RPC_URL        # ❌ DELETE
BASESCAN_API_KEY    # ❌ DELETE
```

---

## 🔍 How to Check if Variables Are Used

### Variables with `VITE_` prefix:
- ✅ Accessible in frontend via `import.meta.env.VITE_*`
- ✅ Safe to expose (bundled in client code)
- ✅ Should be in Vercel if used in frontend

### Variables WITHOUT `VITE_` prefix:
- ❌ NOT accessible in frontend
- ❌ Only work in Node.js/server-side code
- ❌ Should NOT be in Vercel (Vercel doesn't run server-side for static sites)

---

## ✅ Action Items

1. **Delete from Vercel**:
   - `BASE_RPC_URL` ❌
   - `BASESCAN_API_KEY` ❌

2. **Review**:
   - `VITE_PASSPORT_CONTRACT_ADDRESS` - Keep if you want it configurable, otherwise remove
   - `VITE_TREASURY_ADDRESS` - Remove if not used in frontend

3. **Keep**:
   - `VITE_SUPABASE_URL` ✅
   - `VITE_SUPABASE_ANON_KEY` ✅
   - `VITE_WALLETCONNECT_PROJECT_ID` ✅

---

## 📍 Where Removed Variables Should Go

### Local `.env.local` (for contract deployment):
```bash
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your-basescan-api-key
PRIVATE_KEY=your-private-key  # Never in Vercel!
```

These are only needed when running contract deployment scripts locally.

---

**Last Updated**: January 17, 2026

