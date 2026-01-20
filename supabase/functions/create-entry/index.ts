import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse, corsHeaders } from '../_shared/auth.ts'
import { validateCreateEntryPayload } from '../_shared/validation.ts'
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
      ...RATE_LIMITS.CREATE_ENTRY,
      identifier: rateLimitId
    })
    
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded:', { identifier: rateLimitId })
      return rateLimitResponse(rateLimit.resetAt)
    }
    
    // Parse request body
    const body = await req.json()
    
    // Comprehensive input validation
    const validation = validateCreateEntryPayload(body)
    if (!validation.valid) {
      console.error('❌ Validation failed:', { error: validation.error, body: JSON.stringify(body).substring(0, 500) })
      return new Response(
        JSON.stringify({ 
          error: validation.error || 'Invalid input',
          message: validation.error || 'Please check your input and try again',
          details: { validation: validation.error }
        }),
        {
          status: 400,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        }
      )
    }
    
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

    // Create admin client
    const supabase = createAdminClient()
    
    console.log('📝 Creating entry:', {
      walletAddress,
      url,
      platform,
      hasContentHash: !!content_hash,
      hasPayloadHash: !!payload_hash
    })
    
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
        verification_status: verification_status || 'unverified',
        title: title || null,
        image_url: image_url || null,
        custom_image_url: custom_image_url || null,
        site_name: site_name || null,
        signature: signature || null
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating entry:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        walletAddress
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create entry',
          message: error.message || 'Database error occurred',
          details: { 
            code: error.code,
            hint: error.hint,
            details: error.details
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Entry created successfully:', { entryId: entry?.id, walletAddress })
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

