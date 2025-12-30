# Admin Setup Guide

## Architecture Overview

The CreatorPassport contract has three distinct roles:

1. **Owner** - The contract deployer who can:
   - Add/remove admins
   - Transfer ownership
   - All admin privileges

2. **Admin** - Verifiers who can:
   - Call `mintFor()` to mint passports for creators
   - Call `incrementEntryCount()` to update entry counts
   - Verify entries in the Admin Dashboard

3. **Treasury** - The `OPERATIONS_ADDRESS` that receives fees:
   - Address: `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`
   - Receives fees from free users when they submit entries

## Adding Admins

### Prerequisites

1. You must be the contract owner (the address that deployed the contract)
2. Have your `.env` file configured with:
   ```env
   PRIVATE_KEY=your_owner_private_key
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ```

### Method 1: Using Hardhat Script (Recommended)

```bash
# Add a single admin
ADMIN_ADDRESS=0x7D85fCbB505D48E6176483733b62b51704e0bF95 npx hardhat run scripts/add-admin.ts --network baseSepolia

# Or pass as argument
npx hardhat run scripts/add-admin.ts --network baseSepolia 0x7D85fCbB505D48E6176483733b62b51704e0bF95
```

### Method 2: Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Connect to Base Sepolia network
3. Load the contract at address: `0x1BaAf88D1B85207Fa2da244caF9bd8E230541a4e`
4. Call the `addAdmin` function with the admin address
5. Confirm the transaction

### Method 3: Using Basescan

1. Go to [Basescan](https://sepolia.basescan.org/address/0x1BaAf88D1B85207Fa2da244caF9bd8E230541a4e)
2. Click "Contract" → "Write Contract"
3. Connect your wallet (must be contract owner)
4. Find `addAdmin` function
5. Enter admin address and click "Write"

## Current Admin Wallets

These are the admin wallets configured in the frontend (`src/lib/admin.ts`):

- `0x7D85fCbB505D48E6176483733b62b51704e0bF95`
- `0xD76C1a451B7d52405b6f4f8Ee3c04989B656e9Bf`

**Important:** These wallets must also be added as admins in the contract using one of the methods above.

## Verifying Admin Status

### In the Frontend

The Admin Dashboard will show:
- ✅ Green banner: Admin is registered in contract
- ⚠️ Yellow banner: Admin is NOT registered (needs to be added by owner)

### On-Chain Check

```bash
# Using Hardhat console
npx hardhat console --network baseSepolia
> const contract = await ethers.getContractAt("CreatorPassport", "0x1BaAf88D1B85207Fa2da244caF9bd8E230541a4e")
> await contract.admins("0x7D85fCbB505D48E6176483733b62b51704e0bF95")
true
```

## Removing Admins

Only the contract owner can remove admins:

```bash
# Using Hardhat script (create similar to add-admin.ts)
# Or use Remix/Basescan to call removeAdmin(address)
```

**Note:** The contract owner cannot be removed as an admin.

## Troubleshooting

### "Not an admin" Error

If you see this error when verifying entries:
- Check that your wallet is in the `ADMIN_WALLETS` array in `src/lib/admin.ts`
- Check that your wallet is registered in the contract using `contract.admins(yourAddress)`
- If not registered, ask the contract owner to add you

### "Only owner can call this function"

If you see this when trying to add an admin:
- You must be the contract owner (the deployer address)
- Check the owner using `contract.owner()`
- If you're not the owner, contact the owner to add admins

### Admin Dashboard Shows Warning

If the Admin Dashboard shows a yellow warning:
1. Your wallet is in the frontend admin list ✅
2. But it's NOT registered in the contract ❌
3. Ask the contract owner to add your wallet using `addAdmin()`

## Contract Functions Reference

### Owner Functions
- `addAdmin(address admin)` - Add an admin (onlyOwner)
- `removeAdmin(address admin)` - Remove an admin (onlyOwner)
- `transferOwnership(address newOwner)` - Transfer ownership (onlyOwner)

### Admin Functions
- `mintFor(address creator)` - Mint passport for creator (onlyAdmin)
- `incrementEntryCount(address creator)` - Increment entry count (onlyAdmin)

### Public Functions
- `mint()` - Users can mint their own passport (payable)
- `addressToTokenId(address)` - Check if address has passport
- `tokenURI(uint256 tokenId)` - Get NFT metadata
- `passportData(uint256 tokenId)` - Get entry count and last updated

