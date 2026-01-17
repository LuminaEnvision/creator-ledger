#!/bin/bash

# Deploy all Supabase Edge Functions
# 
# Prerequisites:
# 1. Install Supabase CLI: brew install supabase/tap/supabase
#    OR use npx: npx supabase@latest (no installation needed)
# 2. Login: supabase login (or: npx supabase@latest login)
# 3. Link project: supabase link --project-ref YOUR_PROJECT_REF
#
# If using npx, set USE_NPX=1 before running:
# USE_NPX=1 ./scripts/deploy-edge-functions.sh

# Detect if we should use npx
if [ -n "$USE_NPX" ] || ! command -v supabase &> /dev/null; then
    CMD="npx supabase@latest"
    echo "📦 Using npx (no installation required)"
else
    CMD="supabase"
    echo "📦 Using installed Supabase CLI"
fi

echo "🚀 Deploying Supabase Edge Functions..."

# Deploy shared auth module first (if needed)
# Note: _shared is automatically included, but we deploy functions that use it

# User operations
echo "📦 Deploying get-user..."
$CMD functions deploy get-user

echo "📦 Deploying create-user..."
$CMD functions deploy create-user

echo "📦 Deploying update-user..."
$CMD functions deploy update-user

# Entry operations
echo "📦 Deploying create-entry..."
$CMD functions deploy create-entry

echo "📦 Deploying get-entries..."
$CMD functions deploy get-entries

echo "📦 Deploying update-entry..."
$CMD functions deploy update-entry

# Profile operations
echo "📦 Deploying get-profile..."
$CMD functions deploy get-profile

echo "📦 Deploying update-profile..."
$CMD functions deploy update-profile

# Endorsement operations
echo "📦 Deploying vote-entry..."
$CMD functions deploy vote-entry

echo "📦 Deploying get-endorsements..."
$CMD functions deploy get-endorsements

# Notification operations
echo "📦 Deploying get-notifications..."
$CMD functions deploy get-notifications

echo "📦 Deploying mark-notification-read..."
$CMD functions deploy mark-notification-read

echo "📦 Deploying subscribe-notifications..."
$CMD functions deploy subscribe-notifications

# Admin operations
echo "📦 Deploying admin-get-entries..."
$CMD functions deploy admin-get-entries

echo "📦 Deploying admin-verify-entry..."
$CMD functions deploy admin-verify-entry

echo "📦 Deploying admin-reject-entry..."
$CMD functions deploy admin-reject-entry

# Auth
echo "📦 Deploying auth-with-wallet..."
$CMD functions deploy auth-with-wallet

echo "✅ All Edge Functions deployed!"
echo ""
echo "⚠️  Make sure to set environment variables in Supabase Dashboard:"
echo "   - PROJECT_URL (your Supabase project URL)"
echo "   - SERVICE_ROLE_KEY (your service role key)"
echo ""
echo "   Note: Supabase doesn't allow 'supabase' in env var names"

