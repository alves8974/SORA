/**
 * Token Encryption for Secure URL Passing
 * 
 * This module provides functions to:
 * 1. Encrypt offer URLs into short-lived tokens
 * 2. Decrypt tokens back to URLs
 * 3. Validate token expiration
 * 
 * This prevents offer URLs from being exposed in:
 * - HTML source code
 * - Browser DevTools
 * - Network inspection
 */

// Simple XOR-based encryption (fast, good enough for short-lived tokens)
// In production, consider using Web Crypto API for stronger encryption

const SECRET_KEY = process.env.TOKEN_SECRET || 'sora-cloaker-2024-secure-key-do-not-share';

/**
 * Encode string to base64url (URL-safe base64)
 */
function toBase64Url(str: string): string {
    if (typeof window !== 'undefined') {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    return Buffer.from(str).toString('base64url');
}

/**
 * Decode base64url to string
 */
function fromBase64Url(str: string): string {
    // Add padding back
    const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');

    if (typeof window !== 'undefined') {
        return atob(base64);
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Simple XOR cipher
 */
function xorCipher(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return result;
}

/**
 * Token payload structure
 */
interface TokenPayload {
    url: string;         // The offer URL
    exp: number;         // Expiration timestamp
    cid: string;         // Campaign ID
    sig: string;         // Simple signature for validation
}

/**
 * Generate a simple signature
 */
function generateSignature(url: string, exp: number, cid: string): string {
    const data = `${url}|${exp}|${cid}|${SECRET_KEY}`;
    // Simple hash using charcode sum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Create an encrypted token containing the offer URL
 * Token expires after specified seconds (default: 60s)
 */
export function createOfferToken(
    offerUrl: string,
    campaignId: string,
    expiresInSeconds: number = 60
): string {
    const exp = Date.now() + (expiresInSeconds * 1000);
    const sig = generateSignature(offerUrl, exp, campaignId);

    const payload: TokenPayload = {
        url: offerUrl,
        exp,
        cid: campaignId,
        sig
    };

    const jsonPayload = JSON.stringify(payload);
    const encrypted = xorCipher(jsonPayload, SECRET_KEY);
    return toBase64Url(encrypted);
}

/**
 * Decrypt and validate a token
 * Returns the offer URL if valid, null if invalid/expired
 */
export function validateOfferToken(token: string): {
    valid: boolean;
    url?: string;
    campaignId?: string;
    error?: string;
} {
    try {
        const encrypted = fromBase64Url(token);
        const decrypted = xorCipher(encrypted, SECRET_KEY);
        const payload: TokenPayload = JSON.parse(decrypted);

        // Check expiration
        if (Date.now() > payload.exp) {
            return { valid: false, error: 'Token expired' };
        }

        // Verify signature
        const expectedSig = generateSignature(payload.url, payload.exp, payload.cid);
        if (payload.sig !== expectedSig) {
            return { valid: false, error: 'Invalid signature' };
        }

        return {
            valid: true,
            url: payload.url,
            campaignId: payload.cid
        };
    } catch (error) {
        return { valid: false, error: 'Invalid token format' };
    }
}

/**
 * API endpoint handler for token validation
 * Use this in an API route: /api/validate-token
 */
export function createValidationResponse(token: string | null): {
    valid: boolean;
    redirectUrl?: string;
    error?: string;
} {
    if (!token) {
        return { valid: false, error: 'No token provided' };
    }

    const result = validateOfferToken(token);

    if (result.valid && result.url) {
        return {
            valid: true,
            redirectUrl: result.url
        };
    }

    return {
        valid: false,
        error: result.error || 'Validation failed'
    };
}
