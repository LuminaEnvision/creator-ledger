# Analytics Integration Guide

## Current State

### What We Have
- **Mock Stats**: Currently generating random stats (`views`, `likes`, `shares`) in `CreateEntryForm.tsx`
- **Database Storage**: Stats stored as JSONB in `ledger_entries.stats` column
- **Premium Gating**: Analytics display is locked for free users, shows mock data for premium users

### What's Missing
- **Real Data**: No actual integration with social media APIs
- **Transaction Links**: No blockchain transaction hash stored for verification
- **Endorsement System**: No way for viewers to endorse/vote on entries

## Easy-to-Integrate Analytics Options

### 1. **Open Graph / Meta Tags (Easiest - No API Keys)**
**Difficulty**: ⭐ Easy  
**Cost**: Free  
**Implementation Time**: 1-2 hours

**How it works:**
- Fetch URL metadata using existing Microlink API (already integrated)
- Extract Open Graph tags: `og:image`, `og:title`, `og:description`
- Some platforms expose engagement data in meta tags

**Pros:**
- Already using Microlink for metadata
- No API keys required
- Works for most platforms

**Cons:**
- Limited to public metadata
- No real-time stats
- Engagement data not always available

**Implementation:**
```typescript
// Already in CreateEntryForm.tsx
const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
const data = await response.json();
// Check if data.data has engagement metrics
```

### 2. **Microlink Analytics (Recommended)**
**Difficulty**: ⭐⭐ Easy-Medium  
**Cost**: Free tier available, paid for advanced  
**Implementation Time**: 2-3 hours

**How it works:**
- Microlink API can extract social engagement data
- Supports: Twitter, YouTube, TikTok (limited)
- Returns structured JSON with stats

**Pros:**
- Single API for multiple platforms
- Already integrated for metadata
- Free tier available

**Cons:**
- Limited platform support
- Rate limits on free tier
- May require API key for advanced features

**Implementation:**
```typescript
const response = await fetch(`https://api.microlink.io/?url=${url}&data=true`);
const data = await response.json();
// data.data.likes, data.data.views, etc.
```

### 3. **Platform-Specific APIs (Medium Complexity)**
**Difficulty**: ⭐⭐⭐ Medium  
**Cost**: Free (with rate limits)  
**Implementation Time**: 4-6 hours per platform

#### Twitter/X API
- **Endpoint**: `https://api.twitter.com/2/tweets/:id`
- **Requires**: OAuth 2.0, API keys
- **Data**: Likes, retweets, replies, views
- **Rate Limit**: 300 requests/15min (free tier)

#### YouTube Data API
- **Endpoint**: `https://www.googleapis.com/youtube/v3/videos`
- **Requires**: API key (free)
- **Data**: Views, likes, comments
- **Rate Limit**: 10,000 units/day (free)

#### TikTok (Limited)
- **No official API** for public data
- Must use third-party services or scraping (not recommended)

**Pros:**
- Most accurate data
- Real-time updates
- Official data source

**Cons:**
- Requires API keys
- Rate limits
- OAuth complexity for some platforms
- Different APIs for each platform

### 4. **Third-Party Aggregators (Easiest for Multiple Platforms)**
**Difficulty**: ⭐⭐ Easy  
**Cost**: Varies (some free tiers)  
**Implementation Time**: 2-4 hours

#### Options:
- **Social Blade API**: Aggregates multiple platforms
- **RapidAPI Social Media**: Multiple platform support
- **Apify**: Web scraping as a service

**Pros:**
- Single integration for multiple platforms
- Handles OAuth complexity
- Regular updates

**Cons:**
- Monthly costs
- Data accuracy varies
- Dependency on third-party service

### 5. **On-Chain Analytics (Future - Most Authentic)**
**Difficulty**: ⭐⭐⭐⭐ Complex  
**Cost**: Gas fees only  
**Implementation Time**: 1-2 weeks

**How it works:**
- Store analytics data on-chain (Base network)
- Update via smart contract when stats change
- Fully verifiable and tamper-proof

**Pros:**
- Fully verifiable
- No API dependencies
- Permanent record

**Cons:**
- Gas costs for updates
- Complex implementation
- Not real-time

## Recommended Approach

### Phase 1: Quick Win (This Week)
1. **Enhance Microlink Integration**
   - Check if Microlink returns engagement data
   - Fallback to mock data if unavailable
   - Store real data when available

2. **Add Transaction Hash Storage**
   - Store NFT mint/update transaction hash in database
   - Display link to BaseScan explorer
   - Add `tx_hash` column to `ledger_entries`

### Phase 2: Real Analytics (Next Sprint)
1. **Twitter/X API Integration**
   - Most creators use Twitter/X
   - Free tier available
   - Good engagement data

2. **YouTube API Integration**
   - Second most popular platform
   - Free API key
   - Rich analytics

### Phase 3: Advanced Features
1. **Endorsement System**
   - On-chain voting via smart contract
   - Viewers can sign messages to endorse entries
   - Display endorsement count

2. **Analytics Dashboard**
   - Aggregate stats across all entries
   - Trends over time
   - Performance insights

## Implementation Priority

1. ✅ **Transaction Hash Links** (High - Authenticity)
2. ✅ **Enhanced Timestamp Display** (High - Authenticity)
3. ⭐ **Microlink Analytics Enhancement** (Medium - Quick win)
4. ⭐ **Twitter API Integration** (Medium - Most used platform)
5. ⭐ **Endorsement System** (Medium - Social proof)
6. ⭐ **YouTube API Integration** (Low - Nice to have)

## Database Schema Updates Needed

```sql
-- Add transaction hash for verification
ALTER TABLE ledger_entries 
ADD COLUMN tx_hash TEXT;

-- Add endorsement table
CREATE TABLE entry_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES ledger_entries(id) ON DELETE CASCADE,
    endorser_wallet TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('endorse', 'dispute')),
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entry_id, endorser_wallet)
);

-- Index for fast lookups
CREATE INDEX idx_endorsements_entry ON entry_endorsements(entry_id);
CREATE INDEX idx_endorsements_wallet ON entry_endorsements(endorser_wallet);
```

## Next Steps

1. **Immediate**: Add transaction hash storage and display
2. **This Week**: Enhance Microlink to extract real engagement data
3. **Next Sprint**: Integrate Twitter API for real-time stats
4. **Future**: Build on-chain endorsement system

