# Quick Deployment Guide

## ✅ Easiest Method: Remix IDE

1. **Go to Remix**: https://remix.ethereum.org

2. **Create Contract File**:
   - Click "File Explorer" → "contracts" folder
   - Click "+" → Create `CreatorPassport.sol`
   - Copy entire content from `contracts/CreatorPassport.sol`

3. **Install Dependencies** (in Remix):
   - Go to "File Explorer"
   - Create `@openzeppelin/contracts/access/Ownable.sol`
   - Create `@openzeppelin/contracts/token/ERC721/ERC721.sol`
   - Create `@openzeppelin/contracts/utils/Strings.sol`
   - Create `@openzeppelin/contracts/utils/Base64.sol`
   - Or use Remix's import feature to auto-install

4. **Compile**:
   - Go to "Solidity Compiler" tab
   - Select version: `0.8.20`
   - Click "Compile CreatorPassport.sol"
   - ✅ Should show green checkmark

5. **Deploy**:
   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - **Switch MetaMask to Base Sepolia** (Chain ID: 84532)
   - Click "Deploy" (no constructor parameters needed)
   - Copy the deployed contract address

6. **Update Frontend**:
   - Open `src/lib/contracts.ts`
   - Update: `export const PASSPORT_CONTRACT_ADDRESS = '0xYourNewAddress';`

## Contract Details

- **Operations Fee Address**: `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`
- **Fee Amount**: 0.001 ETH (for free users)
- **Constructor**: No parameters needed

## Verify Contract (Optional)

After deployment, verify on Basescan:
1. Go to https://sepolia.basescan.org
2. Find your contract
3. Click "Contract" → "Verify and Publish"
4. Paste contract code and verify

## Test the Deployment

1. Try minting a passport (should work)
2. Check that operations fee is forwarded correctly
3. Verify NFT metadata shows correct level

