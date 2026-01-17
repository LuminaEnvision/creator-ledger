-- Fix verification_status case mismatch
-- 
-- This migration normalizes all verification_status values to lowercase
-- to fix case-sensitive comparison issues in the frontend.
--
-- Problem: Database stores values in lowercase ('verified', 'unverified', 'rejected')
-- but frontend was checking for capitalized values ('Verified', 'Unverified', 'Rejected').
-- JavaScript string comparison is case-sensitive, so 'verified' !== 'Verified'.
--
-- Solution: Ensure all verification_status values are lowercase in database.
--
-- Run this in Supabase SQL Editor

-- Normalize ledger_entries table
UPDATE ledger_entries
SET verification_status = LOWER(verification_status)
WHERE verification_status != LOWER(verification_status);

-- Verify the fix
SELECT 
  verification_status,
  COUNT(*) as count
FROM ledger_entries
GROUP BY verification_status
ORDER BY verification_status;

-- Expected result: All values should be lowercase ('verified', 'unverified', 'rejected')
-- If you see capitalized values, the update didn't work - check for NULL or unexpected values

