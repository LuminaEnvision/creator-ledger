import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

// Admin wallet addresses - should match frontend ADMIN_WALLETS
// In production, consider storing this in environment variables or database
const ADMIN_WALLETS = [
  '0x7D85fCbB505D48E6176483733b62b51704e0bF95'.toLowerCase(),
  '0xD76C1a451B7d52405b6f4f8Ee3c04989B656e9Bf'.toLowerCase(),
]

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
    
    // Verify user is admin
    const isAdmin = ADMIN_WALLETS.some(
      admin => admin.toLowerCase() === walletAddress.toLowerCase()
    )

    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }
    
    // Parse request body
    const body = await req.json()
    const { entry_id, reason } = body

    // Validate required fields
    if (!entry_id) {
      return errorResponse('Missing required field: entry_id', 400)
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Verify entry exists
    const { data: entry, error: fetchError } = await supabase
      .from('ledger_entries')
      .select('id, wallet_address')
      .eq('id', entry_id)
      .single()

    if (fetchError || !entry) {
      return errorResponse('Entry not found', 404)
    }

    // Update entry status to Rejected
    const { data: updatedEntry, error: updateError } = await supabase
      .from('ledger_entries')
      .update({ 
        verification_status: 'rejected',
        // Optionally store rejection reason in a notes field if you have one
      })
      .eq('id', entry_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting entry:', updateError)
      return errorResponse('Failed to reject entry', 500)
    }

    // Optionally create a notification for the creator
    // (You can add this if you want to notify users when their entry is rejected)
    // await supabase.from('user_notifications').insert({...})

    return successResponse({ entry: updatedEntry })
  } catch (error: any) {
    console.error('Error in admin-reject-entry:', error)
    
    // Handle authentication errors
    if (error.message?.includes('UNAUTHORIZED')) {
      return errorResponse(error.message, 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

