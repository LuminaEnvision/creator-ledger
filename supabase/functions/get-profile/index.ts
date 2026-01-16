import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const targetWallet = url.searchParams.get('wallet_address')
    
    // Authenticate user (optional for public profiles)
    let walletAddress: string | null = null
    try {
      walletAddress = await authenticateUser(req)
    } catch {
      // Allow unauthenticated requests for public profiles
    }

    const requestedWallet = targetWallet?.toLowerCase() || walletAddress?.toLowerCase()
    
    if (!requestedWallet) {
      return errorResponse('wallet_address parameter is required', 400)
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Get profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', requestedWallet)
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

