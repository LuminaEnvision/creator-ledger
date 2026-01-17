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
  
  // Immediately return 403 if no authorization header (best practice: return 403 immediately for invalid tokens)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED: Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create Supabase client with service role key for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify token - Supabase Auth handles expiration and refresh automatically
  // We just need to verify the token is valid and extract user info
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    // Immediately return 403 if token is invalid or expired
    if (error || !user) {
      throw new Error('UNAUTHORIZED: Invalid or expired token')
    }
    
    // Extract wallet address from user metadata
    const walletAddress = user.user_metadata?.wallet_address || user.user_metadata?.address
    
    // Immediately return 403 if wallet address not found
    if (!walletAddress) {
      throw new Error('UNAUTHORIZED: Wallet address not found in user metadata')
    }
    
    return walletAddress.toLowerCase()
  } catch (e: any) {
    // Re-throw with UNAUTHORIZED prefix to ensure 403 response
    if (e.message?.includes('UNAUTHORIZED')) {
      throw e
    }
    throw new Error('UNAUTHORIZED: Token verification failed')
  }
}

/**
 * Creates a Supabase client with service role key for admin operations
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

/**
 * Creates a CORS response
 */
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  }
}

/**
 * Creates a CORS preflight response (for OPTIONS requests)
 */
export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  })
}

/**
 * Creates an error response
 * 
 * IMPORTANT: UNAUTHORIZED errors should always return 403 status
 */
export function errorResponse(message: string, status: number = 400) {
  // Ensure authentication errors return 403 (best practice: immediately return 403 for invalid tokens)
  if (message.includes('UNAUTHORIZED') || message.includes('Unauthorized')) {
    status = 403
  }
  
  return new Response(
    JSON.stringify({ error: message.replace('UNAUTHORIZED: ', '') }),
    { 
      status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Creates a success response
 */
export function successResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    }
  )
}
