import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Parse request body
    const body = await req.json()
    const { is_premium, subscription_active, subscription_start, subscription_end } = body
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Update user
    const updateData: any = {}
    if (is_premium !== undefined) updateData.is_premium = is_premium
    if (subscription_active !== undefined) updateData.subscription_active = subscription_active
    if (subscription_start !== undefined) updateData.subscription_start = subscription_start
    if (subscription_end !== undefined) updateData.subscription_end = subscription_end

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return errorResponse('Failed to update user', 500)
    }

    return successResponse({ user: updatedUser })
  } catch (error: any) {
    console.error('Error in update-user:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

