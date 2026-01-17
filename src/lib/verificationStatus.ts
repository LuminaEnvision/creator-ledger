/**
 * Verification status helper functions
 * 
 * Database stores verification_status in lowercase ('verified', 'unverified', 'rejected')
 * This module provides consistent comparison functions to avoid case-sensitivity bugs
 */

export type VerificationStatus = 'verified' | 'unverified' | 'rejected'

/**
 * Normalize verification status to lowercase for consistent comparison
 */
export function normalizeVerificationStatus(status: string | null | undefined): VerificationStatus | null {
  if (!status) return null
  return status.toLowerCase() as VerificationStatus
}

/**
 * Check if entry is verified (case-insensitive)
 */
export function isVerified(status: string | null | undefined): boolean {
  return normalizeVerificationStatus(status) === 'verified'
}

/**
 * Check if entry is unverified (case-insensitive)
 */
export function isUnverified(status: string | null | undefined): boolean {
  return normalizeVerificationStatus(status) === 'unverified'
}

/**
 * Check if entry is rejected (case-insensitive)
 */
export function isRejected(status: string | null | undefined): boolean {
  return normalizeVerificationStatus(status) === 'rejected'
}

