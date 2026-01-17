# Why We Still Need VITE_SUPABASE_ANON_KEY

## Quick Answer

**Keep `VITE_SUPABASE_ANON_KEY` in Vercel** - it's still needed for storage uploads.

## Why It's Still Needed

### Current Architecture

After migrating to Edge Functions:
- ✅ **Database operations**: All go through Edge Functions (no anon key needed)
- ✅ **Storage operations**: Still use direct Supabase client (anon key needed)

### Storage Usage

The anon key is used for:
1. **Profile image uploads** (`CustomizeProfileForm.tsx`)
2. **Custom entry image uploads** (`CreateEntryForm.tsx`)

These operations use:
```typescript
supabase.storage
  .from('profile-images')
  .upload(path, file, { ... })
```

## Why This Is Safe

### 1. Anon Key is Public by Design
- The anon key is **meant to be public** (exposed in client-side code)
- It's not a secret - it's designed to be in your frontend bundle
- Security comes from RLS policies, not key secrecy

### 2. Storage Has RLS Policies
- Storage bucket has Row-Level Security enabled
- Policies control who can upload/read/delete
- Anon key alone doesn't grant unlimited access

### 3. Database is Protected
- Database RLS is enabled with **no policies**
- Only Edge Functions (using service role key) can access database
- Anon key cannot access database directly

## Could We Remove It?

**Future improvement**: Move storage uploads to Edge Functions

This would allow removing the anon key, but requires:
1. Creating `upload-image` Edge Function
2. Handling file uploads in Edge Function (multipart/form-data)
3. Updating frontend to call Edge Function instead of direct storage

**Current status**: Storage uploads via Edge Functions is not implemented yet.

## What to Set in Vercel

✅ **Keep these in Vercel**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` ← Still needed for storage
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_NEYNAR_API_KEY` (optional)

❌ **Don't set in Vercel**:
- `SERVICE_ROLE_KEY` → Supabase Dashboard only
- `PROJECT_URL` (for Edge Functions) → Supabase Dashboard only
- `PRIVATE_KEY` → Local only, never in Vercel

## Summary

| Variable | Location | Why |
|----------|----------|-----|
| `VITE_SUPABASE_ANON_KEY` | Vercel | Storage uploads (profile images) |
| `SERVICE_ROLE_KEY` | Supabase Dashboard | Edge Functions only |
| `PROJECT_URL` | Supabase Dashboard | Edge Functions only |

**Bottom line**: Keep the anon key in Vercel for now. It's safe and necessary for storage operations.

