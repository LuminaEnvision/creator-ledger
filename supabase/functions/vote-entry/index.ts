import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'
import { validateVoteEntryPayload } from '../_shared/validation.ts'
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Rate limiting (after authentication)
    const rateLimitId = getRateLimitIdentifier(req, walletAddress)
    const rateLimit = checkRateLimit({
      ...RATE_LIMITS.VOTE_ENTRY,
      identifier: rateLimitId
    })
    
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded:', { identifier: rateLimitId })
      return rateLimitResponse(rateLimit.resetAt)
    }
    
    // Parse request body
    const body = await req.json()
    
    // Comprehensive input validation
    const validation = validateVoteEntryPayload(body)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid input', 400)
    }
    
    const { entry_id, vote_type, signature } = body

    // Create admin client
    const supabase = createAdminClient()
    
    // Get entry to check ownership
    const { data: entry } = await supabase
      .from('ledger_entries')
      .select('wallet_address')
      .eq('id', entry_id)
      .single()

    if (!entry) {
      return errorResponse('Entry not found', 404)
    }

    // Prevent self-voting
    if (entry.wallet_address.toLowerCase() === walletAddress.toLowerCase()) {
      return errorResponse('Cannot vote on your own entry', 400)
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('entry_endorsements')
      .select('*')
      .eq('entry_id', entry_id)
      .eq('endorser_wallet', walletAddress)
      .maybeSingle()

    let result
    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        return errorResponse(`Already ${vote_type}d this entry`, 400)
      }
      // Update existing vote
      result = await supabase
        .from('entry_endorsements')
        .update({
          vote_type: vote_type,
          signature: signature || null,
          created_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single()
    } else {
      // Create new vote
      result = await supabase
        .from('entry_endorsements')
        .insert([{
          entry_id,
          endorser_wallet: walletAddress,
          vote_type,
          signature: signature || null
        }])
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error voting on entry:', result.error)
      return errorResponse('Failed to vote on entry', 500)
    }

    // Create notification if endorsing
    if (vote_type === 'endorse') {
      await supabase
        .from('user_notifications')
        .insert({
          wallet_address: entry.wallet_address.toLowerCase(),
          type: 'endorsement',
          entry_id,
          endorser_wallet: walletAddress,
          message: `Your content was endorsed by ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}!`,
          read: false
        })
    }

    return successResponse({ vote: result.data })
  } catch (error: any) {
    console.error('Error in vote-entry:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

