import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

/**
 * Authenticates the user from the request headers
 * Supports both Supabase Auth tokens and wallet signatures (for migration)
 * Returns the authenticated user's wallet address or throws an error
 */
export async function authenticateUser(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create Supabase client with service role key for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Try to verify as Supabase Auth JWT token first
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (!error && user) {
      // Extract wallet address from user metadata
      const walletAddress = user.user_metadata?.wallet_address || user.user_metadata?.address
      
      if (walletAddress) {
        return walletAddress.toLowerCase()
      }
    }
  } catch (e) {
    // Token is not a Supabase Auth token, might be a wallet signature
    // For now, we'll require Supabase Auth tokens
    // TODO: Remove this fallback once fully migrated to Supabase Auth
  }

  // If token verification fails, throw error
  throw new Error('Invalid or expired token')
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
  }
}

/**
 * Creates an error response
 */
export function errorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
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
