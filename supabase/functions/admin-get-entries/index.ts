import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsHeaders } from '../_shared/auth.ts'

// Admin wallet addresses
const ADMIN_WALLETS = [
  '0x7d85fcbb505d48e6176483733b62b51704e0bf95',
  '0xd76c1a451b7d52405b6f4f8ee3c04989b656e9bf'
].map(addr => addr.toLowerCase())

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Authenticate user
    const walletAddress = await authenticateUser(req)
    
    // Check if user is admin
    if (!ADMIN_WALLETS.includes(walletAddress.toLowerCase())) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Get all entries
    const { data: entries, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error)
      return errorResponse('Failed to fetch entries', 500)
    }

    return successResponse({ entries: entries || [] })
  } catch (error: any) {
    console.error('Error in admin-get-entries:', error)
    
    // Return 403 for authentication errors
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

