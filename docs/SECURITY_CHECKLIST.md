# Security & Best Practices Checklist - Creator Ledger

This document contains all security rules, best practices, and implementation requirements for the Creator Ledger production deployment on Base.

## 🔒 Security Requirements

### 1. Node.js Security Update ⚠️ **URGENT**
- **Current Version**: v22.12.0 ❌ **VULNERABLE**
- **Required Version**: v22.22.0+ ✅
- **Issue**: [Node.js January 2026 async_hooks DoS vulnerability](https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks)
- **Impact**: Affects applications using AsyncLocalStorage (request context tracking)
- **Action Required**:
  ```bash
  # Local development
  nvm install 22.22.0
  nvm use 22.22.0
  nvm alias default 22.22.0
  
  # Production (if using VPS)
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  node --version  # Verify v22.22.0+
  ```
- **Deadline**: Before next production deployment

### 2. Rate Limiting ⚠️ **MISSING**
- **Implementation**: Rate limiting on Supabase Edge Functions
- **Location**: `supabase/functions/*/index.ts`
- **Requirements**:
  - ⚠️ Rate limits needed for:
    - `/functions/v1/create-entry`: 20 requests/minute per user
    - `/functions/v1/vote-entry`: 10 requests/minute per user
    - `/functions/v1/auth-with-wallet`: 5 requests/minute per IP
    - `/functions/v1/get-entries`: 100 requests/minute per IP (public)
    - `/functions/v1/get-profile`: 100 requests/minute per IP (public)
    - General Edge Functions: 60 requests/minute per authenticated user
  - ⚠️ Use Supabase Edge Function rate limiting or implement with Redis/Upstash
  - ⚠️ Return `429 Too Many Requests` with `Retry-After` header
- **Action Required**: 
  - Option 1: Use Supabase's built-in rate limiting (if available)
  - Option 2: Implement rate limiting utility in `supabase/functions/_shared/rateLimit.ts`
  - Option 3: Use Upstash Redis for distributed rate limiting
- **Priority**: High
- **Files to Create**:
  - `supabase/functions/_shared/rateLimit.ts`

### 3. Input Validation ⚠️ **PARTIAL**
- **Implementation**: Frontend and Edge Function validation
- **Current Status**:
  - ✅ Frontend form validation (CreateEntryForm.tsx)
  - ⚠️ Edge Function validation needs improvement
  - ⚠️ URL validation (max length, format, protocol)
  - ⚠️ String length limits (description, campaign_tag)
  - ⚠️ JSON depth validation (max 32 levels) - Prevents DoS
  - ⚠️ Image URL validation (format, size limits)
  - ⚠️ Wallet address validation (checksum, format)
- **Files to Check**:
  - `src/components/CreateEntryForm.tsx` - Frontend validation ✅
  - `supabase/functions/create-entry/index.ts` - Backend validation ⚠️
  - `supabase/functions/vote-entry/index.ts` - Backend validation ⚠️
  - `supabase/functions/update-entry/index.ts` - Backend validation ⚠️
- **Action Required**: 
  - Create validation utility: `supabase/functions/_shared/validation.ts`
  - Add comprehensive validation to all Edge Functions
- **Priority**: High

### 4. API Keys Security ✅
- **Implementation**: Environment variables
- **Requirements**:
  - ✅ Server-side keys use `Deno.env.get()` (Edge Functions)
  - ✅ Client-side public keys use `VITE_*` prefix
  - ✅ `.env.local` in `.gitignore` ✅
  - ✅ Never commit API keys to repository ✅
- **Current Keys**:
  - `VITE_SUPABASE_URL` ✅ Public (required for frontend)
  - `VITE_SUPABASE_ANON_KEY` ✅ Public (required for frontend)
  - `SERVICE_ROLE_KEY` ✅ Server-side (Edge Functions only)
  - `PROJECT_URL` ✅ Server-side (Edge Functions only)
