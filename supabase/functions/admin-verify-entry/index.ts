import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

// Admin wallet addresses (should match your admin.ts file)
const ADMIN_WALLETS = [
  '0x7d85fcbb505d48e6176483733b62b51704e0bf95',
  '0xd76c1a451b7d52405b6f4f8ee3c04989b656e9bf'
].map(addr => addr.toLowerCase())

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
    
    // Check if user is admin
    if (!ADMIN_WALLETS.includes(walletAddress.toLowerCase())) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }
    
    // Parse request body
    const body = await req.json()
    const { entry_id } = body

    if (!entry_id) {
      return errorResponse('entry_id is required', 400)
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Get entry
    const { data: entry } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('id', entry_id)
      .single()

    if (!entry) {
      return errorResponse('Entry not found', 404)
    }

    // Update verification status
    const { data: updatedEntry, error } = await supabase
      .from('ledger_entries')
      .update({ verification_status: 'Verified' })
      .eq('id', entry_id)
      .select()
      .single()

    if (error) {
      console.error('Error verifying entry:', error)
      return errorResponse('Failed to verify entry', 500)
    }

    // Create notification for the creator
    await supabase
      .from('user_notifications')
      .insert({
        wallet_address: entry.wallet_address.toLowerCase(),
        type: 'verified',
        entry_id,
        message: 'Your content was verified! Claim your Creator Passport level.',
        read: false
      })

    return successResponse({ entry: updatedEntry })
  } catch (error: any) {
    console.error('Error in admin-verify-entry:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

