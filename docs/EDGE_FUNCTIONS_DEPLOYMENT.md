# Edge Functions Deployment Guide

## Prerequisites

1. **Install Supabase CLI**

   **macOS (using Homebrew - recommended):**
   ```bash
   brew install supabase/tap/supabase
   ```

   **Or download the binary directly:**
   ```bash
   # Download latest release for macOS
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz | tar -xz
   sudo mv supabase /usr/local/bin/
   ```

   **Or use npx (no installation needed):**
   ```bash
   # Use npx to run commands without installing
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   ```

   ⚠️ **Note**: Global npm installation (`npm install -g supabase`) is not supported. Use one of the methods above.

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   cd creator-ledger
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   You can find your project ref in the Supabase Dashboard URL:
   `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

## Deploy All Functions

**Option 1: Using the deployment script**

If you installed Supabase CLI:
```bash
./scripts/deploy-edge-functions.sh
```

If using npx:
```bash
# Edit the script to use: npx supabase@latest functions deploy ...
# Or run commands manually (see below)
```

**Option 2: Deploy individually**

If you installed Supabase CLI:

```bash
# User operations
supabase functions deploy get-user
supabase functions deploy create-user
supabase functions deploy update-user

# Entry operations
supabase functions deploy create-entry
supabase functions deploy get-entries
supabase functions deploy update-entry

# Profile operations
supabase functions deploy get-profile
supabase functions deploy update-profile

# Endorsement operations
supabase functions deploy vote-entry
supabase functions deploy get-endorsements

# Notification operations
supabase functions deploy get-notifications
supabase functions deploy mark-notification-read
supabase functions deploy subscribe-notifications

# Admin operations
supabase functions deploy admin-get-entries
supabase functions deploy admin-verify-entry
supabase functions deploy admin-reject-entry

# Auth
supabase functions deploy auth-with-wallet
```

## Environment Variables

Set these in Supabase Dashboard → Edge Functions → Settings:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Edge Functions** → **Settings**
4. Add these secrets:

   - `PROJECT_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - `SERVICE_ROLE_KEY` - Your service role key (found in Settings → API)

   ⚠️ **Note**: Supabase doesn't allow "supabase" in environment variable names, so we use `PROJECT_URL` instead of `SUPABASE_URL`.

⚠️ **Important**: Never expose the service role key in frontend code!

## Verify Deployment

After deployment, check the Supabase Dashboard:

1. Go to **Edge Functions** → **Functions**
2. Verify all functions are listed and show "Active" status
3. Check logs for any errors

## Testing

Test a function:

```bash
# Test get-entries (public, no auth required)
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-entries?wallet_address=0x..." \
  -H "Content-Type: application/json"
```

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Make sure all functions are deployed with the latest code
2. Check that `corsPreflightResponse()` is used in all functions
3. Verify the OPTIONS handler returns status 204

### Authentication Errors

If authentication fails:
1. Check that `auth-with-wallet` function is deployed
2. Verify environment variables are set correctly
3. Check function logs in Supabase Dashboard

### Function Not Found

If you get "Function not found":
1. Make sure you're using the correct function name
2. Verify the function is deployed (check Supabase Dashboard)
3. Check the function name matches exactly (case-sensitive)

## Updating Functions

When you update Edge Function code:

1. Make your changes
2. Deploy the updated function:
   ```bash
   supabase functions deploy FUNCTION_NAME
   ```
3. The function will be updated immediately (no downtime)

## Monitoring

Monitor your functions:

1. **Logs**: Supabase Dashboard → Edge Functions → Logs
2. **Metrics**: Supabase Dashboard → Edge Functions → Metrics
3. **Errors**: Check logs for error patterns

## Best Practices

1. **Deploy frequently**: Deploy after each change to avoid issues
2. **Test locally**: Use `supabase functions serve` for local testing
3. **Monitor logs**: Check logs regularly for errors
4. **Version control**: Keep function code in git
5. **Environment variables**: Never commit secrets to git

