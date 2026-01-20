import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  // Rate limiting by IP (public endpoint)
  const rateLimitId = getRateLimitIdentifier(req, null)
  const rateLimit = checkRateLimit({
    ...RATE_LIMITS.GET_PROFILE,
    identifier: rateLimitId
  })
  
  if (!rateLimit.allowed) {
    console.warn('⚠️ Rate limit exceeded for get-profile:', { identifier: rateLimitId })
    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const targetWallet = url.searchParams.get('wallet_address')
    
    // CRITICAL: Explicitly handle public vs authenticated requests
    // Public reads should work WITHOUT auth token to avoid RLS filtering issues
    const authHeader = req.headers.get('Authorization')
    let walletAddress: string | null = null
    
    // Only attempt authentication if token is present
    // This ensures public requests (no token) work correctly
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        walletAddress = await authenticateUser(req)
        console.log('✅ Authenticated request:', { walletAddress })
      } catch (authError: any) {
        // Token present but invalid - log but don't fail (public access allowed)
        // Explicitly set to null to ensure we treat as public request
        console.warn('⚠️ Auth token invalid or expired, proceeding as public request:', {
          error: authError.message,
          note: 'This is expected for public reads with expired/invalid tokens'
        })
        walletAddress = null // Explicitly set to null to ensure public request
        // Continue as public request - don't throw, don't return error
      }
    } else {
      console.log('📖 Public request (no auth token)')
    }

    // CRITICAL FIX: Always use lowercase for wallet_address queries
    // Database stores addresses in lowercase, but queries might use checksum format
    // PostgreSQL string comparison is case-sensitive, so we must normalize
    const requestedWallet = targetWallet?.toLowerCase() || walletAddress?.toLowerCase()
    
    if (!requestedWallet) {
      return errorResponse('wallet_address parameter is required', 400, req)
    }

    console.log('🔍 Fetching profile:', { 
      targetWallet, 
      walletAddress, 
      requestedWallet: requestedWallet 
    })

    // Create admin client
    const supabase = createAdminClient()
    
    // Get profile - requestedWallet is already lowercase, but ensure it
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', requestedWallet) // Already normalized to lowercase above
      .maybeSingle()
    
    console.log('📊 Profile query result:', {
      requestedWallet,
      hasProfile: !!profile,
      error: error?.message || null
    })

    if (error) {
      console.error('Error fetching profile:', error)
      return errorResponse('Failed to fetch profile', 500, req)
    }

    return successResponse({ profile: profile || null }, 200, req)
  } catch (error: any) {
    console.error('Error in get-profile:', error)
    
    // CRITICAL: get-profile allows public access, so auth errors should not block the request
    // Check if this is an auth error and if we were trying to authenticate
    const authHeader = req.headers.get('Authorization')
    const wasAuthenticatedRequest = authHeader && authHeader.startsWith('Bearer ')
    const isAuthError = error.message?.includes('UNAUTHORIZED') || 
                        error.message?.includes('Missing') || 
                        error.message?.includes('Invalid') || 
                        error.message?.includes('expired')
    
    if (isAuthError && wasAuthenticatedRequest) {
      // Authenticated request failed - return 403
      console.warn('⚠️ Authenticated request failed, returning 403')
      return errorResponse('Unauthorized', 403, req)
    }
    
    // For public requests with auth errors, log but don't fail
    // This can happen if someone sends an invalid token - we should ignore it for public reads
    if (isAuthError && !wasAuthenticatedRequest) {
      console.warn('⚠️ Auth error on public request (ignoring):', error.message)
      // Return empty profile instead of error for public reads
      return successResponse({ profile: null }, 200, req)
    }
    
    // For other errors, return 500
    return errorResponse(error.message || 'Internal server error', 500, req)
  }
})

