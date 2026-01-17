# Edge Functions Deployment Checklist

## ✅ Deployment Status

All Edge Functions have been successfully deployed to project `pdvqegojzgipuoxruhzm`.

### Deployed Functions:
- ✅ `get-user` - Get current user data
- ✅ `create-user` - Create new user
- ✅ `update-user` - Update user (premium, subscription)
- ✅ `create-entry` - Create new ledger entry
- ✅ `get-entries` - Get entries (supports filtering)
- ✅ `update-entry` - Update ledger entry
- ✅ `get-profile` - Get user profile
- ✅ `update-profile` - Update user profile
- ✅ `vote-entry` - Vote on entry (endorse/dispute)
- ✅ `get-endorsements` - Get entry endorsements
- ✅ `get-notifications` - Get user notifications
- ✅ `mark-notification-read` - Mark notification as read
- ✅ `subscribe-notifications` - Real-time notifications (SSE)
- ✅ `admin-get-entries` - Get all entries (admin only)
- ✅ `admin-verify-entry` - Verify entry (admin only)
- ✅ `admin-reject-entry` - Reject entry (admin only)
- ✅ `auth-with-wallet` - Wallet-based authentication

## 🔐 Critical: Environment Variables

**MUST be set in Supabase Dashboard** (not in Vercel):

1. Go to: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/functions
2. Click **Settings** (or go to Edge Functions → Settings)
3. Add these secrets:

   | Variable Name | Value | Where to Find |
   |--------------|-------|---------------|
   | `PROJECT_URL` | `https://pdvqegojzgipuoxruhzm.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
   | `SERVICE_ROLE_KEY` | `eyJ...` (long JWT) | Supabase Dashboard → Settings → API → service_role key |

⚠️ **Important**: 
- These are server-side secrets
- Never commit these to git
- Never add to Vercel environment variables
- Supabase doesn't allow "supabase" in variable names, so we use `PROJECT_URL` instead of `SUPABASE_URL`

## 🧪 Testing Checklist

After setting environment variables, test these:

### 1. Authentication
- [ ] Connect wallet
- [ ] Sign authentication message
- [ ] Check browser console for auth errors
- [ ] Verify token is stored in localStorage

### 2. View Entries
- [ ] Open Dashboard
- [ ] Check if old entries appear
- [ ] Check browser console for errors
- [ ] Verify `get-entries` function is called successfully

### 3. Submit Entry
- [ ] Fill out entry form
- [ ] Submit entry
- [ ] Check for success message
- [ ] Verify entry appears in list
- [ ] Check browser console for errors

### 4. Admin Functions (if admin)
- [ ] Access admin dashboard
- [ ] View all entries
- [ ] Verify/reject entries
- [ ] Check notifications

## 🔍 Troubleshooting

### If entries don't show:
1. Check browser console for errors
2. Check Edge Function logs: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/functions
3. Verify `PROJECT_URL` and `SERVICE_ROLE_KEY` are set correctly
4. Check that RLS is enabled with NO policies

### If submission fails:
1. Check authentication - make sure you signed the message
2. Check Edge Function logs for `create-entry`
3. Verify token is being sent (check Network tab → Headers → Authorization)
4. Check that `auth-with-wallet` function is working

### If you see CORS errors:
1. All Edge Functions should handle CORS (already deployed)
2. Check that OPTIONS requests return 204
3. Verify Edge Functions are deployed (they are ✅)

## 📊 Monitoring

- **Edge Function Logs**: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/functions
- **Database**: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/editor
- **Auth Users**: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/auth/users

## 🚀 Next Steps

1. ✅ **Set environment variables** in Supabase Dashboard (CRITICAL!)
2. ✅ **Test authentication** - connect wallet and sign message
3. ✅ **Test entry submission** - create a new entry
4. ✅ **Verify old entries appear** - check Dashboard
5. ✅ **Test admin functions** (if applicable)

---

**Status**: All functions deployed ✅  
**Next**: Set environment variables and test!

