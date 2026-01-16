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
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle()

    if (existingUser) {
      return successResponse({ user: existingUser, created: false })
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ wallet_address: walletAddress }])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return errorResponse('Failed to create user', 500)
    }

    return successResponse({ user: newUser, created: true })
  } catch (error: any) {
    console.error('Error in create-user:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

