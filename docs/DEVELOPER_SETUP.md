# Developer Setup Guide

Complete guide for setting up the Creator Ledger development environment.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- **A code editor** (VS Code recommended)
- **Supabase account** ([Sign up](https://supabase.com))
- **WalletConnect Project ID** ([Get one](https://cloud.walletconnect.com/))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/LuminaEnvision/creator-ledger.git
cd creator-ledger
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

Fill in your `.env.local`:

```bash
# Supabase (get from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# WalletConnect (get from https://cloud.walletconnect.com/)
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

See [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md) for detailed instructions.

### 4. Set Up Supabase

#### Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in project details
4. Wait for project to be created

#### Set Up Database

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL from `supabase_schema.sql` (if available)
3. Or create tables manually based on the schema in `docs/ARCHITECTURE.md`

#### Set Up Edge Functions

1. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   # OR use npx: npx supabase@latest
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Set Edge Function secrets (Supabase Dashboard → Edge Functions → Settings):
   - `PROJECT_URL` = Your Supabase project URL
   - `SERVICE_ROLE_KEY` = Your service role key (from Settings → API)

5. Deploy Edge Functions:
   ```bash
   ./scripts/deploy-edge-functions.sh
   ```

See [Edge Functions Deployment](./EDGE_FUNCTIONS_DEPLOYMENT.md) for detailed instructions.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development Workflow

### Running the App

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Smart Contract Development

```bash
# Compile contracts
npm run compile

# Deploy to Base Sepolia (testnet)
npm run deploy:upgradeable:base-sepolia

# Deploy to Base (mainnet)
npm run deploy:upgradeable:base

# Upgrade existing contract
npm run upgrade:base
```

**Note**: Contract deployment requires `PRIVATE_KEY` in `.env.local`. See [Environment Variables](./ENVIRONMENT_VARIABLES.md) for details.

### Code Quality

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Project Structure

```
creator-ledger/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment and utility scripts
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── context/        # React contexts (Auth, Theme)
│   ├── lib/            # Utilities and helpers
│   └── types/          # TypeScript type definitions
├── supabase/
│   └── functions/      # Edge Functions
├── docs/               # Documentation
└── public/             # Static assets
```

## Key Technologies

- **Frontend**: React 19.2 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Wagmi + Viem + RainbowKit
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Smart Contracts**: Solidity + Hardhat
- **Deployment**: Vercel (frontend)

## Common Tasks

### Adding a New Component

1. Create component in `src/components/`
2. Export from component file
3. Import and use in pages/components

### Adding a New Edge Function

1. Create function in `supabase/functions/your-function-name/`
2. Use shared auth helpers from `_shared/auth.ts`
3. Deploy: `supabase functions deploy your-function-name`
4. Add to `src/lib/edgeFunctions.ts`

### Adding a New Page

1. Create page in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link if needed

### Testing Wallet Connection

1. Make sure you have a wallet extension installed (MetaMask, etc.)
2. Click "Connect Wallet" in the app
3. Approve connection in wallet
4. Sign authentication message when prompted

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Supabase Connection Issues

1. Check `.env.local` has correct values
2. Verify Supabase project is active
3. Check Edge Functions are deployed
4. Check browser console for errors

### Wallet Connection Issues

1. Make sure wallet extension is installed
2. Check you're on the correct network (Base)
3. Try disconnecting and reconnecting
4. Clear browser cache and localStorage

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules .vite dist
npm install
npm run build
```

### Edge Function Errors

1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set correctly
3. Check function code for errors
4. Redeploy function: `supabase functions deploy function-name`

## Next Steps

- Read [Architecture Documentation](./ARCHITECTURE.md) for system overview
- Read [Contributing Guide](./CONTRIBUTING.md) for coding standards
- Read [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md) for env var details
- Check [README](../README.md) for feature overview

## Getting Help

- **Issues**: Open an issue on GitHub
- **Questions**: Check existing issues first
- **Documentation**: See `docs/` folder for detailed guides

---

Happy coding! 🚀

