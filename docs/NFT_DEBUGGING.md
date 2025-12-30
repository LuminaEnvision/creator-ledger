# NFT Visibility Debugging Guide

## Architecture

The contract has three distinct roles:
1. **Owner** - Contract deployer, can add/remove admins
2. **Admin** - Verifiers who can mint and increment entry counts
3. **Treasury** - Receives fees (OPERATIONS_ADDRESS)

## Issues Identified

### 1. **Admin Not Registered in Contract** (CRITICAL)
The `mintFor` and `incrementEntryCount` functions require `onlyAdmin` modifier. This means:
- Only addresses registered as admins (or the owner) can call these functions
- If your admin wallet is NOT registered in the contract, these functions will fail with "Not an admin" error

**Solution:**
- Check if your admin wallet is registered using `contract.admins(yourAddress)`
- The Admin Dashboard shows a warning if admin is not registered
- The contract owner must add your wallet using `addAdmin(address)` function
- See `ADMIN_SETUP.md` for detailed instructions

### 2. **Error Handling in AdminDashboard**
The previous error handling wasn't catching all error types correctly. Improved to:
- Check for "No passport found" errors more reliably
- Catch ownership errors specifically
- Provide better error messages

### 3. **TokenId of 0 Means No Passport**
In Solidity, when you read a mapping that doesn't exist, it returns the default value (0 for uint256).
- If `addressToTokenId[address]` returns 0, it means no passport has been minted for that address
- The contract starts `_nextTokenId` at 1, so valid tokenIds are >= 1
- The DynamicNFT component now correctly handles tokenId === 0n as "no passport"

## How to Verify and Fix

### Step 1: Check Admin Registration
1. Go to [Basescan](https://sepolia.basescan.org/address/0x1BaAf88D1B85207Fa2da244caF9bd8E230541a4e)
2. Click on "Contract" tab → "Read Contract"
3. Call the `admins` function with your admin wallet address
4. If it returns `false`, you need to be added as an admin

### Step 2: Add Admin to Contract
The contract owner must add your wallet as an admin:

**Option A: Using Hardhat Script** (Recommended)
```bash
ADMIN_ADDRESS=0x7D85fCbB505D48E6176483733b62b51704e0bF95 npx hardhat run scripts/add-admin.ts --network baseSepolia
```

**Option B: Using Remix/Basescan**
1. Contract owner connects wallet
2. Calls `addAdmin(0xYourAdminAddress)`
3. Confirms transaction

See `ADMIN_SETUP.md` for complete instructions.

### Step 3: Test the Flow
1. Submit an entry as a regular user
2. Go to Admin Dashboard
3. Click "Verify" on the entry
4. Check browser console for detailed logs
5. Verify the NFT appears in DynamicNFT component

## Debugging Checklist

- [ ] Admin wallet is the contract owner
- [ ] Contract address is correct in `src/lib/contracts.ts`
- [ ] Network is Base Sepolia (Chain ID: 84532)
- [ ] Admin wallet has enough ETH for gas
- [ ] Browser console shows detailed logs
- [ ] `addressToTokenId` returns > 0 after minting
- [ ] `tokenURI` is successfully fetched
- [ ] NFT image is displayed correctly

## Common Errors and Solutions

### Error: "Not an admin"
**Cause:** Admin wallet is not registered in the contract
**Solution:** Contract owner must call `addAdmin(yourAddress)` to register you

### Error: "No passport found"
**Cause:** `incrementEntryCount` was called but user has no passport
**Solution:** This is expected - the code should catch this and call `mintFor` instead

### Error: "The contract function 'addressToTokenId' returned no data"
**Cause:** Contract might not exist at that address, or wrong network
**Solution:** Verify contract address and network

### NFT Not Visible
**Possible Causes:**
1. TokenId is 0 (no passport minted)
2. `tokenURI` fetch failed
3. Image parsing failed
4. Network mismatch

**Debug Steps:**
1. Check browser console for logs
2. Verify `tokenId > 0` in console
3. Check `tokenURI` is being fetched
4. Verify network is Base Sepolia

## Testing Commands

### Check if address has a passport:
```javascript
// In browser console on Base Sepolia
const contract = await ethers.getContractAt("CreatorPassport", "0x1BaAf88D1B85207Fa2da244caF9bd8E230541a4e");
const tokenId = await contract.addressToTokenId("0xYourAddress");
console.log("TokenId:", tokenId.toString()); // 0 means no passport
```

### Check contract owner:
```javascript
const owner = await contract.owner();
console.log("Owner:", owner);
```

## Files Modified

1. `src/pages/AdminDashboard.tsx` - Added owner check, improved error handling
2. `src/lib/contracts.ts` - Added `owner` function to ABI
3. `src/components/DynamicNFT.tsx` - Improved handling of tokenId === 0

