/**
 * Input Validation Utility for Supabase Edge Functions
 * 
 * Provides comprehensive validation for user inputs to prevent:
 * - SQL injection (though Supabase handles this)
 * - XSS attacks
 * - DoS attacks (large payloads, deep JSON)
 * - Invalid data formats
 */

/**
 * Validate URL format and safety
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  // Length check
  if (url.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 characters)' }
  }

  // Protocol check (must be http or https)
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  return { valid: true }
}

/**
 * Validate wallet address format
 */
export function validateWalletAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Wallet address is required' }
  }

  // Ethereum address format: 0x followed by 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
  if (!ethAddressRegex.test(address)) {
    return { valid: false, error: 'Invalid wallet address format' }
  }

  return { valid: true }
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
  required: boolean = false
): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName} is required` }
    }
    return { valid: true } // Optional fields can be empty
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` }
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} too long (max ${maxLength} characters)` }
  }

  return { valid: true }
}

/**
 * Validate hash format (hex string)
 */
export function validateHash(hash: string, expectedLength?: number): { valid: boolean; error?: string } {
  if (!hash || typeof hash !== 'string') {
    return { valid: false, error: 'Hash is required' }
  }

  // Hex string format
  const hexRegex = /^[a-fA-F0-9]+$/
  if (!hexRegex.test(hash)) {
    return { valid: false, error: 'Invalid hash format (must be hex string)' }
  }

  if (expectedLength && hash.length !== expectedLength) {
    return { valid: false, error: `Hash must be ${expectedLength} characters long` }
  }

  return { valid: true }
}

/**
 * Validate JSON depth to prevent DoS
 */
export function validateJsonDepth(obj: any, maxDepth: number = 32): { valid: boolean; error?: string } {
  function getDepth(o: any, currentDepth: number = 0): number {
    if (currentDepth > maxDepth) {
      return currentDepth
    }

    if (typeof o !== 'object' || o === null) {
      return currentDepth
    }

    let maxChildDepth = currentDepth
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const childDepth = getDepth(o[key], currentDepth + 1)
        maxChildDepth = Math.max(maxChildDepth, childDepth)
      }
    }

    return maxChildDepth
  }

  const depth = getDepth(obj)
  if (depth > maxDepth) {
    return { valid: false, error: `JSON depth too deep (max ${maxDepth} levels)` }
  }

  return { valid: true }
}

/**
 * Validate image URL format
 */
export function validateImageUrl(url: string | null | undefined): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: true } // Optional field
  }

  const urlValidation = validateUrl(url)
  if (!urlValidation.valid) {
    return urlValidation
  }

  // Check for common image extensions (basic check)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext))

  // Also allow IPFS and data URLs
  const isIpfs = url.startsWith('ipfs://') || url.includes('ipfs.io') || url.includes('gateway.pinata.cloud')
  const isDataUrl = url.startsWith('data:image/')

  if (!hasImageExtension && !isIpfs && !isDataUrl) {
    return { valid: false, error: 'Invalid image URL format' }
  }

  return { valid: true }
}

/**
 * Validate ISO date string
 */
export function validateIsoDate(dateString: string | null | undefined): { valid: boolean; error?: string } {
  if (!dateString) {
    return { valid: true } // Optional field
  }

  if (typeof dateString !== 'string') {
    return { valid: false, error: 'Date must be a string' }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format (must be ISO 8601)' }
  }

  return { valid: true }
}

/**
 * Validate entry creation payload
 */
export function validateCreateEntryPayload(body: any): { valid: boolean; error?: string } {
  // Validate required fields
  if (!body.url) {
    return { valid: false, error: 'url is required' }
  }
  if (!body.platform) {
    return { valid: false, error: 'platform is required' }
  }
  if (!body.payload_hash) {
    return { valid: false, error: 'payload_hash is required' }
  }

  // Validate URL
  const urlValidation = validateUrl(body.url)
  if (!urlValidation.valid) {
    return urlValidation
  }

  // Validate platform (must be string, reasonable length)
  const platformValidation = validateStringLength(body.platform, 'platform', 50, true)
  if (!platformValidation.valid) {
    return platformValidation
  }

  // Validate hashes
  const payloadHashValidation = validateHash(body.payload_hash)
  if (!payloadHashValidation.valid) {
    return payloadHashValidation
  }

  if (body.content_hash) {
    const contentHashValidation = validateHash(body.content_hash)
    if (!contentHashValidation.valid) {
      return contentHashValidation
    }
  }

  // Validate optional string fields
  if (body.description) {
    const descValidation = validateStringLength(body.description, 'description', 5000)
    if (!descValidation.valid) {
      return descValidation
    }
  }

  if (body.campaign_tag) {
    const tagValidation = validateStringLength(body.campaign_tag, 'campaign_tag', 100)
    if (!tagValidation.valid) {
      return tagValidation
    }
  }

  if (body.title) {
    const titleValidation = validateStringLength(body.title, 'title', 500)
    if (!titleValidation.valid) {
      return titleValidation
    }
  }

  // Validate image URLs
  if (body.image_url) {
    const imageValidation = validateImageUrl(body.image_url)
    if (!imageValidation.valid) {
      return imageValidation
    }
  }

  if (body.custom_image_url) {
    const customImageValidation = validateImageUrl(body.custom_image_url)
    if (!customImageValidation.valid) {
      return customImageValidation
    }
  }

  // Validate dates
  if (body.timestamp) {
    const timestampValidation = validateIsoDate(body.timestamp)
    if (!timestampValidation.valid) {
      return timestampValidation
    }
  }

  if (body.content_published_at) {
    const publishedValidation = validateIsoDate(body.content_published_at)
    if (!publishedValidation.valid) {
      return publishedValidation
    }
  }

  // Validate JSON depth
  const depthValidation = validateJsonDepth(body)
  if (!depthValidation.valid) {
    return depthValidation
  }

  return { valid: true }
}

/**
 * Validate vote entry payload
 */
export function validateVoteEntryPayload(body: any): { valid: boolean; error?: string } {
  if (!body.entry_id) {
    return { valid: false, error: 'entry_id is required' }
  }

  if (!body.vote_type) {
    return { valid: false, error: 'vote_type is required' }
  }

  if (!['endorse', 'dispute'].includes(body.vote_type)) {
    return { valid: false, error: 'vote_type must be "endorse" or "dispute"' }
  }

  // entry_id should be a UUID or similar identifier
  if (typeof body.entry_id !== 'string' || body.entry_id.length > 100) {
    return { valid: false, error: 'Invalid entry_id format' }
  }

  return { valid: true }
}

/**
 * Validate update entry payload
 */
export function validateUpdateEntryPayload(body: any): { valid: boolean; error?: string } {
  if (!body.entry_id) {
    return { valid: false, error: 'entry_id is required' }
  }

  // entry_id should be a UUID or similar identifier
  if (typeof body.entry_id !== 'string' || body.entry_id.length > 100) {
    return { valid: false, error: 'Invalid entry_id format' }
  }

  // Validate optional fields
  if (body.description !== undefined) {
    const descValidation = validateStringLength(body.description, 'description', 5000)
    if (!descValidation.valid) {
      return descValidation
    }
  }

  if (body.campaign_tag !== undefined) {
    const tagValidation = validateStringLength(body.campaign_tag, 'campaign_tag', 100)
    if (!tagValidation.valid) {
      return tagValidation
    }
  }

  if (body.custom_image_url !== undefined) {
    const imageValidation = validateImageUrl(body.custom_image_url)
    if (!imageValidation.valid) {
      return imageValidation
    }
  }

  if (body.tx_hash !== undefined) {
    // Transaction hash should be hex string (0x + 64 chars for Ethereum)
    if (typeof body.tx_hash !== 'string') {
      return { valid: false, error: 'tx_hash must be a string' }
    }
    if (body.tx_hash && !/^0x[a-fA-F0-9]{64}$/.test(body.tx_hash)) {
      return { valid: false, error: 'Invalid transaction hash format' }
    }
  }

  // Validate JSON depth
  const depthValidation = validateJsonDepth(body)
  if (!depthValidation.valid) {
    return depthValidation
  }

  return { valid: true }
}

/**
 * Validate update profile payload
 */
export function validateUpdateProfilePayload(body: any): { valid: boolean; error?: string } {
  // All fields are optional, but validate if present

  if (body.display_name !== undefined) {
    const nameValidation = validateStringLength(body.display_name, 'display_name', 100)
    if (!nameValidation.valid) {
      return nameValidation
    }
  }

  if (body.bio !== undefined) {
    const bioValidation = validateStringLength(body.bio, 'bio', 2000)
    if (!bioValidation.valid) {
      return bioValidation
    }
  }

  if (body.avatar_url !== undefined) {
    const avatarValidation = validateImageUrl(body.avatar_url)
    if (!avatarValidation.valid) {
      return avatarValidation
    }
  }

  if (body.banner_url !== undefined) {
    const bannerValidation = validateImageUrl(body.banner_url)
    if (!bannerValidation.valid) {
      return bannerValidation
    }
  }

  // Validate JSON depth
  const depthValidation = validateJsonDepth(body)
  if (!depthValidation.valid) {
    return depthValidation
  }

  return { valid: true }
}

