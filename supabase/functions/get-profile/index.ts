import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
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
      } catch (authError) {
        // Token present but invalid - log but don't fail (public access allowed)
        console.warn('⚠️ Auth token invalid, proceeding as public request:', authError.message)
      }
    } else {
      console.log('📖 Public request (no auth token)')
    }

    // CRITICAL FIX: Always use lowercase for wallet_address queries
    // Database stores addresses in lowercase, but queries might use checksum format
    // PostgreSQL string comparison is case-sensitive, so we must normalize
    const requestedWallet = targetWallet?.toLowerCase() || walletAddress?.toLowerCase()
    
    if (!requestedWallet) {
      return errorResponse('wallet_address parameter is required', 400)
    }

    console.log('🔍 Fetching profile:', { 
      targetWallet, 
      walletAddress, 
      requestedWallet: requestedWallet 
    })

    // Create admin client
    const supabase = createAdminClient()
    
    // Get profile - ensure lowercase for case-sensitive comparison
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', requestedWallet.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return errorResponse('Failed to fetch profile', 500)
    }

    return successResponse({ profile: profile || null })
  } catch (error: any) {
    console.error('Error in get-profile:', error)
    
    // Immediately return 403 for authentication errors (best practice: return 403 immediately for invalid tokens)
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

