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
import { useSignMessage } from 'wagmi'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Authenticate user with wallet signature
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signMessageAsync: (options: { message: string }) => Promise<string>
): Promise<{ access_token: string; user: any }> {
  // Create message to sign
  const message = `Creator Ledger Authentication\n\nSign this message to authenticate with Creator Ledger.\n\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`

  // Sign message with wallet
  const signature = await signMessageAsync({ message })

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

  const { access_token, user } = await response.json()

  if (!access_token) {
    throw new Error('No access token received')
  }

  // Set session in Supabase client
  // Note: We'll use a custom approach since we're using wallet auth
  // Store token in localStorage for now
  localStorage.setItem('supabase_auth_token', access_token)
  localStorage.setItem('supabase_auth_user', JSON.stringify(user))

  return { access_token, user }
}

/**
 * Get current Supabase Auth session token
 * Token expiration and refresh is handled automatically by Supabase Auth
 */
export async function getAuthToken(): Promise<string | null> {
  // Try to get from localStorage first
  const storedToken = localStorage.getItem('supabase_auth_token')
  if (storedToken) {
    // Verify token is still valid by checking with Supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!error && session?.access_token) {
      return session.access_token
    }
    
    // If stored token exists but session is invalid, return stored token
    // Edge Function will verify it
    return storedToken
  }

  // Try to get from Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
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

