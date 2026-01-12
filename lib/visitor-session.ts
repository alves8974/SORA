/**
 * Visitor Session Management
 * 
 * Prevents duplicate visitor counting by:
 * 1. Using cookies to identify returning visitors
 * 2. In-memory cache to deduplicate within time window
 * 3. Hash-based identification (IP + User-Agent)
 */

import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Visitor session data
 */
export interface VisitorSession {
    visitorId: string;      // Unique visitor ID (from cookie or generated)
    visitorHash: string;    // Hash of IP + User-Agent for dedup
    isNewVisitor: boolean;  // True if this is a new session
    timestamp: number;      // When session was created/accessed
}

/**
 * In-memory cache for visitor deduplication
 * Key: campaignId:visitorHash
 * Value: timestamp of last counted visit
 * 
 * TTL: 5 minutes - same visitor accessing multiple times within 5 min = 1 visit
 */
const visitorCache = new Map<string, number>();

/**
 * Configuration
 */
const DEDUP_WINDOW_MS = 5 * 60 * 1000;  // 5 minutes - window to deduplicate visits
const COOKIE_NAME = '_cloaker_vid';      // Visitor ID cookie name
const COOKIE_MAX_AGE = 60 * 60 * 24;     // 24 hours in seconds

/**
 * Generate a unique visitor ID
 */
export function generateVisitorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `v_${timestamp}_${random}`;
}

/**
 * Create a hash from IP and User-Agent for deduplication
 * This is used to identify the same visitor even without cookies
 */
export function createVisitorHash(ip: string, userAgent: string): string {
    const data = `${ip}:${userAgent}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Get or create visitor session from request
 * Returns session info including whether this is a new/returning visitor
 */
export function getOrCreateVisitorSession(
    request: NextRequest,
    ip: string,
    userAgent: string
): VisitorSession {
    // Try to get existing visitor ID from cookie
    const existingVisitorId = request.cookies.get(COOKIE_NAME)?.value;

    // Create visitor hash for deduplication
    const visitorHash = createVisitorHash(ip, userAgent);

    // Determine if this is a new visitor
    const isNewVisitor = !existingVisitorId;

    // Use existing ID or generate new one
    const visitorId = existingVisitorId || generateVisitorId();

    return {
        visitorId,
        visitorHash,
        isNewVisitor,
        timestamp: Date.now()
    };
}

/**
 * Check if this visit should be counted (not a duplicate)
 * 
 * A visit is counted if:
 * 1. This visitor+campaign combo hasn't been seen in the dedup window
 * 2. OR the dedup window has expired
 * 
 * @param session - Visitor session
 * @param campaignId - Campaign being visited
 * @returns true if this visit should be counted, false if duplicate
 */
export function shouldCountVisit(session: VisitorSession, campaignId: string): boolean {
    const cacheKey = `${campaignId}:${session.visitorHash}`;
    const now = Date.now();

    // Check if we've seen this visitor recently
    const lastVisit = visitorCache.get(cacheKey);

    if (lastVisit && (now - lastVisit) < DEDUP_WINDOW_MS) {
        // Visitor was counted within the dedup window - duplicate!
        return false;
    }

    // New visit - mark as counted
    visitorCache.set(cacheKey, now);

    // Cleanup old entries periodically (when cache gets large)
    if (visitorCache.size > 10000) {
        cleanupVisitorCache();
    }

    return true;
}

/**
 * Cleanup expired entries from visitor cache
 */
function cleanupVisitorCache(): void {
    const now = Date.now();
    const expiredBefore = now - DEDUP_WINDOW_MS;

    for (const [key, timestamp] of visitorCache.entries()) {
        if (timestamp < expiredBefore) {
            visitorCache.delete(key);
        }
    }
}

/**
 * Get cookie configuration for visitor ID
 */
export function getVisitorCookieConfig() {
    return {
        name: COOKIE_NAME,
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/'
    };
}

/**
 * Get visitor stats (for debugging/monitoring)
 */
export function getVisitorCacheStats() {
    return {
        size: visitorCache.size,
        dedupWindowMs: DEDUP_WINDOW_MS
    };
}
