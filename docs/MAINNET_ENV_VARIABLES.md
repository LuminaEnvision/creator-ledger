# Environment Variables for Mainnet Deployment

## Required Environment Variables

### Frontend (.env file)

```env
# Supabase (Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Contract address (if you want to override src/lib/contracts.ts)
# VITE_CONTRACT_ADDRESS=0x...
```

### Backend/Deployment (.env file for Hardhat)

```env
# Base Mainnet RPC
BASE_RPC_URL=https://mainnet.base.org
# Or use a private RPC provider:
# BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Base Sepolia (for testing before mainnet - optional)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Private Key (for contract deployment)
# ⚠️ NEVER commit this to git!
PRIVATE_KEY=your_deployer_private_key_here

# Basescan API Key (for contract verification)
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Environment Variable Changes for Mainnet

### What Changed

**Before (Testnet):**
- Default chain: Base Sepolia
- BaseScan URLs: `sepolia.basescan.org`
- RPC URL: `https://sepolia.base.org`

**After (Mainnet):**
- Default chain: Base
- BaseScan URLs: `basescan.org`
- RPC URL: `https://mainnet.base.org`

### Required Updates

#### 1. Update `.env` file

**Change:**
```env
# OLD (Testnet)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# NEW (Mainnet) - Add this
BASE_RPC_URL=https://mainnet.base.org
```

**Keep both** if you want to test on Sepolia first:
```env
# For testing
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# For mainnet deployment
BASE_RPC_URL=https://mainnet.base.org
```

#### 2. Update Contract Address

After deploying the contract to mainnet, update `src/lib/contracts.ts`:

```typescript
// OLD (Testnet address)
export const PASSPORT_CONTRACT_ADDRESS = '0xDea3162E7160aAd8f83C85814c9b9B5f16d7217c';

// NEW (Mainnet proxy address - get this from deployment)
export const PASSPORT_CONTRACT_ADDRESS = 'YOUR_MAINNET_PROXY_ADDRESS';
```

#### 3. Deployment Scripts

The deployment scripts will automatically use the correct RPC URL based on the network:

```bash
# Deploy to Base Sepolia (testing)
npm run deploy:upgradeable:base-sepolia
# Uses: BASE_SEPOLIA_RPC_URL

# Deploy to Base Mainnet (production)
npm run deploy:upgradeable:base
# Uses: BASE_RPC_URL
```

## Environment Variable Checklist

### Before Mainnet Deployment

- [ ] `BASE_RPC_URL` set to `https://mainnet.base.org` (or your RPC provider)
- [ ] `PRIVATE_KEY` set (deployer wallet with Base ETH for gas)
- [ ] `BASESCAN_API_KEY` set (for contract verification)
- [ ] `VITE_SUPABASE_URL` set (production Supabase project)
- [ ] `VITE_SUPABASE_ANON_KEY` set (production Supabase anon key)
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` set

### After Mainnet Deployment

- [ ] Contract address updated in `src/lib/contracts.ts`
- [ ] Frontend rebuilt with new contract address
- [ ] Environment variables set in hosting platform (Vercel, Netlify, etc.)

## Security Notes

### ⚠️ Never Commit These to Git:

- `PRIVATE_KEY` - Your deployer wallet private key
- `.env` file - Should be in `.gitignore`
- Any API keys or secrets

### ✅ Safe to Commit:

- `VITE_*` variables are safe (they're exposed to the browser anyway)
- Contract addresses (public information)
- RPC URLs (public endpoints)

## Example .env File

```env
# ============================================
# Frontend Environment Variables
# ============================================

# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# ============================================
# Backend/Deployment Environment Variables
# ============================================

# Base Networks
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Deployment
PRIVATE_KEY=0x...your_private_key_here

# Basescan (for contract verification)
BASESCAN_API_KEY=your_api_key_here
```

## Getting Your Environment Variables

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create/select your project
3. Go to Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

### WalletConnect
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project
3. Copy `Project ID` → `VITE_WALLETCONNECT_PROJECT_ID`

### Basescan API Key
1. Go to [basescan.org](https://basescan.org)
2. Sign up for an account
3. Go to API-KEYs section
4. Create a new API key
5. Copy → `BASESCAN_API_KEY`

### Base RPC URLs
- **Public**: `https://mainnet.base.org` (free, rate-limited)
- **Alchemy**: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY` (recommended)
- **Infura**: `https://base-mainnet.infura.io/v3/YOUR_API_KEY`
- **QuickNode**: Your QuickNode Base endpoint

## Testing Environment Variables

### Check if variables are loaded:

```bash
# In your terminal
echo $BASE_RPC_URL
echo $PRIVATE_KEY  # ⚠️ Be careful with this one!

# In your code (for debugging)
console.log(import.meta.env.VITE_SUPABASE_URL);
```

### Verify Hardhat can connect:

```bash
npx hardhat run scripts/get-owner.ts --network base
```

If this works, your `BASE_RPC_URL` and `PRIVATE_KEY` are correct.

---

**Ready to deploy?** Make sure all environment variables are set correctly before running the deployment script!

