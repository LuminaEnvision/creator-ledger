-- Migration: Add visibility_settings column to ledger_entries
-- This allows users to control which entries are visible to specific audiences

-- Add visibility_settings column
ALTER TABLE public.ledger_entries 
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"isPublic": true, "hiddenTags": [], "hiddenPosts": [], "dateRange": null}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ledger_entries_visibility 
ON public.ledger_entries USING GIN (visibility_settings);

-- Update RLS policy to allow users to update their own entries (for editing)
CREATE POLICY IF NOT EXISTS "Users can update their own entries"
  ON public.ledger_entries
  FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address'))
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- For now, allow updates by wallet_address match (we'll use application-level auth)
-- Note: In production, you'd want proper JWT-based RLS policies

