# Edge Function Debugging Steps

Follow these steps to diagnose why data isn't showing.

## STEP 1 — PROVE THE EDGE FUNCTION IS EVEN RUNNING

✅ **Added**: `console.log("🔥 get-entries called")` at the very top

**Test**:
1. Redeploy: `supabase functions deploy get-entries`
2. Open your app
3. Trigger `getEntries()` (view dashboard or public profile)
4. Go to **Supabase Dashboard** → **Edge Functions** → **Logs**

**Expected**: You see `🔥 get-entries called`

**If you don't see it**:
- Frontend is calling wrong project
- Wrong URL (`VITE_SUPABASE_URL` mismatch)
- Wrong function name
- Function not deployed

➡️ **Stop here if this fails** — nothing else matters yet.

## STEP 2 — LOG THE DATABASE QUERY RESULT

✅ **Added**: Direct test query with service role (bypasses RLS)

**What it logs**:
- `DB RESULT (test query)`: Simple query with no filters
- `DB RESULT (actual query)`: Your actual filtered query

**Expected**:
- `dataCount > 0` → Data exists
- `error: null` → Query succeeded

**If `data: []`**:
- Wrong table name
- Wrong schema
- Wrong project (most common!)

**If `error`**:
- RLS enabled incorrectly (but service role should bypass)
- Wrong service role key
- Wrong Supabase client initialization

⚠️ **Service role ignores RLS**. If this returns empty → this is NOT auth-related.

## STEP 3 — VERIFY SERVICE ROLE KEY

✅ **Added**: `ENV CHECK` log

**What it shows**:
- `hasUrl`: Is `PROJECT_URL` set?
- `hasServiceKey`: Is `SERVICE_ROLE_KEY` set?

**If `hasServiceKey: false`**:
- That's your bug!
- No DB access = empty results, no errors

**Fix**:
1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Add: `SERVICE_ROLE_KEY` = Your service role key
3. Must be exact name: `SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`)

## STEP 4 — CONFIRM PROJECT MISMATCH

✅ **Added**: URL logging in both frontend and Edge Function

**Frontend logs**: `FRONTEND SUPABASE URL`
**Edge Function logs**: `EDGE SUPABASE URL`

**If they differ**:
- You're calling Edge Functions in Project A
- Querying DB in Project B
- This EXACTLY produces "Old data is gone"

**Common causes**:
- Project was cloned
- Env files copied from different project
- Preview project created
- Wrong `.env.local` file

**Fix**: Make sure `VITE_SUPABASE_URL` matches your actual database project.

## STEP 5 — TEMPORARILY REMOVE ALL AUTH LOGIC

**For debugging only**, you can comment out auth:

```typescript
// Temporarily disable auth for testing
// const walletAddress = null
// const isOwnProfile = false
```

**If data now appears** → Auth/RLS logic is wrong
**If data still empty** → Infrastructure/env issue

This isolates auth vs infra in 30 seconds.

## STEP 6 — VERIFY TABLE & SCHEMA

✅ **Added**: Test query with explicit schema `public.ledger_entries`

**What it shows**:
- `DB RESULT (explicit schema)`: Query with `public.` prefix

**If explicit schema works but default doesn't**:
- Schema mismatch issue
- Need to specify `public.` prefix

## What to Look For in Logs

After triggering `getEntries()`, check Supabase Dashboard → Edge Functions → Logs:

### ✅ Success Pattern:
```
🔥 get-entries called
ENV CHECK: { hasUrl: true, hasServiceKey: true }
EDGE SUPABASE URL: https://xxxxx.supabase.co
DB RESULT (test query): { dataCount: 5, hasData: true, error: null }
DB RESULT (actual query): { dataCount: 10, hasData: true, error: null }
✅ Entries fetched successfully: { count: 10 }
```

### ❌ Failure Patterns:

**Pattern 1: Function not running**
```
(no logs at all)
```
→ Frontend not calling function or wrong URL

**Pattern 2: Missing service key**
```
🔥 get-entries called
ENV CHECK: { hasServiceKey: false }
DB RESULT: { error: "..." }
```
→ Set `SERVICE_ROLE_KEY` in Supabase Dashboard

**Pattern 3: Project mismatch**
```
🔥 get-entries called
EDGE SUPABASE URL: https://project-a.supabase.co
FRONTEND SUPABASE URL: https://project-b.supabase.co
DB RESULT: { dataCount: 0 }
```
→ URLs don't match, fix `VITE_SUPABASE_URL`

**Pattern 4: Wrong table/schema**
```
DB RESULT (test query): { error: "relation does not exist" }
```
→ Table name or schema is wrong

## Next Steps

After running these steps, you'll know exactly where the issue is:

1. **Function not running** → Fix frontend URL/function name
2. **Missing service key** → Set in Supabase Dashboard
3. **Project mismatch** → Fix `VITE_SUPABASE_URL`
4. **Empty data** → Check table name, schema, or data exists
5. **Auth issues** → Check auth logic (if test query works but actual doesn't)

## Most Likely Root Causes (Ranked)

1. 🥇 **Project mismatch** (90% probability)
2. 🥈 **Missing/wrong SERVICE_ROLE_KEY** (80% probability)
3. 🥉 **Edge Functions querying empty project** (70% probability)

## After Debugging

Once you identify the issue:
1. Fix it
2. Remove excessive debug logs (keep essential ones)
3. Redeploy Edge Functions