- **Files to Check**:
  - `.env.local` - Local environment (should not exist in repo) ✅
  - Supabase Dashboard - Production environment variables
- **Action Required**: Verify no secrets in frontend code

### 5. CORS Security ⚠️ **NEEDS REVIEW**
- **Implementation**: Edge Functions CORS headers
- **Current Status**: Using wildcard `*` ❌
- **Requirements**:
  - ⚠️ No wildcard `*` in production
  - ⚠️ Only trusted origins allowed
  - ⚠️ Configure allowed origins from environment variable
- **Files to Check**:
  - `supabase/functions/_shared/auth.ts` - `corsHeaders()` function
  - All Edge Functions using `corsHeaders()`
- **Current Code**:
  ```typescript
  // ❌ CURRENT (INSECURE):
  'Access-Control-Allow-Origin': '*',
  
  // ✅ SHOULD BE:
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS')?.split(',')[0] || 'https://yourdomain.com',
  ```
- **Action Required**: 
  - Create environment variable `ALLOWED_ORIGINS` in Supabase Dashboard
  - Update `corsHeaders()` to use environment variable
  - Support multiple origins (comma-separated)
- **Priority**: High (before mainnet launch)

### 6. Security Headers ⚠️ **MISSING**
- **Implementation**: Vite build configuration
- **Location**: `vite.config.ts` or deployment server (Nginx/Vercel/Netlify)
- **Required Headers**:
  - ⚠️ `Strict-Transport-Security` (HSTS): `max-age=31536000; includeSubDomains`
  - ⚠️ `X-Content-Type-Options`: `nosniff`
  - ⚠️ `X-Frame-Options`: `DENY`
  - ⚠️ `Referrer-Policy`: `strict-origin-when-cross-origin`
  - ⚠️ `Permissions-Policy`: Restrict APIs (camera=(), microphone=(), geolocation=())
- **Action Required**: 
  - If using Vercel/Netlify: Configure in platform settings
  - If using VPS: Configure in Nginx/Apache
  - If using Vite preview: Add headers via plugin or middleware
- **Priority**: Medium

### 7. Content Security Policy (CSP) ⚠️ **MISSING**
- **Implementation**: CSP headers
- **Location**: Deployment server configuration
- **Requirements**:
  - ⚠️ `default-src 'self'`
  - ⚠️ `script-src 'self' 'unsafe-eval' 'unsafe-inline'` (Vite requirement)
  - ⚠️ `img-src 'self' https: data: blob: ipfs.io gateway.pinata.cloud`
  - ⚠️ `connect-src 'self' https://*.supabase.co https://base-sepolia.infura.io https://mainnet.base.org wss://*.walletconnect.com`
  - ⚠️ `frame-ancestors 'none'`
  - ⚠️ `style-src 'self' 'unsafe-inline'` (Tailwind requirement)
- **Action Required**: Configure CSP in deployment platform
- **Priority**: Medium

### 8. HTTPS Enforcement ✅
- **Implementation**: Deployment platform (Vercel/Netlify/Supabase)
- **Requirements**:
  - ✅ SSL/TLS certificate (handled by platform)
  - ✅ HTTPS redirect (handled by platform)
  - ⚠️ HSTS header (see Security Headers above)
- **Current Status**: 
  - Supabase Edge Functions: HTTPS by default ✅
  - Frontend deployment: Depends on platform
- **Action Required**: Verify HTTPS is enforced on frontend deployment
- **Priority**: High (before mainnet launch)

### 9. Dependency Security ⚠️ **NEEDS UPDATES**
- **Implementation**: Regular updates
- **Requirements**:
  - ⚠️ Regular `npm audit` checks
  - ⚠️ Fix vulnerabilities (currently has low-severity issues)
  - ✅ Keep dependencies updated
- **Current Vulnerabilities**: 
  - Low-severity vulnerabilities in `@ethersproject/*` packages (via ethers)
  - These are transitive dependencies
