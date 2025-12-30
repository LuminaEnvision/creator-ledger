# Smart Contracts Documentation

## Overview

Creator Ledger uses an ERC-721 NFT contract (`CreatorPassport.sol`) deployed on Base network to represent creator identities and track verified content entries on-chain.

## Contract: CreatorPassport

**Standard**: ERC-721 (Non-Fungible Token)  
**Network**: Base Sepolia (testnet) / Base (mainnet)  
**Address**: `0x1fAcFB89d852C7de7F58466200600c36dFaCb685` (Base Sepolia)

### Key Features

- **Unique Identity**: Each wallet address maps to one NFT token ID
- **Entry Tracking**: On-chain entry count increases with verified content
- **Role-Based Access**: Owner, Admin, and Treasury roles
- **Fee System**: Operations fees for upgrades (0.00025 ETH per entry)

## Contract Roles

### 1. Owner

The contract deployer who has full control:

- Add/remove admins
- Transfer ownership
- All admin privileges

### 2. Admin

Designated verifiers who can:

- Mint passports for creators (`mintFor`)
- Increment entry counts (`adminIncrementEntryCount`)
- Verify entries in the Admin Dashboard

**Note**: Admins do NOT sign transactions for users. They only verify entries in the database. Users mint and upgrade their own NFTs.

### 3. Treasury

The fee recipient address:

- Receives operations fees from upgrades
- Address: `0x7eB8F203167dF3bC14D59536E671528dd97FB72a`
- Fees: 0.00025 ETH per entry upgrade

## Contract Functions

### Public Functions

#### `mint()`
Mints a new passport NFT for the caller.

```solidity
function mint() public payable
```

- **Access**: Public
- **Fee**: 0 ETH (free initial mint)
- **Effect**: Creates NFT with token ID based on wallet address

#### `incrementEntryCount()`
Increments entry count by 1.

```solidity
function incrementEntryCount() public payable
```

- **Access**: Public
- **Fee**: 0.00025 ETH
- **Effect**: Increases `entryCount` by 1

#### `incrementEntryCountBy(uint256 count)`
Increments entry count by specified amount.

```solidity
function incrementEntryCountBy(uint256 count) public payable
```

- **Access**: Public
- **Fee**: 0.00025 ETH × count
- **Effect**: Increases `entryCount` by `count`

### Admin Functions

#### `mintFor(address creator)`
Admin-only function to mint passport for a creator.

```solidity
function mintFor(address creator) public onlyAdmin
```

- **Access**: Admin only
- **Fee**: 0 ETH
- **Effect**: Creates NFT for specified address

#### `adminIncrementEntryCount(address creator)`
Admin-only function to increment entry count for a creator.

```solidity
function adminIncrementEntryCount(address creator) public payable onlyAdmin
```

- **Access**: Admin only
- **Fee**: 0.00025 ETH
- **Effect**: Increases entry count for specified address

### Owner Functions

#### `addAdmin(address admin)`
Adds an admin address.

```solidity
function addAdmin(address admin) public onlyOwner
```

- **Access**: Owner only
- **Effect**: Grants admin privileges to address

#### `removeAdmin(address admin)`
Removes an admin address.

```solidity
function removeAdmin(address admin) public onlyOwner
```

- **Access**: Owner only
- **Effect**: Revokes admin privileges from address

### View Functions

#### `addressToTokenId(address)`
Returns the token ID for a wallet address.

```solidity
function addressToTokenId(address) public view returns (uint256)
```

#### `passportData(uint256 tokenId)`
Returns passport data for a token ID.

```solidity
function passportData(uint256 tokenId) public view returns (
    uint256 entryCount,
    uint256 mintedAt,
    uint256 lastUpdated
)
```

#### `admins(address)`
Checks if an address is an admin.

```solidity
function admins(address) public view returns (bool)
```

## NFT Metadata

### Token URI Generation

The contract generates on-chain metadata as a base64-encoded JSON string:

```json
{
  "name": "Creator Passport #1",
  "description": "On-chain proof of original works...",
  "image": "data:image/svg+xml;base64,..."
}
```

