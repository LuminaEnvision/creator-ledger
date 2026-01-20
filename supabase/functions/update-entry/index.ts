import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'
import { validateUpdateEntryPayload } from '../_shared/validation.ts'
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Rate limiting (after authentication)
    const rateLimitId = getRateLimitIdentifier(req, walletAddress)
    const rateLimit = checkRateLimit({
      ...RATE_LIMITS.UPDATE_ENTRY,
      identifier: rateLimitId
    })
    
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded:', { identifier: rateLimitId })
      return rateLimitResponse(rateLimit.resetAt)
    }
    
    // Parse request body
    const body = await req.json()
    
    // Comprehensive input validation
    const validation = validateUpdateEntryPayload(body)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid input', 400)
    }
    
    const {
      entry_id,
      description,
      custom_image_url,
      campaign_tag,
      tx_hash
    } = body

    // Create admin client
    const supabase = createAdminClient()
    
    // Verify user owns the entry (unless updating tx_hash, which is allowed for entry owner)
    const { data: entry, error: fetchError } = await supabase
      .from('ledger_entries')
      .select('wallet_address')
      .eq('id', entry_id)
      .single()

    if (fetchError || !entry) {
      return errorResponse('Entry not found', 404)
    }

    // For tx_hash updates, allow if user owns the entry
    // For other updates, user must own the entry
    if (entry.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return errorResponse('Unauthorized: You can only update your own entries', 403)
    }

    // Build update object
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (custom_image_url !== undefined) updateData.custom_image_url = custom_image_url
    if (campaign_tag !== undefined) updateData.campaign_tag = campaign_tag
    if (tx_hash !== undefined) updateData.tx_hash = tx_hash

    // Update entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('ledger_entries')
      .update(updateData)
      .eq('id', entry_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating entry:', updateError)
      return errorResponse('Failed to update entry', 500)
    }

    return successResponse({ entry: updatedEntry })
  } catch (error: any) {
    console.error('Error in update-entry:', error)
    
    // Handle authentication errors
    if (error.message?.includes('UNAUTHORIZED')) {
      return errorResponse(error.message, 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