- **Action Required**:
  ```bash
  npm audit fix
  npm update
  # Review breaking changes before updating major versions
  ```
- **Priority**: Medium

### 10. Wallet Connection Security ✅
- **Implementation**: RainbowKit + wagmi
- **Requirements**:
  - ✅ Secure WalletConnect integration
  - ✅ Proper chain validation (Base network)
  - ✅ Transaction signing verification
  - ✅ Address validation (checksum)
- **Files to Check**:
  - `src/lib/wagmi.ts` (if exists)
  - `src/lib/supabaseAuth.ts` - Wallet signature verification ✅
- **Status**: ✅ Properly implemented

## 🔐 Smart Contract Security

### 11. Contract Verification ✅
- **Requirements**:
  - ✅ All contracts verified on BaseScan
  - ✅ Contract addresses documented
  - ✅ ABI files committed to repository
- **Files to Check**:
  - `contracts/scripts/deployed_addresses.json` (if exists)
  - `src/lib/contracts.ts` - Contract addresses
- **Action Required**: Verify all contracts are verified on BaseScan

### 12. Private Key Management ✅
- **Requirements**:
  - ✅ Deployer private key in `.env` (never committed) ✅
  - ✅ Separate keys for testnet and mainnet
  - ✅ Hardware wallet for mainnet deployments (recommended)
- **Files to Check**:
  - `contracts/.env` - Should be in `.gitignore` ✅
  - `.gitignore` - Contains `.env*` ✅

### 13. Smart Contract Access Control ✅
- **Requirements**:
  - ✅ Role-based access control (admin role)
  - ✅ Owner-only functions protected
  - ✅ Upgradeable contract pattern (UUPS)
- **Files to Check**:
  - `contracts/contracts/CreatorPassport.sol`
  - Verify `onlyOwner` and `onlyAdmin` modifiers

## 🗄️ Database Security

### 14. Row Level Security (RLS) ✅
- **Implementation**: Supabase RLS policies
- **Current Status**: 
  - ✅ RLS enabled on all tables
  - ✅ NO policies (database closed - only Edge Functions can access)
  - ✅ Edge Functions use service role key
- **Architecture**: 
  - Frontend cannot access database directly
  - All access goes through Edge Functions
  - Edge Functions authenticate users via JWT
- **Status**: ✅ Properly implemented

### 15. SQL Injection Prevention ✅
- **Implementation**: Supabase client (parameterized queries)
- **Requirements**:
  - ✅ Use Supabase client methods (not raw SQL)
  - ✅ Parameterized queries (automatic with Supabase)
  - ✅ Input validation (see Input Validation above)
- **Status**: ✅ Supabase client handles this automatically

### 16. Database Backup ⚠️ **NEEDS CONFIGURATION**
- **Implementation**: Supabase automatic backups
- **Requirements**:
  - ⚠️ Verify Supabase backups are enabled
  - ⚠️ Test backup restoration process
  - ⚠️ Document backup retention policy
- **Action Required**: 
  - Check Supabase Dashboard → Database → Backups
  - Verify backup schedule and retention
- **Priority**: Medium

## 🚀 Performance & Reliability

### 17. Error Handling ✅
- **Requirements**:
  - ✅ Graceful RPC error handling
  - ✅ User-friendly error messages
  - ✅ Error logging in Edge Functions
  - ⚠️ Error tracking (Sentry/LogRocket) - Missing
- **Files to Check**:
  - `src/lib/edgeFunctions.ts` - Error handling ✅
  - `supabase/functions/_shared/auth.ts` - Error responses ✅
- **Action Required**: Consider adding error tracking service
- **Priority**: Low

### 18. Transaction Handling ✅
- **Requirements**:
  - ✅ Proper polling with timeout
  - ✅ Transaction confirmation
  - ✅ Retry logic for failed transactions
  - ✅ Contract simulation before execution ✅
