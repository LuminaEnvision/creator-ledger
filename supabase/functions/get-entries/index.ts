import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  try {
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

    // Get query parameters
    const url = new URL(req.url)
    const targetWallet = url.searchParams.get('wallet_address')
    const isOwnProfile = walletAddress && targetWallet?.toLowerCase() === walletAddress.toLowerCase()
    const onlyVerified = url.searchParams.get('only_verified') === 'true'
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Build query
    let query = supabase
      .from('ledger_entries')
      .select('*')

    // Filter by wallet address if provided
    if (targetWallet) {
      query = query.eq('wallet_address', targetWallet.toLowerCase())
    } else if (walletAddress) {
      // If authenticated and no target wallet, return user's own entries
      query = query.eq('wallet_address', walletAddress)
    }

    // Filter by verification status
    if (onlyVerified || (!isOwnProfile && targetWallet)) {
      // Public profiles only show verified entries
      query = query.eq('verification_status', 'Verified')
    }

    // Order by timestamp
    query = query.order('timestamp', { ascending: false })

    console.log('📊 Querying entries:', {
      targetWallet,
      walletAddress,
      isOwnProfile,
      onlyVerified,
      hasAuth: !!walletAddress
    })

    const { data: entries, error } = await query

    if (error) {
      console.error('❌ Error fetching entries:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return errorResponse('Failed to fetch entries', 500)
    }

    console.log('✅ Entries fetched successfully:', { count: entries?.length || 0 })
    return successResponse({ entries: entries || [] })
  } catch (error: any) {
    console.error('Error in get-entries:', error)
    
    // Return 403 for authentication errors (only if auth was required)
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

