# Upgradeable Contract Guide

## Overview

The `CreatorPassportUpgradeable` contract uses OpenZeppelin's **UUPS (Universal Upgradeable Proxy Standard)** pattern, allowing you to upgrade the contract logic after deployment without changing the contract address.

## Key Benefits

✅ **Same Contract Address**: The proxy address never changes - users always interact with the same address  
✅ **Preserve Data**: All existing NFTs, entry counts, and mappings are preserved during upgrades  
✅ **Add Features**: Easily add new functions or modify existing logic  
✅ **Fix Bugs**: Patch security issues or bugs without redeployment  
✅ **No Migration**: Users don't need to do anything - upgrades are seamless  

## Architecture

### Proxy Pattern

```
┌─────────────────┐
│   Proxy (UUPS)  │  ← Users interact with this address (never changes)
│   Address: 0x...│
└────────┬────────┘
         │ delegates to
         ▼
┌─────────────────┐
│ Implementation  │  ← Logic contract (can be upgraded)
│   Address: 0x...│
└─────────────────┘
```

- **Proxy Contract**: Stores all state (NFTs, mappings, etc.)
- **Implementation Contract**: Contains the logic (can be replaced)

## Deployment

### First Deployment

Deploy the upgradeable contract:

```bash
# Testnet
npm run deploy:upgradeable:base-sepolia

# Mainnet
npm run deploy:upgradeable:base
```

This will:
1. Deploy the implementation contract
2. Deploy the UUPS proxy
3. Initialize the contract with the deployer as owner

**Important**: Save the proxy address - this is what users will interact with!

### Update Frontend

After deployment, update `src/lib/contracts.ts`:

```typescript
export const PASSPORT_CONTRACT_ADDRESS = '0x...'; // Proxy address
```

## Upgrading the Contract

### Step 1: Make Changes

Edit `contracts/CreatorPassportUpgradeable.sol` to add features or fix bugs.

**Important Rules:**
- ✅ Can add new state variables at the end
- ✅ Can add new functions
- ✅ Can modify function logic
- ❌ Cannot remove state variables
- ❌ Cannot change variable order
- ❌ Cannot change variable types

### Step 2: Compile

```bash
npm run compile
```

### Step 3: Upgrade

Set the proxy address and upgrade:

```bash
# Set proxy address in .env or update scripts/upgrade.ts
export PROXY_ADDRESS=0x...

# Upgrade on testnet
npm run upgrade:base-sepolia

# Upgrade on mainnet
npm run upgrade:base
```

Or manually:

```bash
npx hardhat run scripts/upgrade.ts --network base
```

### Step 4: Verify (Optional)

Verify the new implementation on Basescan:

```bash
npx hardhat verify --network base <IMPLEMENTATION_ADDRESS>
```

## Upgrade Safety Checklist

Before upgrading on mainnet:

- [ ] Test upgrade on testnet first
- [ ] Review all changes carefully
- [ ] Ensure no state variable changes (order, type, removal)
- [ ] Test all existing functions still work
- [ ] Verify new functions work correctly
- [ ] Check gas costs haven't increased significantly
- [ ] Have rollback plan if needed

## Common Upgrade Scenarios

### Adding a New Function

```solidity
// Add to CreatorPassportUpgradeable.sol
function newFeature() public {
    // New logic
}
```

Compile and upgrade - no state changes needed.

### Adding a New State Variable

```solidity
// Add at the END of state variables
mapping(address => bool) public newFeatureEnabled;
```

**Important**: Always add new state variables at the end to preserve storage layout.

### Modifying Function Logic

```solidity
function incrementEntryCount() public payable {
    // Updated logic
    // Existing state variables remain unchanged
}
```

## Storage Layout Preservation

The proxy pattern requires preserving storage layout. State variables must:

1. Stay in the same order
2. Keep the same types
3. Never be removed (can be deprecated)

Example:

```solidity
// ✅ CORRECT: Add new variable at end
mapping(address => uint256) public addressToTokenId;  // Existing
mapping(uint256 => PassportData) public passportData; // Existing
mapping(address => bool) public newFeature;           // NEW - at end

// ❌ WRONG: Inserting in middle breaks storage
mapping(address => uint256) public addressToTokenId;  // Existing
mapping(address => bool) public newFeature;           // NEW - breaks layout!
mapping(uint256 => PassportData) public passportData; // Existing
```

## Security Considerations

### Upgrade Authorization

Only the contract owner can upgrade:

```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{}
```

### Best Practices

1. **Multi-sig Ownership**: Use a multi-sig wallet for the owner role
2. **Timelock**: Consider adding a timelock for upgrades (prevents immediate changes)
3. **Testing**: Always test upgrades on testnet first
4. **Audits**: Get security audits before mainnet upgrades
5. **Documentation**: Document all upgrades and changes

## Troubleshooting

### "Storage layout incompatible"

**Cause**: Changed state variable order or types  
**Fix**: Revert changes and follow storage layout rules

### "Implementation address didn't change"

**Cause**: Upgrade didn't complete or same code deployed  
**Fix**: Check upgrade transaction, verify new implementation is different

### "Not authorized to upgrade"

**Cause**: Wrong account or not the owner  
**Fix**: Ensure you're using the owner account

## Migration from Non-Upgradeable Contract

If you already deployed the non-upgradeable `CreatorPassport.sol`:

1. Deploy new upgradeable contract
2. Users mint new NFTs on new contract
3. Consider a migration script to transfer data (if needed)
4. Update frontend to use new contract address

**Note**: This is a one-time migration. Future upgrades won't require this.

## Resources

- [OpenZeppelin UUPS Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades)
- [UUPS Pattern Explained](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups-proxies)
- [Storage Layout Rules](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable-contracts#storage-gaps)

---

**Remember**: The proxy address is permanent. Users always interact with the same address, but the implementation can be upgraded seamlessly.

