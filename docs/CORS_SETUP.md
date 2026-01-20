# CORS Configuration Guide

## Overview

CORS (Cross-Origin Resource Sharing) headers control which origins can access your Edge Functions. For security, we should **never use wildcard `*` in production**.

## Current Status

✅ **Code Updated**: Edge Functions now use `ALLOWED_ORIGINS` environment variable  
⚠️ **Needs Configuration**: Set environment variable in Supabase Dashboard

## Setup Instructions

### Step 1: Determine Your Allowed Origins

List all domains that should be able to access your Edge Functions:

- Production domain: `https://yourdomain.com`
- WWW variant: `https://www.yourdomain.com`
- Development/staging: `https://staging.yourdomain.com` (if applicable)
- Local development: `http://localhost:5173` (for local testing)

**Example**:
```
https://creatorledger.com,https://www.creatorledger.com,http://localhost:5173
```

### Step 2: Set Environment Variable in Supabase

1. **Go to Supabase Dashboard**:
   - Navigate to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open Edge Functions Settings**:
   - Go to: **Project Settings** → **Edge Functions** → **Environment Variables**

3. **Add Environment Variable**:
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: Comma-separated list of allowed origins
   - **Example**: `https://creatorledger.com,https://www.creatorledger.com,http://localhost:5173`

4. **Save Changes**

### Step 3: Redeploy Edge Functions

After setting the environment variable, redeploy all Edge Functions:

```bash
# Deploy all functions
supabase functions deploy create-entry
supabase functions deploy vote-entry
supabase functions deploy update-entry
supabase functions deploy update-profile
supabase functions deploy get-entries
supabase functions deploy get-profile
supabase functions deploy auth-with-wallet
supabase functions deploy get-user
supabase functions deploy create-user
supabase functions deploy update-user
supabase functions deploy get-notifications
supabase functions deploy mark-notification-read
supabase functions deploy subscribe-notifications
supabase functions deploy get-endorsements
supabase functions deploy admin-get-entries
supabase functions deploy admin-verify-entry
supabase functions deploy admin-reject-entry

# Or deploy all at once (if supported)
supabase functions deploy
```

### Step 4: Verify CORS Configuration

Test that CORS is working correctly:

```bash
# Test from allowed origin
curl -H "Origin: https://yourdomain.com" \
  -H "apikey: YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/get-entries

# Check response headers
# Should see: Access-Control-Allow-Origin: https://yourdomain.com
```

**Expected Response Headers**:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
```

### Step 5: Test from Browser

1. Open browser console on your domain
2. Make a request to an Edge Function:
   ```javascript
   fetch('https://YOUR_PROJECT.supabase.co/functions/v1/get-entries', {
     headers: {
       'apikey': 'YOUR_ANON_KEY'
     }
   })
   .then(r => r.json())
   .then(console.log)
   ```
3. Should work without CORS errors

## Current Implementation

The CORS headers are configured in `supabase/functions/_shared/auth.ts`:

```typescript
export function corsHeaders() {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')
  
  // Use first origin from comma-separated list
  const origin = allowedOrigins 
    ? allowedOrigins.split(',')[0].trim()
    : '*' // Fallback for development (REMOVE IN PRODUCTION)
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  }
}
```

## Development vs Production

### Development
- Can use `http://localhost:5173` in `ALLOWED_ORIGINS`
- Wildcard fallback (`*`) is acceptable for local testing only

### Production
- **MUST** set `ALLOWED_ORIGINS` with specific domains
- **MUST NOT** use wildcard `*`
- Only include trusted domains

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause**: Environment variable not set or Edge Functions not redeployed

**Fix**:
1. Verify `ALLOWED_ORIGINS` is set in Supabase Dashboard
2. Redeploy Edge Functions
3. Check that your origin matches exactly (including protocol and trailing slash)

### CORS Error: "Origin not allowed"

**Cause**: Your domain is not in the `ALLOWED_ORIGINS` list

**Fix**:
1. Add your domain to `ALLOWED_ORIGINS` in Supabase Dashboard
2. Redeploy Edge Functions
3. Verify domain matches exactly (case-sensitive, protocol matters)

### Still Using Wildcard

**Cause**: Environment variable not set, so fallback to `*` is used

**Fix**:
1. Set `ALLOWED_ORIGINS` in Supabase Dashboard
2. Redeploy Edge Functions
3. Verify in response headers that specific origin is used

## Security Best Practices

1. ✅ **Never use wildcard in production**
2. ✅ **Only include trusted domains**
3. ✅ **Use HTTPS for production domains**
4. ✅ **Remove localhost from production environment**
5. ✅ **Regularly review allowed origins**

## Multiple Origins Support

Currently, the implementation uses the first origin from the comma-separated list. For full multi-origin support, you would need to:

1. Check the `Origin` header in the request
2. Match it against the `ALLOWED_ORIGINS` list
3. Return the matching origin in the response

This can be added as a future enhancement if needed.

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OWASP: CORS Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#cross-origin-resource-sharing)

---

**Last Updated**: January 17, 2026  
**Priority**: ⚠️ **HIGH** - Configure before mainnet launch

