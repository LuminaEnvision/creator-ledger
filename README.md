# Creator Ledger

> A verifiable, on-chain content tracking system for creators. Track your work, prove ownership, and build your professional portfolio.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)

## 🌟 Features

### Core Functionality
- **🔐 Wallet Authentication**: Sign in with MetaMask, Coinbase Wallet, or any Web3 wallet
- **📝 Content Ledger**: Submit and track links to your content (X/Twitter, TikTok, YouTube, etc.)
- **🔍 Platform Detection**: Automatically detects platform from URL
- **✅ Verification System**: Admin interface for verifying content authenticity
- **📊 Export Tools**: Download your ledger as CSV or PDF for reporting
- **🎨 Public Profiles**: Shareable media kit with customizable branding

### Premium Features
- **📤 Advanced Exports**: CSV and PDF export with full metadata
- **🎨 Pro NFT Passport**: Enhanced on-chain NFT with premium styling
- **📈 Analytics**: Full analytics dashboard for content performance
- **🔗 Portfolio Collections**: Create filtered views for different audiences
- **✨ Custom Branding**: Custom display name, bio, avatar, and banner

### On-Chain Features
- **🪙 Creator Passport NFT**: ERC-721 NFT that represents your creator identity
- **📈 Entry Tracking**: On-chain entry count that increases with verified content
- **🔐 Proof of Ownership**: Cryptographic signatures for content verification
- **⛓️ Base Network**: Deployed on Base Sepolia (testnet) and Base (mainnet)

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

**Backend:**
- Supabase (PostgreSQL) for data storage
- Row Level Security (RLS) for data access control

**Smart Contracts:**
- Solidity 0.8.x
- OpenZeppelin Contracts 5.4
- Hardhat for development and deployment
- Base Sepolia / Base networks

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Dashboard│  │  Admin   │  │  Pricing │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │              │                    │
│       └─────────────┼──────────────┘                    │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │  Wagmi/RainbowKit                        │
│              └──────┬──────┘                            │
└─────────────────────┼────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│   Supabase   │ │  Base  │ │  Wallet     │
│  (PostgreSQL)│ │Network │ │  Providers  │
└──────────────┘ └────────┘ └─────────────┘
```

### Data Flow

1. **User Authentication**: Wallet connects → Signature verification → User record created/updated in Supabase
2. **Content Submission**: URL submitted → Platform detected → Hash generated → Entry stored in Supabase
3. **Verification**: Admin verifies entry → Database updated → User can mint/upgrade NFT
4. **NFT Minting**: User mints passport → Smart contract creates NFT → Entry count tracked on-chain

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
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
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
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

## 📚 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Detailed system architecture
- **[Admin Setup](./docs/ADMIN_SETUP.md)** - How to set up admin roles
- **[Premium Features](./docs/PREMIUM_FEATURES.md)** - Premium feature documentation
- **[Smart Contracts](./docs/SMART_CONTRACTS.md)** - Contract deployment and interaction
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build           # Build for production
npm run preview         # Preview production build

# Smart Contracts
npm run compile         # Compile contracts
npm run deploy:base-sepolia  # Deploy to Base Sepolia
npm run deploy:base    # Deploy to Base mainnet

# Code Quality
npm run lint            # Run ESLint
```

### Project Structure

```
creator-ledger/
├── contracts/          # Solidity smart contracts
│   └── CreatorPassport.sol
├── scripts/           # Deployment and utility scripts
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── context/      # React contexts (Auth, Theme)
│   ├── lib/          # Utilities and helpers
│   └── types/        # TypeScript type definitions
├── docs/             # Documentation
├── public/           # Static assets
└── supabase_schema.sql  # Database schema
```

## 🔐 Security

- **Row Level Security (RLS)**: All database tables use RLS policies
- **Wallet Signatures**: Content submissions require cryptographic signatures
- **Admin Roles**: Separate admin role system in smart contracts
- **Input Validation**: All user inputs are validated and sanitized

## 🧪 Testing

### Test Premium Features

For testing premium features without payment, add your wallet to the whitelist in `src/lib/premium.ts`:

```typescript
const PREMIUM_WHITELIST: string[] = [
    '0xYourWalletAddress'.toLowerCase(),
];
```

## 📦 Deployment

### Vercel / Netlify

1. Push your code to GitHub
2. Import the project in Vercel/Netlify
3. Add environment variables in deployment settings
4. Deploy!

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) first.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Base](https://base.org/) for the L2 network
- [Supabase](https://supabase.com/) for the backend infrastructure
- [RainbowKit](https://www.rainbowkit.com/) for wallet connection UI

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/LuminaEnvision/creator-ledger/issues)
- **Email**: crtrledger@gmail.com

---

**Built with ❤️ for creators**
