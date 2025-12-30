# Data Model: Core Ledger System

## Schema (Supabase/PostgreSQL)

### `users` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `wallet_address` | `text` | `PRIMARY KEY` | The user's wallet address (lowercase). |
| `created_at` | `timestamptz` | `DEFAULT now()` | When the user first connected. |

### `ledger_entries` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique ID for the entry. |
| `wallet_address` | `text` | `REFERENCES users(wallet_address)` | Owner of the entry. |
| `url` | `text` | `NOT NULL` | The content URL. |
| `platform` | `text` | `NOT NULL` | Enum: 'X', 'TikTok', 'Instagram', 'YouTube', 'Other'. |
| `description` | `text` | | Optional description. |
| `campaign_tag` | `text` | | Optional tag. |
| `timestamp` | `timestamptz` | `DEFAULT now()` | Server-generated timestamp. |
| `payload_hash` | `text` | `NOT NULL` | Deterministic hash of (wallet + url + timestamp). |
| `verification_status` | `text` | `DEFAULT 'Unverified'` | Enum: 'Unverified', 'Verified'. |

## RLS Policies (Row Level Security)

1.  **Public Read**: Anyone can read `ledger_entries` (transparency).
2.  **Auth Create**: Authenticated users can insert into `ledger_entries` where `wallet_address` matches their own.
3.  **Immutable**: No UPDATE or DELETE policies for `ledger_entries` (except Admin for verification status).
