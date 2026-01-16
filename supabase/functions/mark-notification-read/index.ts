import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Parse request body
    const body = await req.json()
    const { notification_id } = body

    if (!notification_id) {
      return errorResponse('notification_id is required', 400)
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Update notification
    const { data: notification, error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notification_id)
      .eq('wallet_address', walletAddress) // Ensure user can only mark their own notifications as read
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return errorResponse('Failed to mark notification as read', 500)
    }

    return successResponse({ notification })
  } catch (error: any) {
    console.error('Error in mark-notification-read:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

