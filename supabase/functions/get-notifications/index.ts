import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Get query parameters
    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Build query
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return errorResponse('Failed to fetch notifications', 500)
    }

    return successResponse({ notifications: notifications || [] })
  } catch (error: any) {
    console.error('Error in get-notifications:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

