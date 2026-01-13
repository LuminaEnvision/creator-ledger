# Required Supabase Tables

This document lists all the tables that need to exist in your Supabase database for Creator Ledger to work properly.

## Core Tables

### 1. `users`
**Purpose:** Stores user wallet addresses and subscription information

**Required Columns:**
- `id` (UUID, primary key)
- `wallet_address` (TEXT, unique, not null)
- `is_premium` (BOOLEAN, default false)
- `subscription_active` (BOOLEAN, default false)
- `subscription_start` (TIMESTAMPTZ, nullable)
- `subscription_end` (TIMESTAMPTZ, nullable)
- `created_at` (TIMESTAMPTZ, default now())

**Migration File:** `migrations/add_subscription_tracking.sql`

### 2. `profiles`
**Purpose:** Stores user profile information (display name, bio, avatar, banner)

**Required Columns:**
- `id` (UUID, primary key)
- `wallet_address` (TEXT, unique, references users.wallet_address)
- `display_name` (TEXT, nullable)
- `bio` (TEXT, nullable)
- `avatar_url` (TEXT, nullable)
- `banner_url` (TEXT, nullable)
- `custom_theme` (JSONB, default '{}')
- `updated_at` (TIMESTAMPTZ, default now())

**Migration File:** `migrations/ensure_profiles_schema.sql`

### 3. `ledger_entries`
**Purpose:** Stores all content submissions and their verification status

**Required Columns:**
- `id` (UUID, primary key)
- `wallet_address` (TEXT, references users.wallet_address, not null)
- `url` (TEXT, not null)
- `platform` (TEXT, not null)
- `description` (TEXT, nullable)
- `campaign_tag` (TEXT, nullable)
- `timestamp` (TIMESTAMPTZ, default now(), not null)
- `content_published_at` (TIMESTAMPTZ, nullable)
- `payload_hash` (TEXT, not null)
- `content_hash` (TEXT, nullable)
- `verification_status` (TEXT, default 'Unverified')
- `title` (TEXT, nullable)
- `image_url` (TEXT, nullable)
- `custom_image_url` (TEXT, nullable)
- `site_name` (TEXT, nullable)
- `signature` (TEXT, nullable)
- `tx_hash` (TEXT, nullable)
- `endorsement_count` (INTEGER, default 0)
- `dispute_count` (INTEGER, default 0)
- `stats` (JSONB, default '{"views": 0, "likes": 0, "shares": 0}')
- `visibility_settings` (JSONB, nullable)

**Migration Files:**
- Base schema in `supabase_schema.sql`
- `migrations/add_content_published_at.sql`
- `migrations/add_content_hash.sql`
- `migrations/add_tx_hash_and_endorsements.sql`
- `migrations/add_custom_image_url.sql`
- `migrations/add_visibility_settings.sql`

### 4. `user_notifications`
**Purpose:** Stores notifications for users (verified content, endorsements, subscription expiry)

**Required Columns:**
- `id` (UUID, primary key, default gen_random_uuid())
- `wallet_address` (TEXT, not null)
- `type` (TEXT, not null, CHECK: 'verified' | 'endorsement' | 'subscription_expired')
- `entry_id` (UUID, nullable, references ledger_entries(id) ON DELETE CASCADE)
- `endorser_wallet` (TEXT, nullable)
- `message` (TEXT, nullable)
- `read` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ, default now(), not null)

**Migration File:** `migrations/add_notifications.sql` (needs update for subscription_expired type)

## Setup Instructions

1. Run all migration files in order:
   - `supabase_schema.sql` (base schema)
   - `migrations/add_subscription_tracking.sql`
   - `migrations/add_notifications.sql` (updated version)
   - `migrations/add_content_published_at.sql`
   - `migrations/add_content_hash.sql`
   - `migrations/add_tx_hash_and_endorsements.sql`
   - `migrations/add_custom_image_url.sql`
   - `migrations/add_visibility_settings.sql`
   - `migrations/ensure_profiles_schema.sql`

2. Ensure Row Level Security (RLS) is enabled on all tables

3. Verify that the policies allow:
   - Public read access for `users`, `profiles`, `ledger_entries`
   - Public insert access for `users`, `ledger_entries`
   - Public read/insert/update for `user_notifications`

## Common Issues

- **404 NOT_FOUND errors:** Usually means a table doesn't exist or RLS is blocking access
- **PGRST116 errors:** This is "not found" - expected when querying for non-existent records (use `.maybeSingle()` to handle gracefully)

