/**
 * Helper library for calling Supabase Edge Functions
 * 
 * IMPORTANT: This requires Supabase Auth integration.
 * Users must sign in with Supabase Auth to get a JWT token.
 * The token is automatically included in requests.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is not set. Edge Functions will not work.')
}

/**
 * Get the current user's Supabase Auth token
 * Token expiration and refresh is handled automatically by Supabase Auth
 */
async function getAuthToken(): Promise<string | null> {
  // Import dynamically to avoid circular dependencies
  const { getAuthToken: getToken } = await import('./supabaseAuth')
  return getToken()
}

/**
 * Call an Edge Function with authentication
 */
async function callEdgeFunction(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: any
    params?: Record<string, string>
  } = {}
): Promise<any> {
  const { method = 'GET', body, params } = options

  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('Authentication required. Please sign in with Supabase Auth.')
  }

  // Build URL with query parameters
  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Edge Function error: ${response.statusText}`)
  }

  return response.json()
}

// User operations
export const edgeFunctions = {
  // User operations
  async getUser() {
    return callEdgeFunction('get-user')
  },

  async createUser() {
    return callEdgeFunction('create-user', { method: 'POST' })
  },

  async updateUser(data: {
    is_premium?: boolean
    subscription_active?: boolean
    subscription_start?: string
    subscription_end?: string
  }) {
    return callEdgeFunction('update-user', {
      method: 'PATCH',
      body: data
    })
  },

  // Entry operations
  async createEntry(data: {
    url: string
    platform: string
    description?: string
    campaign_tag?: string
    timestamp?: string
    content_published_at?: string
    payload_hash: string
    content_hash?: string
    verification_status?: string
    title?: string
    image_url?: string
    custom_image_url?: string
    site_name?: string
    signature?: string
  }) {
    return callEdgeFunction('create-entry', {
      method: 'POST',
      body: data
    })
  },

  async getEntries(params?: {
    wallet_address?: string
    only_verified?: boolean
  }) {
    const queryParams: Record<string, string> = {}
    if (params?.wallet_address) queryParams.wallet_address = params.wallet_address
    if (params?.only_verified) queryParams.only_verified = 'true'

    return callEdgeFunction('get-entries', {
      params: queryParams
    })
  },

  // Profile operations
  async getProfile(walletAddress?: string) {
    return callEdgeFunction('get-profile', {
      params: walletAddress ? { wallet_address: walletAddress } : {}
    })
  },

  async updateProfile(data: {
    display_name?: string
    bio?: string
    avatar_url?: string
    banner_url?: string
  }) {
    return callEdgeFunction('update-profile', {
      method: 'PATCH',
      body: data
    })
  },

  // Endorsement operations
  async voteEntry(data: {
    entry_id: string
    vote_type: 'endorse' | 'dispute'
    signature?: string
  }) {
    return callEdgeFunction('vote-entry', {
      method: 'POST',
      body: data
    })
  },

  // Notification operations
  async getNotifications(unreadOnly?: boolean) {
    return callEdgeFunction('get-notifications', {
      params: unreadOnly ? { unread_only: 'true' } : {}
    })
  },

  async markNotificationRead(notificationId: string) {
    return callEdgeFunction('mark-notification-read', {
      method: 'POST',
      body: { notification_id: notificationId }
    })
  },

  // Admin operations
  async adminGetEntries() {
    return callEdgeFunction('admin-get-entries')
  },

  async adminVerifyEntry(entryId: string) {
    return callEdgeFunction('admin-verify-entry', {
      method: 'POST',
      body: { entry_id: entryId }
    })
  },
}