### SVG Image Generation

The NFT image is an SVG generated on-chain with:
- Wallet address (first 6 and last 4 characters)
- Entry count (level)
- Timestamp
- Gradient colors based on wallet address

## Deployment

### Prerequisites

1. Hardhat configured
2. Environment variables set:
   - `PRIVATE_KEY` - Owner wallet private key
   - `BASE_SEPOLIA_RPC_URL` - RPC endpoint

### Deployment Steps

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy to Base Sepolia**
   ```bash
   npm run deploy:base-sepolia
   ```

3. **Deploy to Base Mainnet**
   ```bash
   npm run deploy:base
   ```

4. **Verify contract**
   ```bash
   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
   ```

### Adding Admins

After deployment, add admin addresses:

```bash
ADMIN_ADDRESS=0x... npx hardhat run scripts/add-admin.ts --network baseSepolia
```

## Contract Interaction

### Frontend Integration

The frontend uses Wagmi hooks to interact with the contract:

```typescript
// Read token ID
const { data: tokenId } = useReadContract({
  address: PASSPORT_CONTRACT_ADDRESS,
  abi: PASSPORT_ABI,
  functionName: 'addressToTokenId',
  args: [walletAddress]
})

// Mint passport
const { writeContractAsync } = useWriteContract()
await writeContractAsync({
  address: PASSPORT_CONTRACT_ADDRESS,
  abi: PASSPORT_ABI,
  functionName: 'mint',
  value: 0n
})
```

### Contract ABI

The contract ABI is stored in `src/lib/contracts.ts` and includes all function signatures for frontend interaction.

## Gas Costs

### Estimated Gas (Base Sepolia)

- **Mint**: ~150,000 gas
- **Increment Entry Count**: ~80,000 gas
- **Batch Increment (7 entries)**: ~200,000 gas

### Fee Structure

- **Initial Mint**: Free (0 ETH)
- **Entry Upgrade**: 0.00025 ETH per entry
- **Batch Upgrade**: 0.00025 ETH × entry count

## Security Considerations

### Access Control

- **Owner Functions**: Only deployer can call
- **Admin Functions**: Only registered admins can call
- **Public Functions**: Anyone can call (with fees)

### Reentrancy Protection

- No external calls before state updates
- Safe transfer patterns for fee payments

### Input Validation

- Entry count must be > 0
- Fee validation before state changes
- Address validation for admin functions

## Upgrade Path

The contract is currently non-upgradeable. For future enhancements:

1. Deploy new contract version
2. Migrate existing NFTs (if needed)
3. Update frontend contract address
4. Notify users of migration

## Testing

### Local Testing

```bash
npx hardhat test
```

### Testnet Testing

1. Deploy to Base Sepolia
2. Test all functions
3. Verify gas costs
4. Test admin functions

### Mainnet Deployment

1. Final testing on testnet
2. Security audit (recommended)
3. Deploy to Base mainnet
4. Verify contract on BaseScan
5. Add initial admins

## Contract Addresses

### Base Sepolia (Testnet)
- **Contract**: `0x1fAcFB89d852C7de7F58466200600c36dFaCb685`
- **Explorer**: [BaseScan Sepolia](https://sepolia.basescan.org/address/0x1fAcFB89d852C7de7F58466200600c36dFaCb685)

### Base (Mainnet)
- **Contract**: TBD (not yet deployed)
- **Explorer**: [BaseScan](https://basescan.org/)

## Troubleshooting

### Common Issues

1. **"Not an admin" error**: Wallet not added as admin
2. **"Insufficient fee" error**: Not sending enough ETH
3. **"No passport found" error**: Must mint before upgrading
4. **Transaction fails**: Check network (must be Base Sepolia/Base)

### Debugging

- Check contract on BaseScan
- Verify admin status: `admins(address)`
- Check token ID: `addressToTokenId(address)`
- View passport data: `passportData(tokenId)`

---

For admin setup, see [Admin Setup Guide](./ADMIN_SETUP.md)

