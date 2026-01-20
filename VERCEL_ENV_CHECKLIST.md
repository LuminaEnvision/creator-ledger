# Vercel Environment Variables Checklist

## ✅ What to Add to Vercel

### Required Variables:

1. **VITE_SUPABASE_URL**
   - Value: `https://pdvqegojzgipuoxruhzm.supabase.co`
   - Where to get: Supabase Dashboard → Settings → API → Project URL
   - Safe: ✅ Yes (public, bundled in client)

2. **VITE_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key
   - Where to get: Supabase Dashboard → Settings → API → anon/public key
   - Safe: ✅ Yes (public, meant to be exposed)

3. **VITE_WALLETCONNECT_PROJECT_ID**
   - Value: Your WalletConnect project ID
   - Where to get: https://cloud.walletconnect.com/
   - Safe: ✅ Yes (public, meant to be exposed)

### Optional Variables:

4. **VITE_NEYNAR_API_KEY** (if using Farcaster)
   - Value: Your Neynar API key
   - Where to get: https://neynar.com/
   - Safe: ✅ Yes (public, but can be rate-limited)

---

## ❌ What NOT to Add to Vercel

### Never Add These:

- ❌ `PRIVATE_KEY` - Local only, for contract deployment
- ❌ `SERVICE_ROLE_KEY` - Supabase Dashboard only
- ❌ `PROJECT_URL` - Supabase Dashboard only (for Edge Functions)
- ❌ `ALLOWED_ORIGINS` - Supabase Dashboard only
- ❌ Any other secrets or private keys

---

## 📋 Quick Setup Steps

1. **Go to Vercel Dashboard**:
   - https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables**:
   - Settings → Environment Variables

3. **Add Each Variable**:
   - Click "Add New"
   - Add each variable from the "✅ What to Add" list above
   - Select environments: **Production** and **Preview**

4. **Verify**:
   - Only `VITE_*` variables should be present
   - No `PRIVATE_KEY` or other secrets

5. **Redeploy**:
   - Go to Deployments
   - Redeploy to apply new variables

---

## 🚨 If You See These in Vercel, DELETE Them:

- `PRIVATE_KEY` ❌
- `SERVICE_ROLE_KEY` ❌
- `PROJECT_URL` ❌
- Any variable without `VITE_` prefix ❌

---

**See**: `docs/VERCEL_ENV_VARIABLES.md` for detailed explanation

