# Mainnet Deployment Readiness Checklist

## ✅ Ready Components

### Smart Contracts
- ✅ **Upgradeable Contract**: `CreatorPassportUpgradeable.sol` is ready
- ✅ **Deployment Script**: `scripts/deploy-upgradeable.ts` configured for Base mainnet
- ✅ **Upgrade Script**: `scripts/upgrade.ts` ready for future upgrades
- ✅ **Hardhat Config**: Base mainnet network configured (chainId: 8453)
- ✅ **Contract Compiles**: Successfully compiles with Solidity 0.8.22

### Frontend
- ✅ **Base Chain Support**: Base mainnet chain is in wagmi config
- ✅ **Farcaster Integration**: Native Farcaster profile reading implemented
- ✅ **Base App Support**: Optimized for Base Mini Apps
- ✅ **Wallet Connection**: Works with all major wallets

### Infrastructure
- ✅ **Database**: Supabase schema ready
- ✅ **Environment Variables**: Configuration structure in place

## ⚠️ Required Changes Before Mainnet

### 1. Update Chain References (Critical)

The codebase now defaults to **Base**. All references have been updated:

#### `src/wagmi.ts`
```typescript
// Change from:
chains: [baseSepolia, base, ...]

// To:
chains: [base, baseSepolia, ...]  // Base mainnet first
```

#### All files updated:
- ✅ `src/components/OnChainUpgradeModal.tsx` - Updated to `base`
- ✅ `src/components/CreateEntryForm.tsx` - Updated to `base`
- ✅ `src/components/PassportMintButton.tsx` - Updated to `base`
- ✅ `src/pages/AdminDashboard.tsx` - Updated to `base`
- ✅ `src/components/DynamicNFT.tsx` - Updated to `base`

#### BaseScan URLs:
- ✅ `src/components/SignatureVerificationModal.tsx` - Updated to `basescan.org`
- ✅ `src/components/EntryList.tsx` - Updated to `basescan.org`

### 2. Deploy Contract

```bash
# Deploy upgradeable contract to Base mainnet
npm run deploy:upgradeable:base
```

**Important**: Save the proxy address output!

### 3. Update Contract Address

After deployment, update `src/lib/contracts.ts`:
```typescript
export const PASSPORT_CONTRACT_ADDRESS = 'YOUR_PROXY_ADDRESS_HERE';
```

### 4. Environment Variables

Ensure `.env` has:
```env
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key  # For contract verification
PRIVATE_KEY=your_deployer_key   # For deployment
```

### 5. Database Setup

- Ensure Supabase project is production-ready
- Run all migrations from `migrations/` folder
- Set up admin user in database
- Configure RLS policies

### 6. Frontend Deployment

- Build production bundle: `npm run build`
- Deploy to hosting (Vercel, Netlify, etc.)
- Set environment variables in hosting platform
- Update CORS settings if needed

## 📋 Pre-Deployment Checklist

### Smart Contract
- [ ] Contract compiled successfully
- [ ] Tested on Base Sepolia first
- [ ] Contract address updated in frontend
- [ ] Admin wallet added to contract
- [ ] Contract verified on Basescan
- [ ] Operations address verified (0x7eB8F203167dF3bC14D59536E671528dd97FB72a)

### Frontend
- [x] All `baseSepolia` references changed to `base`
- [ ] BaseScan URLs updated to mainnet
- [ ] Contract address updated
- [ ] Environment variables set
- [ ] Production build successful
- [ ] Tested locally with mainnet contract

### Database
- [ ] Supabase project created
- [ ] Schema deployed
- [ ] Migrations run
- [ ] RLS policies configured
- [ ] Admin user created

### Testing
- [ ] Test wallet connection on mainnet
- [ ] Test content submission
- [ ] Test admin verification
- [ ] Test NFT minting
- [ ] Test on-chain upgrade
- [ ] Test Farcaster integration
- [ ] Test Base App experience

### Security
- [ ] Private keys secured (use environment variables)
- [ ] Admin wallet is secure (consider multi-sig)
- [ ] Contract owner is secure
- [ ] Database credentials secured
- [ ] CORS configured correctly

## 🚀 Deployment Steps

### Step 1: Update Code for Mainnet

Create a branch and update all chain references:
```bash
git checkout -b mainnet-deployment
# Make all the changes listed above
```

### Step 2: Deploy Contract

```bash
# Ensure you have Base ETH for gas
npm run deploy:upgradeable:base
```

### Step 3: Update Frontend

1. Update `src/lib/contracts.ts` with proxy address
2. Update all chain references
3. Build: `npm run build`
4. Test locally

### Step 4: Deploy Frontend

Deploy to your hosting platform with production environment variables.

### Step 5: Verify

1. Test wallet connection
2. Test content submission
3. Test admin functions
4. Verify contract on Basescan

## ⚠️ Important Notes

### Contract Address
- **Proxy Address**: This is what users interact with (never changes)
- **Implementation Address**: This can be upgraded (changes with each upgrade)
- Always use the **proxy address** in the frontend

### Gas Costs
- Base mainnet has very low gas fees
- Minting: ~$0.01-0.05
- Entry upgrade: ~$0.01-0.05
- Content hash registration: ~$0.01-0.05

### Testing First
**Optional: Test on Base Sepolia first if desired**
1. Deploy to Base Sepolia (optional)
2. Test all functionality
3. Fix any issues
4. Deploy to Base mainnet

## 🔄 After Mainnet Deployment

### Initial Setup
1. Add admin wallets to contract
2. Test admin functions
3. Create first verified entries
4. Monitor for issues

### Monitoring
- Monitor contract events
- Check database for errors
- Monitor gas usage
- Track user activity

### Future Upgrades
Use the upgrade script when needed:
```bash
npm run upgrade:base
```

## 📞 Support

If you encounter issues:
1. Check contract on Basescan
2. Verify environment variables
3. Check database logs
4. Review browser console

---

**Ready to deploy?** Follow the checklist above and you'll be on mainnet in no time! 🚀

