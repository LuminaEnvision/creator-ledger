# Tasks: Core Ledger System

## Phase 1: Foundation & Setup
- [x] Initialize Vite + React project (TypeScript) <!-- id: 0 -->
- [x] Install dependencies (ethers, react-router-dom, tailwindcss, supabase-js) <!-- id: 1 -->
- [x] Configure Tailwind CSS <!-- id: 2 -->
- [x] Set up Supabase project and database schema (users, ledger_entries) <!-- id: 3 -->
- [x] Implement Supabase client (`src/lib/supabase.ts`) <!-- id: 4 -->

## Phase 2: Authentication
- [x] Create `WalletConnect` component <!-- id: 5 -->
- [x] Implement wallet connection logic (MetaMask/Injected) <!-- id: 6 -->
- [x] Create `AuthContext` to manage user session <!-- id: 7 -->
- [x] Implement "Sign In With Wallet" flow (create user in DB if new) <!-- id: 8 -->

## Phase 3: Core Features (Creator)
- [x] Create `Dashboard` page layout <!-- id: 9 -->
- [x] Implement `CreateEntryForm` component <!-- id: 10 -->
- [x] Implement URL platform detection logic <!-- id: 11 -->
- [x] Implement deterministic hashing logic (`src/lib/hashing.ts`) <!-- id: 12 -->
- [x] Connect form to Supabase (INSERT ledger_entry) <!-- id: 13 -->
- [x] Create `EntryList` component to display user's entries <!-- id: 14 -->
- [x] Connect list to Supabase (SELECT ledger_entries) <!-- id: 15 -->

## Phase 4: Export & Verification
- [x] Implement CSV export functionality (`src/lib/export.ts`) <!-- id: 16 -->
- [x] Implement PDF export functionality <!-- id: 17 -->
- [x] Add "Export" buttons to Dashboard <!-- id: 18 -->
- [x] Create simple `Admin` page (protected route) <!-- id: 19 -->
- [x] Implement "Verify" button for Admin (UPDATE verification_status) <!-- id: 20 -->

## Phase 5: Polish & Ship
- [x] Verify all "Constitution" constraints (Simple UI, No Token, etc.) <!-- id: 21 -->
- [x] Test "Success Criteria" (10 links < 2 mins) <!-- id: 22 -->
- [x] Deploy to Vercel/Netlify <!-- id: 23 -->
