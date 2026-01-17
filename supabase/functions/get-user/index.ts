import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('wallet_address, created_at, is_premium, subscription_active, subscription_end')
      .eq('wallet_address', walletAddress)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user:', error)
      return errorResponse('Failed to fetch user', 500)
    }

    return successResponse({ user: user || null })
  } catch (error: any) {
    console.error('Error in get-user:', error)
    
    // Immediately return 403 for authentication errors (best practice: return 403 immediately for invalid tokens)
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

