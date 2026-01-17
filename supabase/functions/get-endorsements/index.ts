import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const entryId = url.searchParams.get('entry_id')
    
    if (!entryId) {
      return errorResponse('entry_id parameter is required', 400)
    }

    // Authenticate user (optional for public endorsement counts)
    let walletAddress: string | null = null
    try {
      walletAddress = await authenticateUser(req)
    } catch {
      // Allow unauthenticated requests for public endorsement counts
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Get endorsement counts
    const { count: endorseCount } = await supabase
      .from('entry_endorsements')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId)
      .eq('vote_type', 'endorse')

    const { count: disputeCount } = await supabase
      .from('entry_endorsements')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId)
      .eq('vote_type', 'dispute')

    // Get user's vote if authenticated
    let userVote = null
    if (walletAddress) {
      const { data: voteData } = await supabase
        .from('entry_endorsements')
        .select('vote_type')
        .eq('entry_id', entryId)
        .eq('endorser_wallet', walletAddress)
        .maybeSingle()
      
      userVote = voteData?.vote_type || null
    }

    // Get list of endorsers (if owner)
    const { data: endorsers } = await supabase
      .from('entry_endorsements')
      .select('endorser_wallet, created_at')
      .eq('entry_id', entryId)
      .eq('vote_type', 'endorse')
      .order('created_at', { ascending: false })

    return successResponse({
      endorseCount: endorseCount || 0,
      disputeCount: disputeCount || 0,
      userVote,
      endorsers: endorsers || []
    })
  } catch (error: any) {
    console.error('Error in get-endorsements:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

