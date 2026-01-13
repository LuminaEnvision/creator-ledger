# Recent Database Changes - Migration Guide

## Overview
This document explains the recent changes made after `add_notifications.sql` was run.

## Migration Scripts to Run

### 1. Main Migration: `run_after_add_notifications.sql`
**Run this script** - It includes both updates:
- Updates `user_notifications` table to support `subscription_expired` type
- Grants 1 month Pro tier to the rewarded user (`0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932`)

### 2. Alternative: Run Separately
If you prefer to run them separately:

#### Step 1: Update Notifications Table
Run: `update_notifications_subscription_expired.sql`
- Updates the CHECK constraint to include `subscription_expired` type
- Updates the column comment

#### Step 2: Grant Premium Reward
Run: `grant_premium_reward.sql`
- Grants 1 month Pro tier to `0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932`
- Sets subscription start to NOW()
- Sets subscription end to NOW() + 1 month
- User will automatically get notified when subscription expires

## What Changed

### 1. Notifications Table Update
- **Added:** `subscription_expired` to the notification types
- **Purpose:** Notify users when their subscription expires
- **When triggered:** Automatically when subscription_end date passes

### 2. Premium User Reward
- **User:** `0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932`
- **Reward:** 1 month Pro tier access
- **Features unlocked:** All premium features
- **Expiry notification:** User will be notified 7 days after expiry to renew

## Verification

After running the migration, verify:

```sql
-- Check notifications table supports subscription_expired
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'user_notifications_type_check';

-- Check premium user was granted access
SELECT 
    wallet_address,
    is_premium,
    subscription_active,
    subscription_start,
    subscription_end,
    subscription_end - NOW() as days_remaining
FROM public.users
WHERE wallet_address = LOWER('0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932');
```

## Notes

- The subscription expiry notification will automatically appear when:
  - Subscription has expired (subscription_end < NOW())
  - Expired within the last 7 days
  - No unread notification already exists

- The user can renew their subscription via the Base Pay button on the Pricing page

