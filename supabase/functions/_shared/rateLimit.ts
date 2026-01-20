/**
 * Rate Limiting Utility for Supabase Edge Functions
 * 
 * This provides simple in-memory rate limiting. For production, consider using:
 * - Upstash Redis for distributed rate limiting
 * - Supabase's built-in rate limiting (if available)
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  identifier: string // IP address or user wallet address
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (resets on function restart)
// For production, use Redis or Supabase's rate limiting
const store: RateLimitStore = {}

/**
 * Check if request should be rate limited
 * 
 * @param config Rate limit configuration
 * @returns true if rate limited, false otherwise
 */
export function checkRateLimit(config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const { maxRequests, windowMs, identifier } = config
  const now = Date.now()
  const key = identifier

  // Get or create entry
  let entry = store[key]

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    delete store[key]
    entry = undefined
  }

  // Create new entry if needed
  if (!entry) {
    entry = {
      count: 0,
      resetAt: now + windowMs
    }
    store[key] = entry
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Increment counter
  entry.count++

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Get identifier from request (IP address or wallet address)
 */
export function getRateLimitIdentifier(req: Request, walletAddress?: string | null): string {
  // Use wallet address if authenticated (more accurate)
  if (walletAddress) {
    return `wallet:${walletAddress.toLowerCase()}`
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(resetAt: number): Response {
  const resetSeconds = Math.ceil((resetAt - Date.now()) / 1000)
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: resetSeconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': resetSeconds.toString(),
        'X-RateLimit-Limit': '60', // Example
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetAt.toString()
      }
    }
  )
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authenticated endpoints
  CREATE_ENTRY: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute
  VOTE_ENTRY: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  UPDATE_ENTRY: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  UPDATE_PROFILE: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  
  // Public endpoints
  GET_ENTRIES: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  GET_PROFILE: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  
  // Authentication endpoint
  AUTH_WITH_WALLET: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute per IP
  
  // General authenticated
  AUTHENTICATED: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
}

