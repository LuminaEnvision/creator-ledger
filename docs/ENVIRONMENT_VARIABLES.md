# Environment Variables Guide

## Overview

This project uses Vite, which requires the `VITE_` prefix for environment variables that should be exposed to the client-side code.

⚠️ **Important**: All `VITE_` variables are PUBLIC and will be bundled into your client-side code. Never put secrets here!

## File Structure

### `.env.example` (Committed to Git)
- Template file with example values
- Safe to commit (no real secrets)
- Documents all required variables

### `.env.local` (NOT Committed)
- Your local development values
- Overrides `.env` if it exists
- Add to `.gitignore` (already included)
- **Contains secrets**: Private keys, API keys, etc.

### `.env` (Optional)
- Default values for the project
- Can be committed if using public defaults
- Usually not needed if using `.env.local`

## Required Variables

### Frontend (Client-Side)

These are PUBLIC and safe to expose:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key  # Still needed for storage uploads (profile images)

# WalletConnect Configuration
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### Optional Variables

```bash
# Neynar API Key (for Farcaster integration)
VITE_NEYNAR_API_KEY=your-neynar-api-key

# Test Mode (for development)
VITE_ENABLE_TEST_MODE=true
```

### Smart Contract Deployment (Local Only)

⚠️ **These are SECRET and only for local contract deployment. Never commit or deploy to Vercel!**

```bash
# Private key for deploying/upgrading smart contracts
# Only needed if you're deploying contracts locally
PRIVATE_KEY=your_private_key_without_0x_prefix

# Optional: RPC URLs (defaults provided if not set)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
CELO_SEPOLIA_RPC_URL=https://alfajores-forno.celo-testnet.org

# Optional: For contract verification
BASESCAN_API_KEY=your_basescan_api_key

# Optional: Proxy address for upgrades
PROXY_ADDRESS=0x...
```

**Important Notes:**
- `PRIVATE_KEY` is **NEVER** set in Vercel or any hosting platform
- Only used locally for deploying/upgrading smart contracts
- Must be in `.env.local` (never commit to git)
- The wallet must have ETH for gas fees

## Backend (Edge Functions)

These are SECRET and must be set in Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Add these secrets:
   - `PROJECT_URL` - Your Supabase project URL
   - `SERVICE_ROLE_KEY` - Your service role key (from Settings → API)

⚠️ **Never** put `SERVICE_ROLE_KEY` in `.env` files - it's a secret!

## Setup Instructions

### 1. Copy the example file

```bash
cp .env.local.example .env.local
```

### 2. Fill in your values

Edit `.env.local` with your actual values:

```bash
# Get these from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
```

### 3. Set Edge Function secrets

In Supabase Dashboard:
- Go to **Edge Functions** → **Settings**
- Add:
  - `PROJECT_URL` = Your Supabase project URL
  - `SERVICE_ROLE_KEY` = Your service role key

### 4. Add smart contract deployment keys (if deploying contracts)

If you're deploying or upgrading smart contracts locally, add to `.env.local`:

```bash
# Private key for contract deployment (NEVER commit this!)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Optional: RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional: For contract verification
BASESCAN_API_KEY=your_basescan_api_key
```

⚠️ **Warning**: `PRIVATE_KEY` is extremely sensitive. Never:
- Commit it to git
- Share it publicly
- Put it in Vercel or any hosting platform
- Use it in frontend code

## Where to Get Values

