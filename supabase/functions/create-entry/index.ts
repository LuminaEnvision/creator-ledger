import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

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
    
    // Parse request body
    const body = await req.json()
    const {
      url,
      platform,
      description,
      campaign_tag,
      timestamp,
      content_published_at,
      payload_hash,
      content_hash,
      verification_status,
      title,
      image_url,
      custom_image_url,
      site_name,
      signature
    } = body

    // Validate required fields
    if (!url || !platform || !payload_hash) {
      return errorResponse('Missing required fields: url, platform, payload_hash', 400)
    }

    // Create admin client
    const supabase = createAdminClient()
    
    // Insert entry
    const { data: entry, error } = await supabase
      .from('ledger_entries')
      .insert([{
        wallet_address: walletAddress,
        url,
        platform,
        description: description || null,
        campaign_tag: campaign_tag || null,
        timestamp: timestamp || new Date().toISOString(),
        content_published_at: content_published_at || null,
        payload_hash,
        content_hash: content_hash || null,
        verification_status: verification_status || 'Unverified',
        title: title || null,
        image_url: image_url || null,
        custom_image_url: custom_image_url || null,
        site_name: site_name || null,
        signature: signature || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating entry:', error)
      return errorResponse('Failed to create entry', 500)
    }

    return successResponse({ entry })
  } catch (error: any) {
    console.error('Error in create-entry:', error)
    
    // Immediately return 403 for authentication errors (best practice: return 403 immediately for invalid tokens)
    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Missing') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return errorResponse('Unauthorized', 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

