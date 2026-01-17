/**
 * Helper library for calling Supabase Edge Functions
 * 
 * IMPORTANT: This requires Supabase Auth integration.
 * Users must sign in with Supabase Auth to get a JWT token.
 * The token is automatically included in requests.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

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
 * Call an Edge Function with optional authentication
 * 
 * For public read operations (get-entries, get-profile), auth is optional.
 * For write operations, auth is required.
 */
async function callEdgeFunction(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: any
    params?: Record<string, string>
    requireAuth?: boolean // If true, auth is required. If false/undefined, auth is optional.
  } = {}
): Promise<any> {
  const { method = 'GET', body, params, requireAuth = false } = options

  const token = await getAuthToken()
  
  // Only require auth if explicitly required (for write operations)
  if (requireAuth && !token) {
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
    'Content-Type': 'application/json',
  }

  // Only add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let errorMessage = `Edge Function error: ${response.statusText}`
    let errorDetails: any = {}
    
    try {
      errorDetails = await response.json()
      errorMessage = errorDetails.error || errorDetails.message || errorMessage
    } catch {
      // If response is not JSON, use status text
      errorMessage = `Edge Function error (${response.status}): ${response.statusText}`
    }
    
    // Add more context for common errors
    if (response.status === 401 || response.status === 403) {
      errorMessage = 'Authentication required. Please sign in with your wallet.'
    } else if (response.status === 400) {
      errorMessage = errorDetails.error || 'Invalid request. Please check your input.'
    } else if (response.status === 500) {
      errorMessage = errorDetails.error || 'Server error. Please try again later.'
    }
    
    const error = new Error(errorMessage)
    // Attach status code for better error handling
    ;(error as any).status = response.status
    ;(error as any).details = errorDetails
    throw error
  }

  return response.json()
}

// User operations
export const edgeFunctions = {
  // User operations (require auth - user-specific data)
  async getUser() {
    return callEdgeFunction('get-user', { requireAuth: true })
  },

  async createUser() {
    return callEdgeFunction('create-user', { method: 'POST', requireAuth: true })
  },

  async updateUser(data: {
    is_premium?: boolean
    subscription_active?: boolean
    subscription_start?: string
    subscription_end?: string
  }) {
    return callEdgeFunction('update-user', {
      method: 'PATCH',
      body: data,
      requireAuth: true
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
      body: data,
      requireAuth: true
    })
  },

  // Public read operation - auth optional (allows viewing entries without auth)
  async getEntries(params?: {
    wallet_address?: string
    only_verified?: boolean
  }) {
    const queryParams: Record<string, string> = {}
    if (params?.wallet_address) queryParams.wallet_address = params.wallet_address
    if (params?.only_verified) queryParams.only_verified = 'true'

    return callEdgeFunction('get-entries', {
      params: queryParams,
      requireAuth: false // Public read - allows viewing entries without authentication
    })
  },

  // Profile operations
  // Public read operation - auth optional (allows viewing profiles without auth)
  async getProfile(walletAddress?: string) {
    return callEdgeFunction('get-profile', {
      params: walletAddress ? { wallet_address: walletAddress } : {},
      requireAuth: false // Public read - allows viewing profiles without authentication
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
      body: data,
      requireAuth: true
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
      body: data,
      requireAuth: true
    })
  },

  async getEndorsements(entryId: string) {
    return callEdgeFunction('get-endorsements', {
      params: { entry_id: entryId },
      requireAuth: false // Public read - allows viewing endorsements without auth
    })
  },

  // Update entry (for EditEntryModal, OnChainUpgradeModal)
  async updateEntry(data: {
    entry_id: string
    description?: string | null
    custom_image_url?: string | null
    campaign_tag?: string | null
    tx_hash?: string | null
  }) {
    return callEdgeFunction('update-entry', {
      method: 'PATCH',
      body: data,
      requireAuth: true
    })
  },

  // Admin operations (require auth)
  async adminRejectEntry(entryId: string, reason?: string) {
    return callEdgeFunction('admin-reject-entry', {
      method: 'POST',
      body: { entry_id: entryId, reason },
      requireAuth: true
    })
  },

  // Notification operations (require auth - user-specific data)
  async getNotifications(unreadOnly?: boolean) {
    return callEdgeFunction('get-notifications', {
      params: unreadOnly ? { unread_only: 'true' } : {},
      requireAuth: true
    })
  },

  async markNotificationRead(notificationId: string) {
    return callEdgeFunction('mark-notification-read', {
      method: 'POST',
      body: { notification_id: notificationId },
      requireAuth: true
    })
  },

  // Admin operations (require auth)
  async adminGetEntries() {
    return callEdgeFunction('admin-get-entries', { requireAuth: true })
  },

  async adminVerifyEntry(entryId: string) {
    return callEdgeFunction('admin-verify-entry', {
      method: 'POST',
      body: { entry_id: entryId },
      requireAuth: true
    })
  },

  // Real-time notifications via Server-Sent Events
  async subscribeNotifications(onNotification: (notification: any) => void, onError?: (error: Error) => void) {
    const token = await getAuthToken()
    if (!token) {
      onError?.(new Error('No authentication token available'))
      return () => {}
    }

    // EventSource doesn't support custom headers, so we pass token as query param
    // The Edge Function will extract it and validate
    const url = new URL(`${SUPABASE_URL}/functions/v1/subscribe-notifications`)
    url.searchParams.append('token', token)

    const eventSource = new EventSource(url.toString())

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') {
          onNotification(data.data)
        } else if (data.type === 'error') {
          onError?.(new Error(data.message))
        }
      } catch (err) {
        console.error('Error parsing notification:', err)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      onError?.(new Error('Connection error'))
    }

    // Return cleanup function
    return () => {
      eventSource.close()
    }
  },
}

