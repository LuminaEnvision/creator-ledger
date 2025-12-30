# Premium Features Documentation

## Overview
This document shows where premium features are gated in the codebase and how to test them for free using the whitelist.

## Premium Feature Locations

### 1. **Dashboard (`src/pages/Dashboard.tsx`)**

#### Export Features (Lines 356-410)
- **CSV Export**: Only visible if `isPremium === true`
- **PDF Export**: Only visible if `isPremium === true`
- **Location**: "Your Submissions" section, top right buttons

#### Premium UI Elements
- **PRO Badge** (Line 192): Shows "PRO" badge next to "Dashboard" heading
- **Subtitle** (Line 202): Changes from "Track and verify content" to "Pro Creator - Full Analytics Enabled"
- **Premium Background** (Line 184): Adds `premium-bg` class to main container
- **NFT Styling** (Line 270): Uses `NFTImageFrame` with `isPro={true}` and `DynamicNFT` with `mode="pro"`
- **Glow Effect** (Line 269): Changes glow color from slate to primary color

#### GO PRO Button (Line 211)
- Only shows if `!isPremium`
- Links to `/pricing` page

### 2. **Pricing Page (`src/pages/Pricing.tsx`)**
- Shows current subscription status
- "Test Premium" button for testing (bypasses payment)
- Premium status affects which tier card is highlighted

### 3. **Public Profile (`src/pages/PublicProfile.tsx`)**
- Premium users get enhanced NFT display styling
- Premium badge/indicators on public profile

## Premium Status Check Logic

Premium status is determined by checking:
1. **Active Subscription**: `subscription_active === true` AND `subscription_end > now`
2. **Legacy Flag**: `is_premium === true` (only if no subscription system was used)
3. **Whitelist** (for testing): Wallet address in `PREMIUM_WHITELIST` array

**Priority**: Active subscription > Legacy flag > Whitelist

## Testing Premium Features (Whitelist)

### Your Wallet is Already Whitelisted! ✅

Your wallet address `0x7d85fcbb505d48e6176483733b62b51704e0bf95` is already in the whitelist.

### How to Add More Test Wallets

Edit `src/lib/premium.ts`:

```typescript
const PREMIUM_WHITELIST: string[] = [
    '0x7d85fcbb505d48e6176483733b62b51704e0bf95'.toLowerCase(), // Your wallet
    '0xYourNewTestWallet'.toLowerCase(), // Add more here
];
```

### How It Works

1. **Whitelist Check**: When checking premium status, the code first checks if the wallet is in the whitelist
2. **Bypass Database**: Whitelisted wallets get premium access regardless of database status
3. **Console Logging**: You'll see `✅ Premium whitelist active for wallet: ...` in console when whitelist is used

### Testing Checklist

When you're whitelisted, you should see:

- ✅ **Export Buttons**: CSV and PDF export buttons in "Your Submissions" section
- ✅ **PRO Badge**: "PRO" badge next to "Dashboard" heading
- ✅ **Premium Subtitle**: "Pro Creator - Full Analytics Enabled"
- ✅ **Pro NFT Styling**: NFT with premium frame, ring, and glow effects
- ✅ **No "GO PRO" Button**: The upgrade button should be hidden
- ✅ **Premium Background**: Enhanced background styling

### Console Debugging

Check browser console for:
- `Premium check:` - Shows all premium status calculations
- `isWhitelisted: true` - Confirms whitelist is active
- `✅ Premium whitelist active for wallet: ...` - Confirms whitelist is being used

## Real Payment Flow

When a user pays for real:
1. Base Pay processes the payment
2. Database is updated with:
   - `subscription_active: true`
   - `subscription_start: <timestamp>`
   - `subscription_end: <timestamp + 30 days>`
   - `is_premium: true`
3. Premium status is checked on every page load
4. All premium features become available

## Removing Whitelist for Production

Before going to production:
1. Remove or empty the `PREMIUM_WHITELIST` array in `src/lib/premium.ts`
2. Or comment out the whitelist check in premium status logic
3. Test that only paid users get premium access

## Files Modified

- `src/lib/premium.ts` - Whitelist configuration
- `src/pages/Dashboard.tsx` - Premium status check + whitelist integration
- `src/pages/Pricing.tsx` - Premium status check + whitelist integration
- `src/pages/PublicProfile.tsx` - Premium status check (no whitelist for public)