### Supabase Values
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SERVICE_ROLE_KEY` (Edge Functions only!)

### WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create or select a project
3. Copy the **Project ID** → `VITE_WALLETCONNECT_PROJECT_ID`

### Neynar API Key (Optional)
1. Go to [Neynar](https://neynar.com/)
2. Sign up and get your API key
3. Add to `VITE_NEYNAR_API_KEY`

## Environment Variable Priority

Vite loads variables in this order (later overrides earlier):

1. `.env` (defaults)
2. `.env.local` (local overrides - highest priority)
3. Command line: `VITE_XXX=value npm run dev`

## Production Deployment

### ⚠️ Important: Edge Function Secrets

**Edge Function secrets are NOT set in Vercel!** They must be set in Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Add:
   - `PROJECT_URL` = Your Supabase project URL
   - `SERVICE_ROLE_KEY` = Your service role key

These are server-side secrets and should never be in Vercel environment variables.

---

### Vercel

⚠️ **Important**: Do NOT add `PRIVATE_KEY` or any contract deployment keys to Vercel! These are only for local development and contract deployment.

#### Setting Environment Variables in Vercel

⚠️ **Important**: Only set **frontend** variables in Vercel. Edge Function secrets go in Supabase Dashboard.

**Set in Vercel**:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Anon key (still needed for storage uploads)
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `VITE_NEYNAR_API_KEY` - Optional, for Farcaster integration

**Do NOT set in Vercel**:
- ❌ `SERVICE_ROLE_KEY` - Goes in Supabase Dashboard only
- ❌ `PROJECT_URL` - Goes in Supabase Dashboard only (for Edge Functions)
- ❌ `PRIVATE_KEY` - Only for local contract deployment

1. **Go to your Vercel project**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your `creator-ledger` project

2. **Navigate to Settings → Environment Variables**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in the sidebar

3. **Add each variable**
   Click **Add New** and add:
   
   **Required Variables:**
   ```
   VITE_SUPABASE_URL = https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY = your-supabase-anon-key
   VITE_WALLETCONNECT_PROJECT_ID = your-walletconnect-project-id
   ```
   
   **Optional Variables:**
   ```
   VITE_NEYNAR_API_KEY = your-neynar-api-key (if using Farcaster)
   VITE_ENABLE_TEST_MODE = false (or true for testing)
   ```

4. **Set environment scope**
   - Select which environments to apply to:
     - **Production** - Live site
     - **Preview** - Pull request previews
     - **Development** - Local development (usually not needed)
   - Recommended: Select **Production** and **Preview**

5. **Save and Redeploy**
   - Click **Save** after adding each variable
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy** to apply new variables

#### Vercel Environment Variable Best Practices

- ✅ **Use the same values** as in your `.env.local` for consistency
- ✅ **Set for Production and Preview** environments
- ✅ **Redeploy after adding variables** - they're only available on new deployments
- ❌ **Don't add secrets here** - Edge Function secrets stay in Supabase Dashboard

#### Quick Setup via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_WALLETCONNECT_PROJECT_ID production

# Pull variables to local (optional)
vercel env pull .env.local
```

### Netlify

1. Go to **Site settings** → **Environment variables**
2. Add the same variables as `.env.local`
3. Set for **Production** and **Deploy previews**
4. Redeploy your site

### Other Platforms

Set the same variables as in `.env.local` in your platform's environment variable settings. Most platforms have a **Settings** → **Environment Variables** section.

## Security Notes

✅ **Safe to expose** (client-side):
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Designed for client-side use
- `VITE_WALLETCONNECT_PROJECT_ID` - Public project ID

❌ **Never expose** (server-side only):
- `SERVICE_ROLE_KEY` - Use in Edge Functions only (Supabase Dashboard)
- `PRIVATE_KEY` - Only for local contract deployment (`.env.local` only)
- Any other private keys or secrets

## Troubleshooting

### Variables not loading?

1. Make sure they start with `VITE_`
2. Restart your dev server after changing `.env.local`
3. Check that `.env.local` is in the project root
4. Verify the file has no syntax errors

### Edge Functions can't access variables?

1. Check Supabase Dashboard → Edge Functions → Settings
2. Make sure variables are named correctly:
   - `PROJECT_URL` (not `SUPABASE_URL`)
   - `SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`)
3. Redeploy Edge Functions after adding variables

