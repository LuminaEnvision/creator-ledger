# Architecture Documentation

## Overview

Creator Ledger is a full-stack Web3 application that combines traditional web technologies with blockchain smart contracts to create a verifiable content tracking system for creators.

## System Components

### 1. Frontend Application

**Technology**: React 19.2 + TypeScript + Vite

**Key Features**:
- Single Page Application (SPA)
- Client-side routing with React Router
- Responsive design with Tailwind CSS
- Real-time data synchronization with Supabase

**Main Components**:
- `Dashboard.tsx` - Main user interface for content management
- `AdminDashboard.tsx` - Admin interface for verification
- `Pricing.tsx` - Subscription and payment handling
- `PublicProfile.tsx` - Public-facing creator profiles
- `DynamicNFT.tsx` - On-chain NFT display component

### 2. Backend (Supabase)

**Technology**: PostgreSQL + Supabase

**Database Schema**:

#### `users` Table
- Stores wallet addresses and premium status
- Tracks subscription information
- Primary key: `wallet_address`

#### `ledger_entries` Table
- Stores all content submissions
- Includes metadata (title, image, platform)
- Verification status tracking
- Cryptographic hashes for verification

#### `profiles` Table
- Creator branding information
- Display name, bio, avatar, banner
- Custom theme settings

**Security**:
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Public read access for verified entries

### 3. Smart Contracts

**Technology**: Solidity 0.8.x + OpenZeppelin

**Contract**: `CreatorPassport.sol`

**Key Features**:
- ERC-721 NFT standard (non-fungible tokens)
- Wallet-to-token mapping
- Entry count tracking
- Admin role management
- Fee collection system

**Functions**:
- `mint()` - Public minting function
- `mintFor(address)` - Admin-only minting
- `incrementEntryCount()` - User upgrades
- `incrementEntryCountBy(uint256)` - Batch upgrades
- `addAdmin(address)` - Owner-only admin management

**Network**: Base (mainnet)

### 4. Wallet Integration

**Technology**: Wagmi + RainbowKit + Viem

**Supported Wallets**:
- MetaMask
- Coinbase Wallet
- WalletConnect
- Any EIP-1193 compatible wallet

**Features**:
- Automatic network detection
- Chain switching
- Transaction signing
- Signature verification

## Data Flow

### Content Submission Flow

```
User Input (URL)
    ↓
Platform Detection
    ↓
Metadata Fetching
    ↓
Hash Generation
    ↓
Signature Request
    ↓
Supabase Insert
    ↓
Admin Verification
    ↓
NFT Upgrade Available
```

### NFT Minting Flow

```
User Clicks "Mint Passport"
    ↓
Check if Already Minted
    ↓
Call Smart Contract `mint()`
    ↓
Contract Creates NFT
    ↓
Token ID Mapped to Wallet
    ↓
NFT Metadata Generated
    ↓
Display in UI
```

### Premium Subscription Flow

```
User Clicks "Subscribe"
    ↓
Base Pay Integration
    ↓
Payment Processing
    ↓
Supabase Update (subscription_active: true)
    ↓
Premium Features Unlocked
    ↓
Pro NFT Styling Applied
```

## Security Architecture

### Authentication

1. **Wallet Connection**: User connects wallet via RainbowKit
2. **Signature Verification**: Content submissions require cryptographic signatures
3. **Session Management**: Wallet address stored in React context
4. **Database Security**: RLS policies enforce data access

### Authorization

1. **User Access**: Users can only access their own data
2. **Admin Access**: Separate admin role system
3. **Contract Roles**: Owner, Admin, and Treasury roles
4. **Premium Access**: Database subscription status + whitelist (testing)

### Data Integrity

1. **Hashing**: All entries include cryptographic hashes
2. **Signatures**: Proof of ownership via wallet signatures
3. **Immutable Records**: Database prevents deletion of entries
4. **On-Chain Verification**: NFT entry counts stored on blockchain

## State Management

### Frontend State

- **React Context**: Auth and Theme contexts
- **React Query**: Server state management (via Wagmi)
- **Local State**: Component-level state with useState
- **Local Storage**: Portfolio collections and preferences

### Backend State

- **Supabase**: Primary data store
- **Smart Contracts**: On-chain state (NFT ownership, entry counts)
- **Real-time**: Supabase real-time subscriptions (optional)

## API Integration

### Supabase Client

```typescript
// Authentication
supabase.auth.signInWithWallet()

// Data Operations
supabase.from('ledger_entries').insert()
supabase.from('users').update()
supabase.from('profiles').select()
```

### Smart Contract Interaction

```typescript
// Read Operations
useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'addressToTokenId',
  args: [walletAddress]
})

// Write Operations
useWriteContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'mint',
  value: 0n
})
```

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Lazy loading for NFT images
- **Caching**: React Query caching for contract reads

### Backend Optimization

- **Indexing**: Database indexes on frequently queried fields
- **Pagination**: Large result sets paginated
- **RLS Efficiency**: Policies optimized for query performance

### Blockchain Optimization

- **Batch Operations**: `incrementEntryCountBy()` for multiple upgrades
- **Gas Optimization**: Efficient contract design
- **Caching**: Client-side caching of contract reads

## Deployment Architecture

### Frontend Deployment

- **Platform**: Vercel / Netlify
- **Build**: Vite production build
- **Environment**: Environment variables for API keys
- **CDN**: Automatic CDN distribution

### Smart Contract Deployment

- **Network**: Base (mainnet)
- **Tool**: Hardhat
- **Verification**: Contract verification on BaseScan
- **Management**: Admin scripts for role management

### Database

- **Platform**: Supabase (managed PostgreSQL)
- **Backup**: Automatic daily backups
- **Scaling**: Automatic scaling with Supabase
- **Monitoring**: Supabase dashboard monitoring

## Future Enhancements

### Planned Features

1. **IPFS Integration**: Store NFT metadata on IPFS
2. **Multi-Chain Support**: Support for multiple blockchains
3. **Content Management**: Organize and verify creative works
4. **API Access**: RESTful API for third-party integrations
5. **Mobile App**: React Native mobile application

### Scalability Considerations

1. **Database Sharding**: For large-scale deployments
2. **Caching Layer**: Redis for frequently accessed data
3. **CDN**: For static assets and NFT images
4. **Load Balancing**: For high-traffic scenarios

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run database migrations
5. Start dev server
6. Connect to testnet

### Testing

1. **Unit Tests**: Component and utility function tests
2. **Integration Tests**: End-to-end user flows
3. **Contract Tests**: Smart contract functionality
4. **E2E Tests**: Full application testing

### Deployment Process

1. Run tests
2. Build production bundle
3. Deploy smart contracts (if needed)
4. Deploy frontend
5. Verify deployment
6. Monitor for issues

## Monitoring & Logging

### Frontend Monitoring

- **Error Tracking**: Console error logging
- **Performance**: Web Vitals tracking
- **Content Verification**: On-chain proof of ownership

### Backend Monitoring

- **Supabase Dashboard**: Database performance
- **Query Logs**: Slow query identification
- **Error Logs**: Application error tracking

### Blockchain Monitoring

- **BaseScan**: Transaction monitoring
- **Contract Events**: Event-based monitoring
- **Gas Tracking**: Gas usage optimization

---

For more specific documentation, see:
- [Admin Setup](./ADMIN_SETUP.md)
- [Smart Contracts](./SMART_CONTRACTS.md)
- [Deployment Guide](./DEPLOYMENT.md)

