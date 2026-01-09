/**
 * Rate Limiting Utility
 * Protects API routes from abuse
 * Uses in-memory cache (Edge compatible)
 */

// Simple in-memory rate limit store
// Note: In production with multiple instances, use Vercel KV
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    maxRequests: number;    // Max requests per window
    windowMs: number;       // Time window in milliseconds
}

/**
 * Default configurations for different route types
 */
export const RATE_LIMIT_CONFIGS = {
    // API routes - generous limits
    api: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 100 requests per minute
    },
    // Campaign creation - stricter
    createCampaign: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 10 per minute
    },
    // Domain operations - strictest
    domainOps: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 5 per minute
    },
    // Stats endpoint - very generous (dashboard polling)
    stats: {
        maxRequests: 300,
        windowMs: 60 * 1000, // 300 per minute (5/sec)
    },
} as const;

/**
 * Check if request should be rate limited
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    // If no entry or window expired, create new one
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 0,
            resetTime: now + config.windowMs,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    // Check if over limit
    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetIn = Math.max(0, entry.resetTime - now);

    // Cleanup old entries periodically
    if (rateLimitStore.size > 10000) {
        cleanupExpiredEntries();
    }

    return { allowed, remaining, resetIn };
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
    // Try to get real IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const ip = realIp || (forwarded ? forwarded.split(',')[0].trim() : 'unknown');

    return `ratelimit:${ip}`;
}

/**
 * Apply rate limit to API route
 * Returns Response if rate limited, null if allowed
 */
export function applyRateLimit(
    request: Request,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Response | null {
    const identifier = getRateLimitIdentifier(request);
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(result.resetIn / 1000),
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
                },
            }
        );
    }

    return null;
}

/**
 * Cleanup expired entries from store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Rate limit headers to add to successful responses
 */
export function getRateLimitHeaders(
    request: Request,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Record<string, string> {
    const identifier = getRateLimitIdentifier(request);
    const entry = rateLimitStore.get(identifier);

    const remaining = entry
        ? Math.max(0, config.maxRequests - entry.count)
        : config.maxRequests;

    return {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
    };
}
