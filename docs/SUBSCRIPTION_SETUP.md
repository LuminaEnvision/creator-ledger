# Monthly Subscription Setup Guide

## Overview

Pro Creator membership is now a **monthly recurring subscription** (15 USDC/month) instead of a one-time payment.

## Database Migration

Run the migration to add subscription tracking:

```sql
-- File: migrations/add_subscription_tracking.sql
-- Run this in your Supabase SQL Editor
```

This adds:
- `subscription_start` - When subscription began
- `subscription_end` - When subscription expires (30 days from start)
- `subscription_active` - Boolean flag for active subscriptions

## How It Works

1. **Payment Flow:**
   - User pays 15 USDC via Base Pay
   - Subscription is set for 30 days from payment date
   - `subscription_active = true`, `is_premium = true`

2. **Auto-Expiration:**
   - System checks subscription status on each page load
   - If `subscription_end` has passed, automatically sets:
     - `subscription_active = false`
     - `is_premium = false`

3. **Renewal:**
   - Users can renew from Pricing page
   - Same payment flow, extends subscription by 30 days
   - Can renew before expiration to extend

## Subscription Status Display

- **Active Subscribers:** See "Current Plan" with renewal date
- **Expired Subscribers:** See "Renew Subscription" button
- **Free Users:** See upgrade options

## Important Notes

- **Base Pay** is used for payments (not automatic recurring)
- Users must manually renew each month
- Subscription status is checked on every page load
- Expired subscriptions automatically downgrade to Free tier

## Future Enhancements

Consider implementing:
- Email/notification reminders before expiration
- Automatic renewal option (requires Base recurring payments API)
- Subscription management page
- Payment history tracking

