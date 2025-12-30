# Contract Deployment Guide

## Prerequisites

1. Set up your `.env` file with:
   ```env
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   BASE_RPC_URL=https://mainnet.base.org
   BASESCAN_API_KEY=your_basescan_api_key (optional, for verification)
   ```

2. Make sure you have ETH/Base ETH in your wallet for gas fees

## Deployment Steps

### Option 1: Using Hardhat (Recommended)

If Hardhat config issues persist, try:

```bash
# Clean and compile
npx hardhat clean
npx hardhat compile

# Deploy to Base Sepolia (testnet)
npm run deploy:base-sepolia

# Deploy to Base Mainnet
npm run deploy:base

# Deploy to Celo Sepolia
npm run deploy:celo-sepolia
```

### Option 2: Manual Deployment via Remix or Etherscan

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create a new file `CreatorPassport.sol`
3. Copy the contract code from `contracts/CreatorPassport.sol`
4. Compile with Solidity 0.8.20
5. Deploy using Injected Provider (MetaMask)
6. Select your network (Base Sepolia/Base Mainnet)
7. Deploy (no constructor parameters needed)

### Option 3: Using Foundry (Alternative)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy
forge build
forge create CreatorPassport --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
```

## After Deployment

1. **Update Contract Address**: 
   - Copy the deployed contract address
   - Update `src/lib/contracts.ts`:
   ```typescript
   export const PASSPORT_CONTRACT_ADDRESS = '0xYourNewContractAddress';
   ```

2. **Verify Contract** (Optional but recommended):
   ```bash
   npx hardhat verify --network baseSepolia 0xYourContractAddress
   ```

3. **Test the Deployment**:
   - Try minting a passport
   - Check that operations fee is forwarded correctly
   - Verify NFT metadata generation

## Important Notes

- **Operations Fee Address**: `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`
- **Operations Fee Amount**: 0.001 ETH (for free users)
- The contract automatically forwards any ETH sent to the operations address
- Pro users (is_premium = true) don't pay the fee

## Network Information

- **Base Sepolia**: Chain ID 84532, RPC: https://sepolia.base.org
- **Base Mainnet**: Chain ID 8453, RPC: https://mainnet.base.org
- **Celo Sepolia**: Chain ID 44787, RPC: https://alfajores-forno.celo-testnet.org

