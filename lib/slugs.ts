/**
 * Random Slug Generation System
 * Generates secure, non-sequential campaign URLs
 * 
 * Example: /Kcj7xLm (3.5 trillion combinations)
 */

import { customAlphabet } from 'nanoid';
import { sql } from '@vercel/postgres';

// Custom alphabet: 0-9, A-Z, a-z (62 characters)
// Excludes similar-looking characters for better readability
const SLUG_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 7; // 62^7 = 3.5 trillion combinations

// nanoid with custom alphabet
const generateSlug = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH);

/**
 * Generate unique slug with collision retry
 * Tries up to 3 times, then increases length
 */
export async function generateUniqueSlug(maxRetries: number = 3): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const slug = generateSlug();

        // Check if slug already exists
        const exists = await slugExists(slug);

        if (!exists) {
            return slug;
        }

        console.warn(`Slug collision detected: ${slug}, retrying...`);
    }

    // If still colliding after 3 attempts, use longer slug
    console.warn('Multiple collisions, generating longer slug');
    const longerSlug = customAlphabet(SLUG_ALPHABET, 10)();
    return longerSlug;
}

/**
 * Check if slug already exists in database
 */
async function slugExists(slug: string): Promise<boolean> {
    try {
        const result = await sql`
      SELECT EXISTS(
        SELECT 1 FROM campaigns WHERE slug = ${slug}
      ) as exists
    `;

        return result.rows[0]?.exists || false;
    } catch (error) {
        console.error('Error checking slug existence:', error);
        // On error, assume exists to be safe (will retry)
        return true;
    }
}

/**
 * Validate slug format
 * Must be alphanumeric, 7-10 characters
 */
export function validateSlug(slug: string): boolean {
    const slugRegex = /^[0-9A-Za-z]{7,10}$/;
    return slugRegex.test(slug);
}

/**
 * Generate slug for test/development
 * Optionally add prefix for identification
 */
export function generateTestSlug(prefix?: string): string {
    const slug = generateSlug();
    return prefix ? `${prefix}-${slug}` : slug;
}

/**
 * Convert slug to campaign URL
 */
export function slugToUrl(slug: string, domain?: string): string {
    const baseUrl = domain || process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.vercel.app';
    return `${baseUrl}/${slug}`;
}

/**
 * Extract slug from URL path
 */
export function extractSlugFromPath(pathname: string): string | null {
    // Match pattern: /slug or /c/slug (legacy support)
    const match = pathname.match(/^\/(?:c\/)?([0-9A-Za-z]{7,10})$/);
    return match ? match[1] : null;
}

/**
 * Statistics about slug space
 */
export function getSlugStats() {
    const combinations = Math.pow(62, SLUG_LENGTH);
    const withLongerSlug = Math.pow(62, 10);

    return {
        alphabet: SLUG_ALPHABET,
        length: SLUG_LENGTH,
        combinations: combinations.toLocaleString(),
        combinationsLonger: withLongerSlug.toLocaleString(),
        collisionProbability: '~0% até 1M campaigns',
        securityLevel: 'Impossível enumerar',
    };
}
