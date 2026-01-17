import { verifyMessage, getAddress } from 'viem';

/**
 * Verify an Ethereum message signature
 * 
 * CRITICAL: Must use checksum address format (getAddress), NOT lowercase!
 * Ethereum signature verification depends on exact address recovery.
 * Checksum mismatch = invalid signature (no warning, just false).
 * 
 * @param message The original message that was signed
 * @param signature The signature to verify
 * @param address The wallet address that should have signed the message
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
    message: string,
    signature: string,
    address: string
): Promise<boolean> {
    try {
        // CRITICAL FIX: Use checksum address format, NOT lowercase
        // verifyMessage recovers signer from signature and compares against address
        // Checksum mismatch = invalid signature (silently fails)
        const checksumAddress = getAddress(address);
        
        // viem's verifyMessage handles EIP-191 message signing
        // It automatically prefixes the message with "\x19Ethereum Signed Message:\n" + length
        const isValid = await verifyMessage({
            address: checksumAddress,
            message,
            signature: signature as `0x${string}`,
        });
        
        console.log('Signature verification result:', {
            isValid,
            address: checksumAddress,
            originalAddress: address,
            messageLength: message.length,
            signatureLength: signature.length
        });
        
        return isValid;
    } catch (error: any) {
        console.error('Signature verification error:', error);
        console.error('Verification details:', {
            address,
            message: message.substring(0, 100) + '...',
            signature: signature.substring(0, 20) + '...'
        });
        return false;
    }
}

/**
 * Generate a content hash from URL to prevent duplicate claims
 * This creates a deterministic hash that can be used to detect if content was already claimed
 * 
 * Normalization rules:
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove trailing slashes
 * - Remove common tracking parameters (utm_*, ref, etc.)
 * - Remove fragment (#)
 */
export async function generateContentHash(url: string): Promise<string> {
    try {
        // Normalize URL
        let normalizedUrl = url.trim().toLowerCase();
        
        // Remove fragment
        normalizedUrl = normalizedUrl.split('#')[0];
        
        // Parse URL to remove tracking parameters
        try {
            const urlObj = new URL(normalizedUrl);
            // Remove common tracking parameters
            const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
            trackingParams.forEach(param => urlObj.searchParams.delete(param));
            normalizedUrl = urlObj.toString();
        } catch {
            // If URL parsing fails, just use the normalized string
        }
        
        // Remove trailing slash
        normalizedUrl = normalizedUrl.replace(/\/$/, '');
        
        // Use Web Crypto API to create a hash
        const encoder = new TextEncoder();
        const data = encoder.encode(normalizedUrl);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    } catch (error) {
        console.error('Error generating content hash:', error);
        // Fallback: simple hash
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    }
}

/**
 * Create a verification URL that can be used to verify a signature
 * This creates a shareable link that includes all necessary data
 */
export function createVerificationUrl(
    walletAddress: string,
    signature: string,
    message: string,
    entryId?: string
): string {
    const params = new URLSearchParams({
        address: walletAddress,
        signature: signature,
        message: encodeURIComponent(message),
    });
    
    if (entryId) {
        params.append('entryId', entryId);
    }
    
    // Use the app's verification route
    return `/verify?${params.toString()}`;
}

