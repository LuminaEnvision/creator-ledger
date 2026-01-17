import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { verifyMessage } from 'https://esm.sh/viem@2.43.3'

/**
 * Authenticate user with wallet signature
 * 
 * Flow:
 * 1. User signs a message with their wallet
 * 2. Frontend sends wallet address + signature
 * 3. We verify the signature
 * 4. Create/update Supabase Auth user with wallet address in metadata
 * 5. Return JWT token
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { walletAddress, signature, message } = await req.json()

    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing walletAddress, signature, or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature
    const isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user exists in auth
    const normalizedAddress = walletAddress.toLowerCase()
    const email = `${normalizedAddress}@wallet.local` // Use wallet address as email
    
    // Try to find existing user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.user_metadata?.wallet_address?.toLowerCase() === normalizedAddress
    )

    let authUser
    if (existingUser) {
      // Update existing user metadata if needed
      if (existingUser.user_metadata?.wallet_address?.toLowerCase() !== normalizedAddress) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            wallet_address: normalizedAddress,
            address: normalizedAddress
          }
        })
      }
      authUser = existingUser
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          wallet_address: normalizedAddress,
          address: normalizedAddress
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      authUser = newUser.user
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError || !sessionData) {
      // Fallback: Create a custom token
      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      })

      if (tokenError) {
        console.error('Error generating token:', tokenError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate session' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          user: authUser,
          access_token: tokenData.properties?.hashed_token || null,
          // Note: In production, you'd want to use proper session management
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        user: authUser,
        access_token: sessionData.properties?.hashed_token || null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error: any) {
    console.error('Error in auth-with-wallet:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

