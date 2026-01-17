# 🚨 URGENT: Deploy Edge Functions

## Critical Issues Fixed (Need Deployment)

### 1. Public Read Authentication
- **Issue**: `get-entries` was returning 401 for public reads
- **Fix**: Updated error handling to return empty entries (200) instead of 401 for public requests
- **File**: `supabase/functions/get-entries/index.ts`

### 2. Signature Verification
- **Issue**: Enhanced logging and error handling for signature verification
- **Fix**: Better error messages and logging to debug signature failures
- **File**: `supabase/functions/auth-with-wallet/index.ts`

### 3. Verification Status Case
- **Issue**: Edge Functions using capitalized status values
- **Fix**: All Edge Functions now use lowercase ('verified', 'unverified', 'rejected')
- **Files**: 
  - `supabase/functions/get-entries/index.ts`
  - `supabase/functions/create-entry/index.ts`
  - `supabase/functions/admin-verify-entry/index.ts`
  - `supabase/functions/admin-reject-entry/index.ts`

## Deployment Steps

```bash
cd creator-ledger

# Deploy all Edge Functions
supabase functions deploy get-entries
supabase functions deploy auth-with-wallet
supabase functions deploy create-entry
supabase functions deploy admin-verify-entry
supabase functions deploy admin-reject-entry
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
supabase functions deploy admin-reject-entry
```

Or use the deployment script:
```bash
./scripts/deploy-edge-functions.sh
```

## After Deployment

1. **Test public reads**: Should work without authentication
2. **Test authentication**: Wallet signing should work
3. **Test entry creation**: Should use lowercase verification status
4. **Check Edge Function logs**: Look for signature verification details

## Environment Variables

Make sure these are set in Supabase Dashboard → Edge Functions → Secrets:
- `PROJECT_URL`: Your Supabase project URL
- `SERVICE_ROLE_KEY`: Your Supabase service role key

## Verification

After deployment, check:
- ✅ Public `get-entries` calls return 200 (not 401)
- ✅ Wallet authentication works
- ✅ New entries have lowercase verification_status
- ✅ Admin verify/reject uses lowercase status

