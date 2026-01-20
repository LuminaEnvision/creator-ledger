# 🚨 URGENT: CORS Fix Required

## Problem
Your production site (`https://creator-ledger-five.vercel.app`) is being blocked by CORS because the Edge Functions are returning `http://localhost:5173` instead of your production URL.

## Quick Fix (5 minutes)

### Step 1: Set Environment Variable in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **Edge Functions** → **Environment Variables**
4. Add new variable:
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: `https://creator-ledger-five.vercel.app,http://localhost:5173`
5. Click **Save**

### Step 2: Redeploy Edge Functions

Run these commands:

```bash
cd creator-ledger
supabase functions deploy get-entries
supabase functions deploy get-profile
supabase functions deploy auth-with-wallet
supabase functions deploy create-entry
supabase functions deploy vote-entry
supabase functions deploy update-entry
supabase functions deploy update-profile
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Step 3: Test

1. Open your production site: `https://creator-ledger-five.vercel.app`
2. Check browser console - CORS errors should be gone
3. Try to view your submissions - should work now

## What Changed

✅ Updated CORS function to check request origin against allowed list  
✅ Updated all Edge Functions to pass request to CORS function  
✅ Now properly matches production URL instead of hardcoded localhost

## Full Documentation

See `docs/CORS_SETUP.md` for detailed information.

