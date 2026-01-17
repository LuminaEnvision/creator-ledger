# 🚨 DEPLOY EDGE FUNCTIONS NOW

## Current Status: BROKEN ❌

All Edge Functions are returning 401 errors because **the new code hasn't been deployed yet**.

### What's Broken:
- ❌ Wallet authentication (401 from `auth-with-wallet`)
- ❌ Entry submission (requires auth, which is failing)
- ❌ Viewing past entries (401 from `get-entries`)
- ❌ All authenticated operations

### Root Cause:
The Edge Functions in your Supabase project are still running **old code** that:
- Uses `.toLowerCase()` for signature verification (should use `getAddress()`)
- Returns 401 for public reads (should return 200 with empty data)
- Uses capitalized verification status (should use lowercase)

## ✅ FIX: Deploy Edge Functions

### Step 1: Navigate to Project
```bash
cd creator-ledger
```

### Step 2: Deploy Critical Functions First
```bash
# These are the most critical - deploy these first
supabase functions deploy auth-with-wallet
supabase functions deploy get-entries
supabase functions deploy create-entry
```

### Step 3: Deploy Remaining Functions
```bash
# Deploy all other functions
supabase functions deploy get-profile
supabase functions deploy update-entry
supabase functions deploy get-user
supabase functions deploy create-user
supabase functions deploy update-user
supabase functions deploy update-profile
supabase functions deploy vote-entry
supabase functions deploy get-notifications
supabase functions deploy mark-notification-read
supabase functions deploy subscribe-notifications
supabase functions deploy admin-get-entries
supabase functions deploy admin-verify-entry
supabase functions deploy admin-reject-entry
```

### OR: Use Deployment Script
```bash
./scripts/deploy-edge-functions.sh
```

## 🔍 Verify Environment Variables

Before deploying, ensure these are set in **Supabase Dashboard → Edge Functions → Secrets**:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Add/Verify these secrets:
   - `PROJECT_URL`: Your Supabase project URL (e.g., `https://pdvqegojzgipuoxruhzm.supabase.co`)
   - `SERVICE_ROLE_KEY`: Your Supabase service role key (from Project Settings → API)

## ✅ After Deployment - Test These:

1. **Public Profile View** (no auth needed):
   - Visit a public profile URL
   - Should see entries (or empty list, not 401 error)

2. **Wallet Authentication**:
   - Connect wallet
   - Should prompt for signature
   - Should succeed (not 401)

3. **Entry Submission**:
   - Submit a new entry
   - Should work after authentication succeeds

4. **View Past Entries**:
   - Dashboard should show your entries
   - Should not show "0 entries" when you have entries

## 🐛 If Deployment Fails

### Check Supabase CLI:
```bash
supabase --version
# Should be v1.x or higher
```

### Check Authentication:
```bash
supabase login
```

### Check Project Link:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## 📊 Monitor Deployment

After deployment, check Edge Function logs:
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
2. Click on a function (e.g., `auth-with-wallet`)
3. Check "Logs" tab for errors

## ⚠️ Note: Base RPC Rate Limiting

The `429 (Too Many Requests)` errors from `mainnet.base.org` are a **separate issue**:
- Your app is making too many RPC calls to Base
- This is likely from `PassportMintButton` reading contract data
- This won't block entry submission, but may cause UI delays
- Consider adding request throttling or caching

## 🎯 Expected Results After Deployment

✅ `auth-with-wallet`: Returns 200 with JWT token (not 401)  
✅ `get-entries`: Returns 200 with entries (or empty array, not 401)  
✅ `create-entry`: Returns 200 with created entry (not 401)  
✅ Signature verification: Works correctly with checksum addresses  
✅ Verification status: Stored in lowercase ('verified', not 'Verified')

---

**Deploy now to fix all authentication and data retrieval issues!**

