import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, successResponse, corsPreflightResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // 🔥 STEP 1: PROVE FUNCTION IS RUNNING
  console.log("🔥 get-entries called", {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  // 🔥 STEP 3: VERIFY ENVIRONMENT VARIABLES
  const projectUrl = Deno.env.get('PROJECT_URL')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
  
  console.log("ENV CHECK", {
    hasUrl: !!projectUrl,
    hasServiceKey: !!serviceRoleKey,
    urlPrefix: projectUrl?.substring(0, 30) + '...' || 'MISSING',
    keyPrefix: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'MISSING'
  })

  // 🔥 STEP 4: LOG PROJECT URL
  console.log("EDGE SUPABASE URL", projectUrl || 'NOT SET')

  try {
    // CRITICAL: Explicitly handle public vs authenticated requests
    // Public reads should work WITHOUT auth token to avoid RLS filtering issues
    const authHeader = req.headers.get('Authorization')
    let walletAddress: string | null = null
    
    // Only attempt authentication if token is present
    // This ensures public requests (no token) work correctly
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        walletAddress = await authenticateUser(req)
        console.log('✅ Authenticated request:', { walletAddress })
      } catch (authError) {
        // Token present but invalid - log but don't fail (public access allowed)
        console.warn('⚠️ Auth token invalid, proceeding as public request:', authError.message)
      }
    } else {
      console.log('📖 Public request (no auth token)')
    }

    // Get query parameters
    const url = new URL(req.url)
    const targetWallet = url.searchParams.get('wallet_address')
    const isOwnProfile = walletAddress && targetWallet?.toLowerCase() === walletAddress.toLowerCase()
    const onlyVerified = url.searchParams.get('only_verified') === 'true'
    
    // Create admin client
    const supabase = createAdminClient()
    
    // 🔥 STEP 2: TEST DIRECT DB QUERY (NO RLS EXCUSES)
    // Temporarily hardcode a simple query to verify DB access
    console.log("🔥 Testing direct DB query with service role...")
    const testQuery = await supabase
      .from('ledger_entries')
      .select('*')
      .limit(5)
    
    console.log("DB RESULT (test query):", {
      dataCount: testQuery.data?.length || 0,
      hasData: !!testQuery.data && testQuery.data.length > 0,
      error: testQuery.error ? {
        message: testQuery.error.message,
        code: testQuery.error.code,
        details: testQuery.error.details,
        hint: testQuery.error.hint
      } : null,
      sampleData: testQuery.data?.[0] || null
    })
    
    // 🔥 STEP 6: VERIFY TABLE & SCHEMA
    // Try explicit schema
    const testQueryExplicit = await supabase
      .from('public.ledger_entries')
      .select('*')
      .limit(1)
    
    console.log("DB RESULT (explicit schema):", {
      dataCount: testQueryExplicit.data?.length || 0,
      error: testQueryExplicit.error?.message || null
    })
    
    // Build query
    let query = supabase
      .from('ledger_entries')
      .select('*')

    // CRITICAL FIX: Always use lowercase for wallet_address queries
    // Database stores addresses in lowercase, but queries might use checksum format
    // PostgreSQL string comparison is case-sensitive, so we must normalize
    // Filter by wallet address if provided
    if (targetWallet) {
      // Normalize to lowercase to match database format
      const normalizedTarget = targetWallet.toLowerCase()
      console.log('🔍 Filtering by wallet (from query param):', { 
        original: targetWallet, 
        normalized: normalizedTarget 
      })
      query = query.eq('wallet_address', normalizedTarget)
    } else if (walletAddress) {
      // If authenticated and no target wallet, return user's own entries
      // walletAddress from authenticateUser is already lowercase, but ensure it
      const normalizedWallet = walletAddress.toLowerCase()
      console.log('🔍 Filtering by wallet (from auth):', { 
        original: walletAddress, 
        normalized: normalizedWallet 
      })
      query = query.eq('wallet_address', normalizedWallet)
    }

    // Filter by verification status
    if (onlyVerified || (!isOwnProfile && targetWallet)) {
      // Public profiles only show verified entries
      query = query.eq('verification_status', 'verified')
    }

    // Order by timestamp
    query = query.order('timestamp', { ascending: false })

    console.log('📊 Querying entries:', {
      targetWallet,
      walletAddress,
      isOwnProfile,
      onlyVerified,
      hasAuth: !!walletAddress
    })

    const { data: entries, error } = await query

    // 🔥 STEP 2: LOG ACTUAL QUERY RESULT
    console.log("DB RESULT (actual query):", {
      dataCount: entries?.length || 0,
      hasData: !!entries && entries.length > 0,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null,
      sampleEntry: entries?.[0] || null,
      allEntries: entries || []
    })

    if (error) {
      console.error('❌ Error fetching entries:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return errorResponse('Failed to fetch entries', 500)
    }

    console.log('✅ Entries fetched successfully:', { count: entries?.length || 0 })
    return successResponse({ entries: entries || [] })
  } catch (error: any) {
    console.error('Error in get-entries:', error)
    
    // CRITICAL: get-entries allows public access, so auth errors should not block the request
    // The error might be from authenticateUser, but we should never return 401/403 for public reads
    // Check if this is an auth error and if we were trying to authenticate
    const authHeader = req.headers.get('Authorization')
    const wasAuthenticatedRequest = authHeader && authHeader.startsWith('Bearer ')
    const isAuthError = error.message?.includes('UNAUTHORIZED') || 
                        error.message?.includes('Missing') || 
                        error.message?.includes('Invalid') || 
                        error.message?.includes('expired')
    
    if (isAuthError && wasAuthenticatedRequest) {
      // Authenticated request failed - return 403
      console.warn('⚠️ Authenticated request failed, returning 403')
      return errorResponse('Unauthorized', 403)
    }
    
    // For public requests with auth errors, log but don't fail
    // This can happen if someone sends an invalid token - we should ignore it for public reads
    if (isAuthError && !wasAuthenticatedRequest) {
      console.warn('⚠️ Auth error on public request (ignoring):', error.message)
      // Return empty entries instead of error for public reads
      return successResponse({ entries: [] })
    }
    
    // For other errors, return 500
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

