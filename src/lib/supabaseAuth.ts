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
  let signature: string
  try {
    signature = await signMessageAsync({ message })
    console.log('✅ Message signed successfully')
  } catch (signError: any) {
    console.error('❌ Message signing failed:', signError)
    // Re-throw with more context
    if (signError.code === 4001) {
      throw new Error('Message signing was cancelled by user')
    } else if (signError.message?.includes('connector') || signError.message?.includes('getChainId')) {
      throw new Error('Wallet connector not ready. Please reconnect your wallet.')
    } else {
      throw new Error(`Failed to sign message: ${signError.message || 'Unknown error'}`)
    }
  }

  // Send to Edge Function for verification and token generation
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-with-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      signature,
      message,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || 'Authentication failed')
  }

  const { access_token, refresh_token, user } = await response.json()

  if (!access_token) {
    throw new Error('No access token received')
  }

  // Set the session in Supabase client using setSession
  // This properly initializes the Supabase Auth session
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token || access_token, // Use refresh_token if provided
  })

  if (sessionError) {
    console.warn('Error setting Supabase session, storing token manually:', sessionError)
    // Fallback: Store token manually if setSession fails
    localStorage.setItem('supabase_auth_token', access_token)
    if (refresh_token) {
      localStorage.setItem('supabase_auth_refresh_token', refresh_token)
    }
    localStorage.setItem('supabase_auth_user', JSON.stringify(user))
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
    return session.access_token
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

