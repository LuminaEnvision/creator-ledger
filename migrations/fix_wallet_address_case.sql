-- Fix wallet address case mismatch
-- 
-- This migration normalizes all wallet_address columns to lowercase
-- to fix case-sensitive comparison issues in PostgreSQL.
--
-- Problem: Database stores addresses in lowercase, but queries might use
-- checksum format, causing case-sensitive mismatches.
--
-- Solution: Ensure all wallet addresses are lowercase in database.
--
-- Run this in Supabase SQL Editor

-- Normalize ledger_entries table
UPDATE ledger_entries
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Normalize users table
UPDATE users
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Normalize profiles table
UPDATE profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Verify the fix
SELECT 
  'ledger_entries' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT wallet_address) as unique_addresses,
  COUNT(*) FILTER (WHERE wallet_address != LOWER(wallet_address)) as non_lowercase_rows
FROM ledger_entries
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT wallet_address) as unique_addresses,
  COUNT(*) FILTER (WHERE wallet_address != LOWER(wallet_address)) as non_lowercase_rows
FROM users
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT wallet_address) as unique_addresses,
  COUNT(*) FILTER (WHERE wallet_address != LOWER(wallet_address)) as non_lowercase_rows
FROM profiles;

-- Expected result: non_lowercase_rows should be 0 for all tables

