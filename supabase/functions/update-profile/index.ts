import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'
import { validateUpdateProfilePayload } from '../_shared/validation.ts'
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Rate limiting (after authentication)
    const rateLimitId = getRateLimitIdentifier(req, walletAddress)
    const rateLimit = checkRateLimit({
      ...RATE_LIMITS.UPDATE_PROFILE,
      identifier: rateLimitId
    })
    
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded:', { identifier: rateLimitId })
      return rateLimitResponse(rateLimit.resetAt)
    }
    
    // Parse request body
    const body = await req.json()
    
    // Comprehensive input validation
    const validation = validateUpdateProfilePayload(body)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid input', 400)
    }
    
    const { display_name, bio, avatar_url, banner_url } = body
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle()

    const updateData: any = {}
    if (display_name !== undefined) updateData.display_name = display_name
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (banner_url !== undefined) updateData.banner_url = banner_url

    let profile
    let error

    if (existingProfile) {
      // Update existing profile
      const result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select()
        .single()
      profile = result.data
      error = result.error
    } else {
      // Create new profile
      const result = await supabase
        .from('profiles')
        .insert([{
          wallet_address: walletAddress,
          ...updateData
        }])
        .select()
        .single()
      profile = result.data
      error = result.error
    }

    if (error) {
      console.error('Error updating profile:', error)
      return errorResponse('Failed to update profile', 500)
    }

    return successResponse({ profile })
  } catch (error: any) {
    console.error('Error in update-profile:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

