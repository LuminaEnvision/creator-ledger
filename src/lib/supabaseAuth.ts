/**
 * Supabase Auth integration for wallet-based authentication
 * 
 * This module handles wallet authentication with Supabase Auth:
 * 1. User signs a message with their wallet
 * 2. We send signature to Edge Function for verification
 * 3. Edge Function creates/updates Supabase Auth user
 * 4. We get JWT token and store it
 * 5. Token automatically refreshes via Supabase Auth
 */

import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Authenticate user with wallet signature
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signMessageAsync: (options: { message: string }) => Promise<string>
): Promise<{ access_token: string; user: any }> {
  // Validate signMessageAsync is callable
  if (!signMessageAsync || typeof signMessageAsync !== 'function') {
    throw new Error('Wallet signing function not available. Please ensure your wallet is connected.')
  }

  // Create message to sign
  const message = `Creator Ledger Authentication\n\nSign this message to authenticate with Creator Ledger.\n\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`

  console.log('📝 Requesting message signature...', { walletAddress, messageLength: message.length })

  // Sign message with wallet
  // Add retry logic for connector readiness issues
  let signature: string | undefined
  let lastError: any = null
  const maxRetries = 3
  const retryDelay = 500 // ms
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait a bit before retrying (except first attempt)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        console.log(`🔄 Retrying message signature (attempt ${attempt + 1}/${maxRetries})...`)
      }
      
      signature = await signMessageAsync({ message })
      console.log('✅ Message signed successfully')
      break // Success, exit retry loop
    } catch (signError: any) {
      lastError = signError
      console.error(`❌ Message signing failed (attempt ${attempt + 1}/${maxRetries}):`, signError)
      
      // Don't retry if user cancelled
      if (signError.code === 4001) {
        throw new Error('Message signing was cancelled by user')
      }
      
      // Don't retry if it's not a connector error (on last attempt)
      if (attempt === maxRetries - 1) {
        if (signError.message?.includes('connector') || signError.message?.includes('getChainId')) {
          throw new Error('Wallet connector not ready. Please reconnect your wallet and try again.')
        } else {
          throw new Error(`Failed to sign message: ${signError.message || 'Unknown error'}`)
        }
      }
      
      // If it's a connector error and we have retries left, continue to retry
      if (signError.message?.includes('connector') || signError.message?.includes('getChainId')) {
        continue // Retry
      } else {
        // Non-connector error, don't retry
        throw new Error(`Failed to sign message: ${signError.message || 'Unknown error'}`)
      }
    }
  }
  
  // If we get here without a signature, throw the last error
  if (!signature) {
    if (lastError?.message?.includes('connector') || lastError?.message?.includes('getChainId')) {
      throw new Error('Wallet connector not ready. Please reconnect your wallet and try again.')
    }
    throw new Error(`Failed to sign message: ${lastError?.message || 'Unknown error'}`)
  }

  // Send to Edge Function for verification and token generation
  console.log('📤 Sending auth request to Edge Function:', {
    walletAddress,
    signatureLength: signature.length,
    messageLength: message.length,
    messagePreview: message.substring(0, 100)
  })

  // CRITICAL: Supabase Edge Functions require 'apikey' header for ALL requests
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-with-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SUPABASE_ANON_KEY && { 'apikey': SUPABASE_ANON_KEY }),
    },
    body: JSON.stringify({
      walletAddress,
      signature,
      message,
    }),
  })

  if (!response.ok) {
    let errorDetails: any = { error: response.statusText }
    try {
      const errorText = await response.text()
      console.error('❌ Auth Edge Function error response (raw):', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      })
      
      // Try to parse as JSON
      try {
        errorDetails = JSON.parse(errorText)
        console.error('❌ Auth Edge Function error response (parsed):', JSON.stringify(errorDetails, null, 2))
      } catch (parseError) {
        console.error('❌ Failed to parse error as JSON, using raw text:', errorText)
        errorDetails = { error: errorText }
      }
    } catch (e) {
      console.error('❌ Failed to read error response:', e)
    }
    
    const errorMessage = errorDetails.error || errorDetails.details || `Authentication failed with status ${response.status}`
    console.error('❌ Throwing error:', errorMessage)
    throw new Error(errorMessage)
  }

  const { access_token, refresh_token, user } = await response.json()

  if (!access_token) {
    throw new Error('No access token received')
  }

  console.log('✅ Received token from auth-with-wallet:', {
    hasAccessToken: !!access_token,
    hasRefreshToken: !!refresh_token,
    tokenLength: access_token.length,
    tokenPrefix: access_token.substring(0, 50) + '...',
    tokenSuffix: '...' + access_token.substring(access_token.length - 20),
    isJWT: access_token.split('.').length === 3, // JWT has 3 parts separated by dots
  })

  // Set the session in Supabase client using setSession
  // This properly initializes the Supabase Auth session
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token || access_token, // Use refresh_token if provided
  })

  if (sessionError) {
    console.error('❌ Error setting Supabase session:', {
      error: sessionError.message,
      errorCode: sessionError.status,
      fullError: JSON.stringify(sessionError, null, 2)
    })
    console.warn('⚠️ Falling back to manual token storage')
    // Fallback: Store token manually if setSession fails
    localStorage.setItem('supabase_auth_token', access_token)
    if (refresh_token) {
      localStorage.setItem('supabase_auth_refresh_token', refresh_token)
    }
    localStorage.setItem('supabase_auth_user', JSON.stringify(user))
  } else {
    console.log('✅ Supabase session set successfully:', {
      hasSession: !!sessionData.session,
      hasAccessToken: !!sessionData.session?.access_token,
      userId: sessionData.user?.id
    })
  }

  return { access_token, user }
}

/**
 * Get current Supabase Auth session token
 * Token expiration and refresh is handled automatically by Supabase Auth
 */
export async function getAuthToken(): Promise<string | null> {
  // First, try to get from Supabase session (this handles token refresh automatically)
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (!error && session?.access_token) {
    console.log('✅ Got token from Supabase session:', {
      tokenLength: session.access_token.length,
      tokenPrefix: session.access_token.substring(0, 30) + '...',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })
    return session.access_token
  }
  
  if (error) {
    console.warn('⚠️ Error getting Supabase session:', error.message)
  }

  // Fallback: Try to get from localStorage (for manually stored tokens)
  const storedToken = localStorage.getItem('supabase_auth_token')
  if (storedToken) {
    // Try to refresh the session if we have a refresh token
    const storedRefreshToken = localStorage.getItem('supabase_auth_refresh_token')
    if (storedRefreshToken) {
      try {
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: storedRefreshToken
        })
        if (!refreshError && refreshedSession?.session?.access_token) {
          return refreshedSession.session.access_token
        }
      } catch (e) {
        console.warn('Error refreshing session:', e)
      }
    }
    
    // Return stored token as fallback (Edge Function will verify it)
    return storedToken
  }

  return null
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  localStorage.removeItem('supabase_auth_token')
  localStorage.removeItem('supabase_auth_user')
  await supabase.auth.signOut()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}

