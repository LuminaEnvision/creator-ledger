# Implementation Plan: Core Ledger System

**Branch**: `001-core-ledger-system` | **Date**: 2025-12-25 | **Spec**: [specs/001-core-ledger-system/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-core-ledger-system/spec.md`

## Summary

Build a Single-Page Web App (SPA) that allows creators to authenticate with a crypto wallet, submit links to published content, and view/export their ledger of submissions. The system will be client-side focused for the MVP, using local storage or a lightweight backend (e.g., Firebase/Supabase or even just local state if "no backend" is preferred, but spec implies persistence "permanently recorded"). Given the "verifiable" and "immutable" requirements, we will use a simple backend (e.g., Supabase) to store the ledger entries and hashes, ensuring data persistence across sessions.

## Technical Context

**Language/Version**: TypeScript, React (Vite)
**Primary Dependencies**:
- `ethers` or `viem` (Wallet connection)
- `react-router-dom` (Routing)
- `tailwindcss` (Styling - strictly utility-based, no custom CSS files if possible)
- `papaparse` (CSV Export)
- `jspdf` (PDF Export)
- `supabase-js` (Backend/Storage - chosen for speed and simplicity)
**Storage**: Supabase (PostgreSQL)
**Testing**: Vitest (Unit), Playwright (E2E)
**Target Platform**: Web (Modern Browsers)
**Project Type**: Web Application (SPA)
**Performance Goals**: TTI < 1.5s, Submission < 5s
**Constraints**: No custom design (use default browser/Tailwind styles), No token required.

## Constitution Check

- [x] **Simple UI**: Using default Tailwind styles, no complex custom CSS.
- [x] **SPA**: Built with Vite + React.
- [x] **No Token**: Standard web2 database with wallet auth (SIWE or simple signature).
- [x] **No Discovery**: Strictly personal ledger view.
- [x] **Immutable**: Database rules will prevent updates/deletes on entries.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-ledger-system/
├── plan.md              # This file
├── research.md          # (Skipped for MVP)
├── data-model.md        # Database schema
├── quickstart.md        # Setup instructions
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/
├── components/          # Reusable UI components (Button, Input, Table)
├── pages/               # Page views (Home, Dashboard, Admin)
├── lib/                 # Utilities
│   ├── supabase.ts      # Database client
│   ├── wallet.ts        # Wallet connection logic
│   ├── hashing.ts       # Deterministic hashing logic
│   └── export.ts        # CSV/PDF export logic
├── types/               # TypeScript definitions
├── App.tsx              # Main entry point
└── main.tsx             # DOM renderer
```

**Structure Decision**: Standard Vite+React structure. Keeping it flat and simple.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Backend (Supabase) | "Permanently recorded" & "Admin verification" requires shared state. | LocalStorage is not permanent or verifiable by others. |
