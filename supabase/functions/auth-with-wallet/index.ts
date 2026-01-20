import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { verifyMessage, getAddress } from 'https://esm.sh/viem@2.43.3'
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'
import { validateWalletAddress } from '../_shared/validation.ts'

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
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }

  try {
    // Rate limiting by IP (before authentication)
    const rateLimitId = getRateLimitIdentifier(req, null) // No wallet address yet
    const rateLimit = checkRateLimit({
      ...RATE_LIMITS.AUTH_WITH_WALLET,
      identifier: rateLimitId
    })
    
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded for auth:', { identifier: rateLimitId })
      return rateLimitResponse(rateLimit.resetAt)
    }
    
    console.log('🔥 auth-with-wallet called', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    })

    const body = await req.json()
    const { walletAddress, signature, message } = body
    
    // Validate wallet address format
    const walletValidation = validateWalletAddress(walletAddress)
    if (!walletValidation.valid) {
      return new Response(
        JSON.stringify({ error: walletValidation.error }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }
    
    // Validate signature format (should be hex string)
    if (!signature || typeof signature !== 'string' || !/^0x[a-fA-F0-9]+$/.test(signature)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature format' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }
    
    // Validate message (should be non-empty string)
    if (!message || typeof message !== 'string' || message.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    console.log('📥 Received auth request:', {
      hasWalletAddress: !!walletAddress,
      hasSignature: !!signature,
      hasMessage: !!message,
      walletAddress: walletAddress,
      signatureLength: signature?.length,
      messageLength: message?.length,
      messagePreview: message?.substring(0, 150)
    })

    if (!walletAddress || !signature || !message) {
      console.error('❌ Missing required fields:', {
        walletAddress: !!walletAddress,
        signature: !!signature,
        message: !!message
      })
      return new Response(
        JSON.stringify({ error: 'Missing walletAddress, signature, or message' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    // CRITICAL FIX: Use checksum address format for signature verification
    // verifyMessage recovers signer from signature and compares against address
    // Checksum mismatch = invalid signature (silently fails)
    // Never use .toLowerCase() before verifyMessage!
    let checksumAddress: string
    try {
      checksumAddress = getAddress(walletAddress)
      console.log('✅ Address normalized to checksum:', {
        original: walletAddress,
        checksum: checksumAddress,
        match: walletAddress.toLowerCase() === checksumAddress.toLowerCase()
      })
    } catch (addressError: any) {
      console.error('❌ Invalid wallet address format:', addressError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid wallet address format',
          details: addressError.message 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }
    
    console.log('🔐 Verifying signature:', {
      originalAddress: walletAddress,
      checksumAddress: checksumAddress,
      messageLength: message.length,
      messageFull: message, // Log full message for debugging
      signaturePrefix: signature.substring(0, 30) + '...',
      signatureFull: signature, // Log full signature for debugging
      signatureLength: signature.length,
      signatureStartsWith0x: signature.startsWith('0x'),
      messageStartsWith0x: message.startsWith('0x')
    })
    
    // Verify signature
    let isValid = false
    try {
      // Ensure signature starts with 0x
      const normalizedSignature = signature.startsWith('0x') 
        ? signature as `0x${string}`
        : `0x${signature}` as `0x${string}`
      
      console.log('🔍 Calling verifyMessage with:', {
        address: checksumAddress,
        messageLength: message.length,
        signatureLength: normalizedSignature.length,
        signaturePrefix: normalizedSignature.substring(0, 30)
      })
      
      isValid = await verifyMessage({
        address: checksumAddress,
        message,
        signature: normalizedSignature,
      })
      
      console.log('✅ Signature verification result:', { 
        isValid, 
        checksumAddress,
        messageLength: message.length,
        signatureLength: normalizedSignature.length,
        note: isValid ? 'Signature is valid!' : 'Signature verification returned false'
      })
    } catch (verifyError: any) {
      console.error('❌ Signature verification error:', {
        error: verifyError.message,
        stack: verifyError.stack,
        checksumAddress,
        messageLength: message.length,
        signatureLength: signature.length,
        messagePreview: message.substring(0, 150)
      })
      return new Response(
        JSON.stringify({ 
          error: 'Signature verification failed',
          details: verifyError.message 
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    if (!isValid) {
      console.error('❌ Signature is invalid (verifyMessage returned false):', {
        checksumAddress,
        messageLength: message.length,
        signatureLength: signature.length,
        messagePreview: message.substring(0, 150),
        note: 'This usually means the signature does not match the message and address'
      })
      return new Response(
        JSON.stringify({ 
          error: 'Invalid signature',
          details: 'The signature does not match the message and wallet address'
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
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
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        )
      }

      authUser = newUser.user
    }

    // Generate a JWT access token for the user
    // Use GoTrue admin API to create a session - this generates a proper user JWT
    const projectUrl = Deno.env.get('PROJECT_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    
    console.log('🔐 Creating session for user via GoTrue admin API:', { userId: authUser.id, email })
    
    // Try GoTrue admin API session creation endpoint
    // This should return a valid user JWT token
    const sessionUrl = `${projectUrl}/auth/v1/admin/users/${authUser.id}/sessions`
    const sessionResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (sessionResponse.ok) {
      try {
        const sessionData = await sessionResponse.json()
        console.log('✅ Session created via GoTrue admin API:', {
          hasAccessToken: !!sessionData.access_token,
          hasRefreshToken: !!sessionData.refresh_token,
          responseKeys: Object.keys(sessionData)
        })
        
        if (sessionData.access_token) {
          return new Response(
            JSON.stringify({
              user: authUser,
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token || sessionData.access_token,
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
      } catch (jsonError: any) {
        console.error('Error parsing session response:', jsonError)
      }
    }
    
    // If GoTrue admin API didn't work, fall back to password grant
    const errorText = sessionResponse.ok ? '' : await sessionResponse.text()
    console.warn('⚠️ GoTrue admin API session creation failed, trying password grant:', {
      status: sessionResponse.status,
      error: errorText.substring(0, 200)
    })
    
    // Fallback: Use password grant with anon key from request headers
    // Get anon key from request headers (frontend sends it)
    const requestAnonKey = req.headers.get('apikey')
    const anonKey = requestAnonKey || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
    
    if (!anonKey) {
      console.error('❌ ANON_KEY not found in headers or environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: ANON_KEY not available',
          user: authUser,
          note: 'User was created but token generation failed. Please try signing in again.'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }
    
    // Generate a secure temporary password
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Update user with temporary password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: tempPassword,
    })

    if (updateError) {
      console.error('Error setting temporary password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to set temporary password', details: updateError.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    // Use password grant to get access token
    const tokenUrl = `${projectUrl}/auth/v1/token?grant_type=password`
    console.log('🔑 Using password grant as fallback')
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: tempPassword,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Password grant also failed:', {
        status: tokenResponse.status,
        error: errorText
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate authentication token',
          details: errorText,
          user: authUser
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Token generated via password grant:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token
    })

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: 'Token response missing access_token' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    // Remove the temporary password for security
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: null,
    })

    return new Response(
      JSON.stringify({
        user: authUser,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
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
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