- **Files to Check**:
  - `src/components/OnChainUpgradeModal.tsx` - Contract calls ✅
  - `src/lib/supabaseAuth.ts` - Message signing ✅

### 19. State Management ✅
- **Implementation**: React Query + Local State
- **Requirements**:
  - ✅ No centralized database (Supabase is backend)
  - ✅ On-chain state for NFT ownership
  - ✅ Optimistic updates where appropriate
- **Status**: ✅ Properly implemented

## 🔧 Code Quality

### 20. TypeScript & Linting ✅
- **Requirements**:
  - ✅ TypeScript strict mode
  - ✅ ESLint configured
  - ✅ No TypeScript errors in production build ✅
- **Files to Check**:
  - `tsconfig.json`
  - `eslint.config.js`
  - `package.json` (lint script)

### 21. Testing ⚠️ **MINIMAL**
- **Requirements**:
  - ⚠️ Unit tests for critical functions
  - ⚠️ Smart contract tests
  - ⚠️ Edge Function tests
  - ⚠️ E2E tests (Playwright)
- **Current Status**:
  - Some contract tests may exist
  - Frontend tests minimal
  - Edge Function tests missing
- **Action Required**: Add comprehensive tests
- **Priority**: Medium

## 📋 Production Deployment Checklist

### Before Mainnet Launch:
- [ ] Node.js updated to v22.22.0+ (both local and production)
- [ ] Rate limiting implemented on Edge Functions
- [ ] Input validation strengthened in Edge Functions
- [ ] CORS configured with specific origins (no wildcard)
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] All dependencies updated (`npm audit fix`)
- [ ] Smart contracts audited (if possible)
- [ ] Comprehensive testing completed
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery plan documented

### Supabase Configuration:
- [ ] Environment variables set in Supabase Dashboard:
  - `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
  - `PROJECT_URL` - Supabase project URL
  - `SERVICE_ROLE_KEY` - Service role key (auto-set)
  - `SUPABASE_ANON_KEY` - Anon key (auto-set)
- [ ] Database backups enabled and verified
- [ ] Edge Functions deployed with latest code
- [ ] Rate limiting configured (if using Supabase's built-in)
- [ ] CORS headers updated in `_shared/auth.ts`

### Environment Variables (Production):
```bash
# Frontend (.env.local - NOT committed)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge Functions (Supabase Dashboard)
PROJECT_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Smart Contracts (.env - NOT committed)
PRIVATE_KEY=your-deployer-private-key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your-basescan-api-key
```

## 🚨 Critical Issues to Fix

### Priority 1 (Fix Immediately):
1. ⚠️ **Node.js v22.22.0+ update** - Security vulnerability
2. ⚠️ **Rate limiting** - Prevent abuse
3. ⚠️ **Input validation** - Prevent DoS attacks
4. ⚠️ **CORS wildcard removal** - Security risk

### Priority 2 (Fix Before Mainnet):
5. ⚠️ **Security headers** - HSTS, CSP, etc.
6. ⚠️ **Dependency updates** - Fix vulnerabilities
7. ⚠️ **Error tracking** - Monitor production issues

### Priority 3 (Improvements):
8. ⚠️ **Comprehensive testing** - Unit tests, integration tests
9. ⚠️ **Monitoring and alerting** - Track errors, performance
10. ⚠️ **Database backup verification** - Ensure backups work

## 📚 Reference Documents

- `docs/ARCHITECTURE.md` - Complete architecture documentation
- `docs/EDGE_FUNCTIONS_AUTH_FIX.md` - Authentication fixes
- `docs/DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `supabase/functions/README.md` - Edge Functions documentation

## 🔗 External Resources

- [Node.js Security Release](https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Base Security Best Practices](https://docs.base.org/security)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)
- [Vite Security Headers](https://vitejs.dev/config/server-options.html#server-headers)

---

**Last Updated**: January 17, 2026  
**Version**: 1.0  
**Status**: ⚠️ Multiple critical issues require attention before mainnet launch

