import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Authenticate user (optional for public profiles)
    let walletAddress: string | null = null
    try {
      walletAddress = await authenticateUser(req)
    } catch {
      // Allow unauthenticated requests for public profiles
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

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching entries:', error)
      return errorResponse('Failed to fetch entries', 500)
    }

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

