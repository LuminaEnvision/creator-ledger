# Supabase Edge Functions

This directory contains all Edge Functions for the Creator Ledger application.

## Architecture

All database operations go through Edge Functions instead of direct Supabase queries. This provides:
- **Security**: No direct database access from frontend
- **Control**: All business logic in backend
- **Authentication**: Proper token-based auth with Supabase Auth

## Functions

### User Operations
- `get-user` - Get current user data
- `create-user` - Create new user
- `update-user` - Update user (premium, subscription)

### Entry Operations
- `create-entry` - Create new ledger entry
- `get-entries` - Get entries (supports filtering)

### Profile Operations
- `get-profile` - Get user profile
- `update-profile` - Update user profile

### Endorsement Operations
- `vote-entry` - Vote on entry (endorse/dispute)

### Notification Operations
- `get-notifications` - Get user notifications
- `mark-notification-read` - Mark notification as read

### Admin Operations
- `admin-get-entries` - Get all entries (admin only)
- `admin-verify-entry` - Verify entry (admin only)

## Shared Code

- `_shared/auth.ts` - Authentication helpers and utilities

## Deployment

```bash
# Deploy all functions
supabase functions deploy get-user
supabase functions deploy create-user
supabase functions deploy update-user
supabase functions deploy create-entry
supabase functions deploy get-entries
supabase functions deploy get-profile
supabase functions deploy update-profile
supabase functions deploy vote-entry
supabase functions deploy get-notifications
supabase functions deploy mark-notification-read
supabase functions deploy admin-get-entries
supabase functions deploy admin-verify-entry
```

## Environment Variables

Set in Supabase Dashboard → Edge Functions → Settings:
- `PROJECT_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SERVICE_ROLE_KEY` - Service role key (keep secret!)

⚠️ **Note**: Supabase doesn't allow "supabase" in environment variable names, so we use `PROJECT_URL` instead of `SUPABASE_URL`.

## Authentication

All functions (except public profile views) require authentication:
1. User must sign in with Supabase Auth
2. Frontend includes JWT token in `Authorization: Bearer <token>` header
3. Edge Function verifies token and extracts wallet address
4. Returns 403 if token is invalid or expired

## CORS

All functions include CORS headers to allow frontend requests.

