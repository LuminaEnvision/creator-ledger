# Contract Redeployment Guide

## Updated Fee Amount
- **Old Fee**: 0.001 ETH
- **New Fee**: 0.00025 ETH (+ gas fees)

## Prerequisites

1. Ensure your `.env` file has:
   ```env
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   BASESCAN_API_KEY=your_basescan_api_key (optional, for verification)
   ```

2. Make sure you have enough ETH/Base ETH for:
   - Gas fees for deployment
   - Contract deployment costs

## Deployment Steps

### Quick Deployment (Recommended)

Use the automated redeployment script:

```bash
cd "/Users/luminaenvision/content portfolio/creator-ledger"
./scripts/redeploy.sh
```

Or use npm script:

```bash
npm run deploy:base-sepolia
```

### Manual Deployment

#### Step 1: Clean and Compile

```bash
cd "/Users/luminaenvision/content portfolio/creator-ledger"
npx hardhat clean
npx hardhat compile
```

#### Step 2: Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Step 3: Verify Deployment

After deployment, the script will output:
- Contract address
- Operations address (should be `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`)
- Operations fee (should be `0.00025 ETH`)

### Step 4: Update Frontend Contract Address

Update `src/lib/contracts.ts` with the new contract address:

```typescript
export const PASSPORT_CONTRACT_ADDRESS = 'YOUR_NEW_CONTRACT_ADDRESS';
```

### Step 5: Verify on Basescan (Optional)

```bash
npx hardhat verify --network baseSepolia YOUR_CONTRACT_ADDRESS
```

## Important Notes

⚠️ **After redeployment:**
1. The old contract will still exist at the old address
2. Users with existing passports on the old contract will need to mint new ones on the new contract
3. Update the contract address in `src/lib/contracts.ts` immediately after deployment
4. Test the new fee amount (0.00025 ETH) with a test submission

## Operations Address Verification

The contract should forward fees to:
- **Address**: `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`
- **Fee Amount**: 0.00025 ETH per submission (for free users)

## Testing After Deployment

1. Connect wallet to Base Sepolia
2. Submit a test entry as a free user
3. Verify the transaction sends 0.00025 ETH to the operations address
4. Check the operations address on Basescan to confirm receipt

