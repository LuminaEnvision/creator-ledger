# Creator Ledger

> **On-chain content tracking for creators on Base**  
> Built for the Base ecosystem with native Farcaster and Base App integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Base](https://img.shields.io/badge/Base-L2-0052FF.svg)](https://base.org)
[![Farcaster](https://img.shields.io/badge/Farcaster-Enabled-8A63D2.svg)](https://farcaster.xyz)

## 🌟 What is Creator Ledger?

Creator Ledger is a **verifiable, on-chain content tracking system** that helps creators prove ownership of their work and build professional portfolios. Built specifically for the **Base ecosystem** with native support for **Farcaster** and **Base Mini Apps**.

### Perfect for Base Creators

- 🎯 **Built for Base**: Deployed on Base L2 for low-cost transactions
- 🔗 **Farcaster Native**: Seamless integration with Farcaster profiles and wallets
- 📱 **Base App Ready**: Optimized for Base Mini Apps with in-app wallet connection
- ⛓️ **On-Chain Proof**: Your content ownership is permanently recorded on Base blockchain
- 🎨 **Professional Portfolios**: Beautiful, shareable creator profiles

## 🚀 Key Features

### Core Functionality
- **🔐 Wallet Authentication**: Connect with any Web3 wallet or Farcaster account
- **📝 Content Ledger**: Submit and track links to your content (X/Twitter, TikTok, YouTube, etc.)
- **🔍 Platform Detection**: Automatically detects platform from URL
- **✅ Verification System**: Admin interface for verifying content authenticity
- **📊 Export Tools**: Download your ledger as CSV or PDF for reporting
- **🎨 Public Profiles**: Shareable media kit with customizable branding

### On-Chain Features
- **🪙 Creator Passport NFT**: ERC-721 NFT on Base that represents your creator identity
- **📈 Entry Tracking**: On-chain entry count that increases with verified content
- **🔐 Proof of Ownership**: Cryptographic signatures for content verification
- **⛓️ Base Network**: Deployed on Base (mainnet) and Base Sepolia (testnet)
- **🔄 Upgradeable Contract**: UUPS proxy pattern allows future upgrades without redeployment

### Premium Features
- **📤 Advanced Exports**: CSV and PDF export with full metadata
- **🎨 Pro NFT Passport**: Enhanced on-chain NFT with premium styling
- **📈 Analytics**: Full analytics dashboard for content performance
- **🔗 Portfolio Collections**: Create filtered views for different audiences
- **✨ Custom Branding**: Custom display name, bio, avatar, and banner

## 🎯 Built for Base & Farcaster

### Base Integration
- **Base L2 Network**: All transactions happen on Base for low gas fees
- **Base Account Kit**: Integrated payment processing for premium subscriptions
- **Base Mini Apps**: Optimized UI/UX following Base design guidelines
- **Base Sepolia Testing**: Full testnet support for development

### Farcaster Integration
- **Native Profile Reading**: Automatically displays Farcaster username, display name, and avatar
- **Farcaster SDK**: Uses `@farcaster/miniapp-sdk` for seamless integration
- **Wallet Connection**: Automatic wallet connection in Farcaster environment
- **Profile Display**: Shows Farcaster profiles throughout the app

### Base App Experience
- **In-App Wallet**: Seamless wallet connection without leaving the app
- **Base Guidelines Compliant**: Follows Base Mini Apps design and product guidelines
- **Optimized Onboarding**: Smooth first-time user experience
- **Mobile-First**: Responsive design optimized for mobile wallets

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19.2 with TypeScript
- Vite for build tooling
- Tailwind CSS 4.1 for styling
- React Router for navigation

**Web3:**
- Wagmi 2.19 for Ethereum interactions
- RainbowKit 2.2 for wallet connection UI
- Viem 2.43 for low-level Ethereum utilities
- Base Account Kit for payment processing
- Farcaster Mini App SDK for Farcaster integration

**Backend:**
- Supabase (PostgreSQL) for data storage
- Supabase Edge Functions for all database operations
- Supabase Auth for wallet-based authentication
- Row Level Security (RLS) enabled with NO policies (database closed)

**Smart Contracts:**
- Solidity 0.8.22
- OpenZeppelin Contracts 5.4 (Upgradeable)
- Hardhat for development and deployment
- UUPS Proxy Pattern for upgradeability
- Base / Base Sepolia networks

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + Farcaster SDK)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Dashboard│  │  Admin   │  │  Pricing │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │              │                    │
│       └─────────────┼──────────────┘                    │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │  Wagmi/RainbowKit                        │
│              │  Farcaster SDK                           │
│              └──────┬──────┘                            │
└─────────────────────┼────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│   Supabase   │ │  Base  │ │  Farcaster  │
│  (PostgreSQL)│ │Network │ │   Wallet    │
└──────────────┘ └────────┘ └─────────────┘
```

## 📚 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Detailed system architecture and design decisions
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Edge Functions](./supabase/functions/README.md)** - Edge Functions documentation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.) or Farcaster account
- Supabase account (free tier works)
- WalletConnect Project ID (free from [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LuminaEnvision/creator-ledger.git
   cd creator-ledger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your `.env` file:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # WalletConnect
   VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   
   # Contract (optional, for deployment)
   PRIVATE_KEY=your_private_key
   BASE_RPC_URL=https://mainnet.base.org
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   BASESCAN_API_KEY=your_basescan_api_key
   ```

4. **Set up the database**
   - Create a new project on [Supabase](https://supabase.com)
   - Go to SQL Editor
   - Run the SQL from `supabase_schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Development

### Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/LuminaEnvision/creator-ledger.git
   cd creator-ledger
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Set up Supabase**
   - Create project at [Supabase Dashboard](https://supabase.com/dashboard)
   - Deploy Edge Functions (see [docs/DEVELOPER_SETUP.md](./docs/DEVELOPER_SETUP.md))

4. **Start development server**
   ```bash
   npm run dev
   ```

📖 **Full setup guide**: See [Developer Setup Guide](./docs/DEVELOPER_SETUP.md)

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build           # Build for production
npm run preview         # Preview production build

# Smart Contracts
npm run compile         # Compile contracts
npm run deploy:upgradeable:base-sepolia  # Deploy upgradeable to Base Sepolia
npm run deploy:upgradeable:base         # Deploy upgradeable to Base mainnet
npm run upgrade:base-sepolia             # Upgrade contract on Base Sepolia
npm run upgrade:base                    # Upgrade contract on Base mainnet

# Code Quality
npm run lint            # Run ESLint
```

### Project Structure

```
creator-ledger/
├── contracts/          # Solidity smart contracts
│   ├── CreatorPassport.sol              # Original contract
│   └── CreatorPassportUpgradeable.sol   # Upgradeable version (recommended)
├── scripts/            # Deployment and utility scripts
│   ├── deploy.ts                        # Standard deployment
│   ├── deploy-upgradeable.ts           # Upgradeable deployment
│   └── upgrade.ts                      # Contract upgrade script
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── context/      # React contexts (Auth, Theme, Farcaster)
│   ├── lib/          # Utilities and helpers
│   └── types/        # TypeScript type definitions
├── docs/             # Documentation
├── public/           # Static assets
└── supabase_schema.sql  # Database schema
```

## 🌐 Deployment

### Frontend Deployment

Deploy to Vercel, Netlify, or any static hosting:

1. Push your code to GitHub
2. Import the project in your hosting platform
3. Add environment variables in deployment settings
4. Deploy!

### Smart Contract Deployment

#### First Deployment (Mainnet)

```bash
# Deploy upgradeable contract to Base mainnet
npm run deploy:upgradeable:base
```

This will:
- Deploy the implementation contract
- Deploy the UUPS proxy
- Initialize the contract
- Output the proxy address (use this as your contract address)

**Important**: Update `src/lib/contracts.ts` with the proxy address.

#### Future Upgrades

```bash
# Make changes to CreatorPassportUpgradeable.sol
npm run compile

# Set PROXY_ADDRESS in .env or scripts/upgrade.ts
npm run upgrade:base
```

See [Upgradeable Contract Guide](./docs/UPGRADEABLE_CONTRACT.md) for details.

## 🔐 Security

- **Edge Functions**: All database access goes through authenticated Edge Functions
- **RLS Enabled**: Row Level Security enabled with NO policies (database closed to frontend)
- **Supabase Auth**: Wallet-based authentication with JWT tokens (auto-refresh)
- **Service Role Key**: Only Edge Functions can access database (never exposed to frontend)
- **Wallet Signatures**: Content submissions require cryptographic signatures
- **Admin Roles**: Separate admin role system in smart contracts
- **Input Validation**: All user inputs are validated and sanitized in Edge Functions
- **Upgrade Authorization**: Only contract owner can upgrade (consider multi-sig)

## 🎯 Target Audience

### Base Creators
This project is specifically designed for creators in the **Base ecosystem**:
- Content creators on Base
- Farcaster users building their presence
- Base Mini App developers
- Creators looking for on-chain proof of work

### Why Base?
- **Low Gas Fees**: Base L2 offers significantly lower transaction costs
- **Ethereum Security**: Inherits security from Ethereum mainnet
- **Growing Ecosystem**: Base is rapidly growing with strong creator support
- **Farcaster Integration**: Native Farcaster support makes it perfect for social creators

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) first.

Key areas where contributions are especially welcome:
- Base Mini Apps optimizations
- Farcaster integration improvements
- Additional platform support
- UI/UX enhancements
- Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Base](https://base.org/) - For the amazing L2 network and ecosystem
- [Farcaster](https://farcaster.xyz/) - For the decentralized social protocol
- [OpenZeppelin](https://openzeppelin.com/) - For secure smart contract libraries
- [Supabase](https://supabase.com/) - For the backend infrastructure
- [RainbowKit](https://www.rainbowkit.com/) - For wallet connection UI

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/LuminaEnvision/creator-ledger/issues)
- **Email**: crtrledger@gmail.com

---

**Built with ❤️ for Base creators**

*Ready to track your content on-chain? Start building your creator portfolio on Base today!*
