# Security Implementation Guide

This guide provides step-by-step instructions for implementing the security improvements identified in `SECURITY_CHECKLIST.md`.

## 🚨 Priority 1: Critical Fixes

### 1. Update Node.js to v22.22.0+

**Why**: Security vulnerability in Node.js v22.12.0 (async_hooks DoS)

**Steps**:
```bash
# Check current version
node --version

# Update using nvm
nvm install 22.22.0
nvm use 22.22.0
nvm alias default 22.22.0

# Verify
node --version  # Should show v22.22.0 or higher
```

**Production**: If deploying to VPS, update Node.js there as well.

---

### 2. Implement Rate Limiting

**Status**: ✅ Utility created (`supabase/functions/_shared/rateLimit.ts`)

**Implementation Steps**:

1. **Update Edge Functions** to use rate limiting:
   - ✅ `create-entry` - Updated
   - ⚠️ `vote-entry` - Needs update
   - ⚠️ `update-entry` - Needs update
   - ⚠️ `update-profile` - Needs update
   - ⚠️ `auth-with-wallet` - Needs update

2. **Example usage** (already added to `create-entry`):
```typescript
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'

// After authentication
const rateLimitId = getRateLimitIdentifier(req, walletAddress)
const rateLimit = checkRateLimit({
  ...RATE_LIMITS.CREATE_ENTRY,
  identifier: rateLimitId
})

if (!rateLimit.allowed) {
  return rateLimitResponse(rateLimit.resetAt)
}
```

3. **For production**: Consider using Upstash Redis for distributed rate limiting across Edge Function instances.

---

### 3. Strengthen Input Validation

**Status**: ✅ Utility created (`supabase/functions/_shared/validation.ts`)

**Implementation Steps**:

1. **Update Edge Functions** to use validation:
   - ✅ `create-entry` - Updated
   - ⚠️ `vote-entry` - Needs update
   - ⚠️ `update-entry` - Needs update
   - ⚠️ `update-profile` - Needs update

2. **Example usage** (already added to `create-entry`):
```typescript
import { validateCreateEntryPayload } from '../_shared/validation.ts'

// After parsing body
const validation = validateCreateEntryPayload(body)
if (!validation.valid) {
  return errorResponse(validation.error || 'Invalid input', 400)
}
```

3. **Additional validations to add**:
   - URL format validation (already in utility)
   - String length limits (already in utility)
   - JSON depth validation (already in utility)
   - Image URL validation (already in utility)

---

### 4. Fix CORS Wildcard

**Status**: ✅ Updated (`supabase/functions/_shared/auth.ts`)

**Implementation Steps**:

1. **Set environment variable in Supabase Dashboard**:
   - Go to: Project Settings → Edge Functions → Environment Variables
   - Add: `ALLOWED_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com`
   - Replace with your actual domain(s)

2. **Redeploy Edge Functions**:
   ```bash
   supabase functions deploy create-entry
   supabase functions deploy vote-entry
   # ... deploy all functions
   ```

3. **Verify**: Check that CORS headers use specific origin, not wildcard

**Note**: Currently falls back to `*` if `ALLOWED_ORIGINS` is not set. This is for development only. **Remove wildcard fallback before mainnet launch.**

---

## 🚨 Priority 2: Before Mainnet

### 5. Configure Security Headers

**Location**: Depends on deployment platform

#### Option A: Vercel/Netlify

**Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Netlify** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

#### Option B: VPS with Nginx

**Nginx config** (`/etc/nginx/sites-available/creator-ledger`):
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ... rest of config
}
```

---

### 6. Configure Content Security Policy (CSP)

**Add to security headers** (same location as above):

**Vercel** (`vercel.json`):
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' https: data: blob: ipfs.io gateway.pinata.cloud; connect-src 'self' https://*.supabase.co https://base-sepolia.infura.io https://mainnet.base.org wss://*.walletconnect.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'"
}
```

**Netlify** (`netlify.toml`):
```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' https: data: blob: ipfs.io gateway.pinata.cloud; connect-src 'self' https://*.supabase.co https://base-sepolia.infura.io https://mainnet.base.org wss://*.walletconnect.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'"
```

**Nginx**:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' https: data: blob: ipfs.io gateway.pinata.cloud; connect-src 'self' https://*.supabase.co https://base-sepolia.infura.io https://mainnet.base.org wss://*.walletconnect.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'" always;
```

---

### 7. Update Dependencies

**Steps**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Update packages (review breaking changes)
npm update

# For major version updates, check changelogs
npm outdated
```

**Review**: Check for breaking changes before updating major versions.

---

## 📋 Implementation Checklist

### Immediate (Priority 1):
- [ ] Update Node.js to v22.22.0+
- [ ] Add rate limiting to all Edge Functions
- [ ] Add input validation to all Edge Functions
- [ ] Set `ALLOWED_ORIGINS` in Supabase Dashboard
- [ ] Redeploy all Edge Functions
- [ ] Remove CORS wildcard fallback (after setting environment variable)

### Before Mainnet (Priority 2):
- [ ] Configure security headers (HSTS, CSP, etc.)
- [ ] Update dependencies (`npm audit fix`)
- [ ] Test rate limiting in production
- [ ] Test input validation with edge cases
- [ ] Verify CORS is working with specific origins
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Configure monitoring and alerting

### Improvements (Priority 3):
- [ ] Add comprehensive tests
- [ ] Set up CI/CD security checks
- [ ] Document backup and recovery procedures
- [ ] Review and audit smart contracts

---

## 🔍 Testing

### Test Rate Limiting:
```bash
# Make 21 requests in quick succession (limit is 20/minute)
for i in {1..21}; do
  curl -X POST https://your-project.supabase.co/functions/v1/create-entry \
    -H "Authorization: Bearer $TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","platform":"test","payload_hash":"abc123"}'
  echo "Request $i"
done

# 21st request should return 429
```

### Test Input Validation:
```bash
# Test with invalid URL
curl -X POST https://your-project.supabase.co/functions/v1/create-entry \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"not-a-url","platform":"test","payload_hash":"abc123"}'

# Should return 400 with validation error
```

### Test CORS:
```bash
# Test from allowed origin
curl -H "Origin: https://yourdomain.com" \
  https://your-project.supabase.co/functions/v1/get-entries

# Check response headers for Access-Control-Allow-Origin
```

---

## 📚 References

- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) - Complete security checklist
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Node.js Security Release](https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)

---

**Last Updated**: January 17, 2026

