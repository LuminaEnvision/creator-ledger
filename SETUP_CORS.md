# Quick CORS Setup (2 Minutes)

## ⚠️ Required: Set ALLOWED_ORIGINS

Your Edge Functions are deployed but need the CORS environment variable set.

### Steps:

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/pdvqegojzgipuoxruhzm/settings/functions

2. **Add Environment Variable**:
   - Click "Environment Variables" or "Secrets"
   - Click "Add new secret" or "+"
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: `http://localhost:5173`
   - Click "Save"

3. **Done!** ✅

### For Production (Later):

When you deploy to production, update the value to:
```
https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173
```

Replace `yourdomain.com` with your actual production domain.

---

**Why**: Currently using wildcard `*` fallback (insecure). Setting this restricts CORS to your domains only.

