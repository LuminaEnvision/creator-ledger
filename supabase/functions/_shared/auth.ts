import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

/**
 * Authenticates the user from the request headers
 * 
 * IMPORTANT: Token expiration and refresh is handled automatically by Supabase Auth.
 * This function verifies the token and extracts the wallet address.
 * 
 * Returns the authenticated user's wallet address or throws an error that should result in 403
 */
export async function authenticateUser(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization')
  
  // Log incoming request for debugging
  console.log('🔐 Auth check:', {
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader?.substring(0, 20) + '...',
    method: req.method,
    url: req.url
  })
  
  // Immediately return 403 if no authorization header (best practice: return 403 immediately for invalid tokens)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid authorization header')
    throw new Error('UNAUTHORIZED: Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('📝 Token extracted:', { tokenLength: token.length, tokenPrefix: token.substring(0, 20) + '...' })
  
  // Verify environment variables are set
  const projectUrl = Deno.env.get('PROJECT_URL')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
  // Try to get anon key from environment or request headers (frontend sends it as apikey)
  const requestAnonKey = req.headers.get('apikey')
  const anonKey = requestAnonKey || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
  
  if (!projectUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:', { 
      hasProjectUrl: !!projectUrl, 
      hasServiceRoleKey: !!serviceRoleKey 
    })
    throw new Error('UNAUTHORIZED: Server configuration error')
  }

  // Try to decode JWT to see what's in it (for debugging)
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      console.log('🔍 JWT payload:', {
        sub: payload.sub,
        aud: payload.aud,
        iss: payload.iss,
        exp: payload.exp,
        iat: payload.iat,
        email: payload.email,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
        isExpired: payload.exp ? Date.now() > payload.exp * 1000 : 'unknown'
      })
    }
  } catch (decodeError) {
    console.warn('⚠️ Could not decode JWT:', decodeError)
  }

  // Create Supabase client with service role key for admin operations
  const supabaseAdmin = createClient(projectUrl, serviceRoleKey)

  // Verify token - Supabase Auth handles expiration and refresh automatically
  // We just need to verify the token is valid and extract user info
  try {
    console.log('🔍 Verifying token with Supabase Auth (service role)...', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 50) + '...',
      tokenSuffix: '...' + token.substring(token.length - 20)
    })
    
    let user, error
    let verificationMethod = 'service_role'
    
    // Try with service role key first
    const result = await supabaseAdmin.auth.getUser(token)
    user = result.data?.user
    error = result.error
    
    // If that fails and we have anon key, try with anon key
    if ((error || !user) && anonKey) {
      console.log('⚠️ Service role verification failed, trying with anon key...')
      verificationMethod = 'anon'
      const supabaseAnon = createClient(projectUrl, anonKey)
      const anonResult = await supabaseAnon.auth.getUser(token)
      user = anonResult.data?.user
      error = anonResult.error
    }
    
    // Immediately return 403 if token is invalid or expired
    if (error || !user) {
      console.error('❌ Token verification failed:', { 
        verificationMethod,
        error: error?.message,
        errorCode: error?.status,
        errorName: error?.name,
        hasUser: !!user,
        fullError: JSON.stringify(error, null, 2)
      })
      throw new Error('UNAUTHORIZED: Invalid or expired token')
    }
    
    console.log('✅ Token verified:', { userId: user.id, email: user.email })
    
    // Extract wallet address from user metadata
    const walletAddress = user.user_metadata?.wallet_address || user.user_metadata?.address
    
    // Immediately return 403 if wallet address not found
    if (!walletAddress) {
      console.error('❌ Wallet address not found in user metadata:', { 
        metadata: user.user_metadata 
      })
      throw new Error('UNAUTHORIZED: Wallet address not found in user metadata')
    }
    
    console.log('✅ Wallet address extracted:', { walletAddress: walletAddress.toLowerCase() })
    return walletAddress.toLowerCase()
  } catch (e: any) {
    // Re-throw with UNAUTHORIZED prefix to ensure 403 response
    if (e.message?.includes('UNAUTHORIZED')) {
      throw e
    }
    console.error('❌ Token verification exception:', e.message)
    throw new Error('UNAUTHORIZED: Token verification failed')
  }
}

/**
 * Creates a Supabase client with service role key for admin operations
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get('PROJECT_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? ''
  )
}

/**
 * Creates a CORS response
 * 
 * SECURITY: Uses ALLOWED_ORIGINS environment variable to restrict CORS.
 * Matches the request origin against allowed origins list.
 * Falls back to wildcard '*' in development if not set.
 * 
 * To configure in Supabase Dashboard:
 * 1. Go to Project Settings → Edge Functions → Environment Variables
 * 2. Add: ALLOWED_ORIGINS = https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173
 */
export function corsHeaders(req?: Request) {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS')
  const requestOrigin = req?.headers.get('Origin')
  
  // Parse allowed origins into array
  const allowedOrigins = allowedOriginsEnv 
    ? allowedOriginsEnv.split(',').map(o => o.trim())
    : []
  
  // If we have allowed origins, check if request origin matches
  let allowedOrigin: string
  if (allowedOrigins.length > 0) {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      // Request origin is in allowed list - use it
      allowedOrigin = requestOrigin
      console.log('✅ CORS: Allowed origin matched:', requestOrigin)
    } else {
      // Request origin not in allowed list - use first allowed origin as fallback
      // This ensures CORS headers are always set, but may cause issues
      allowedOrigin = allowedOrigins[0]
      console.warn('⚠️ CORS: Request origin not in allowed list:', {
        requestOrigin,
        allowedOrigins,
        usingFallback: allowedOrigin
      })
    }
  } else {
    // No allowed origins configured - use wildcard (development only)
    allowedOrigin = '*'
    console.warn('⚠️ ALLOWED_ORIGINS not set - using wildcard CORS (INSECURE for production)')
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  }
}

/**
 * Creates a CORS preflight response (for OPTIONS requests)
 */
export function corsPreflightResponse(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req)
  })
}

/**
 * Creates an error response
 * 
 * IMPORTANT: UNAUTHORIZED errors should always return 403 status
 */
export function errorResponse(message: string, status: number = 400, req?: Request) {
  // Ensure authentication errors return 403 (best practice: immediately return 403 for invalid tokens)
  if (message.includes('UNAUTHORIZED') || message.includes('Unauthorized')) {
    status = 403
  }
  
  return new Response(
    JSON.stringify({ error: message.replace('UNAUTHORIZED: ', '') }),
    { 
      status,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Creates a success response
 */
export function successResponse(data: any, status: number = 200, req?: Request) {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    }
  )
}
