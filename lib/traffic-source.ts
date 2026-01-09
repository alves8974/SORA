/**
 * Traffic Source Detection
 * Optimized weights per platform
 */

import type { TrafficSource } from './types';

/**
 * Get optimized detection weights for traffic source
 * Different platforms have different bot behaviors
 */
export function getWeightsForTrafficSource(
    source: 'meta' | 'google' | 'tiktok' | 'general'
): {
    userAgent: number;
    ipRange: number;
    referer: number;
    headers: number;
    fingerprint: number;
    behavioral: number;
    externalApi: number;
} {
    switch (source) {
        case 'meta':
            // Facebook/Instagram Ads
            // Priorities: Referer (Ads Library is key), IP/ASN
            return {
                referer: 0.40,      // Higher (Ads Library detection)
                ipRange: 0.25,      // ASN detection important
                userAgent: 0.15,    // Less reliable
                headers: 0.10,      // Weak signal
                fingerprint: 0.05,  // Analytics only
                behavioral: 0.05,   // Weak
                externalApi: 0.0,   // Disabled
            };

        case 'google':
            // Google Ads
            // Priorities: IP/ASN (Googlebot has stable IPs), User-Agent
            return {
                ipRange: 0.35,      // Higher (Googlebot IPs)
                referer: 0.20,      // Less predictable
                userAgent: 0.20,    // Known bot UAs
                headers: 0.15,      // Moderate
                fingerprint: 0.05,  // Analytics
                behavioral: 0.05,   // Weak
                externalApi: 0.0,   // Disabled
            };

        case 'tiktok':
            // TikTok Ads
            // Priorities: User-Agent (ByteDance crawler), IP/ASN
            return {
                userAgent: 0.30,    // TikTok has specific UAs
                ipRange: 0.30,      // ByteDance ASNs
                referer: 0.15,      // Less reliable
                headers: 0.15,      // Moderate
                fingerprint: 0.05,  // Analytics
                behavioral: 0.05,   // Weak
                externalApi: 0.0,   // Disabled
            };

        case 'general':
        default:
            // Balanced weights for unknown/mixed sources
            return {
                referer: 0.35,
                ipRange: 0.25,
                userAgent: 0.15,
                headers: 0.15,
                fingerprint: 0.05,
                behavioral: 0.05,
                externalApi: 0.0,
            };
    }
}

/**
 * Platform-specific bot patterns
 */
export const PLATFORM_BOT_PATTERNS = {
    meta: {
        userAgents: [
            'facebookexternalhit',
            'facebookcatalog',
            'Facebot',
            'ia_archiver',
        ],
        referers: [
            'facebook.com/ads/library',
            'facebook.com/business',
            'instagram.com',
        ],
    },
    google: {
        userAgents: [
            'Googlebot',
            'AdsBot-Google',
            'Mediapartners-Google',
            'Google-InspectionTool',
        ],
        referers: [
            'google.com/search',
            'google.com/ads',
        ],
    },
    tiktok: {
        userAgents: [
            'ByteSpider',
            'Bytedance',
            'TikTok',
        ],
        referers: [
            'tiktok.com',
        ],
    },
} as const;

/**
 * Check if request matches platform bot patterns
 */
export function matchesPlatformBotPattern(
    userAgent: string,
    referer: string | undefined,
    platform: 'meta' | 'google' | 'tiktok'
): boolean {
    const patterns = PLATFORM_BOT_PATTERNS[platform];

    // Check user agent
    const uaMatch = patterns.userAgents.some(pattern =>
        userAgent.toLowerCase().includes(pattern.toLowerCase())
    );

    if (uaMatch) return true;

    // Check referer
    if (referer) {
        const refererMatch = patterns.referers.some(pattern =>
            referer.toLowerCase().includes(pattern.toLowerCase())
        );
        if (refererMatch) return true;
    }

    return false;
}

/**
 * Get platform name for display
 */
export function getPlatformName(source: string): string {
    const names: Record<string, string> = {
        meta: 'Meta Ads (Facebook/Instagram)',
        google: 'Google Ads',
        tiktok: 'TikTok Ads',
        general: 'Geral',
    };
    return names[source] || 'Desconhecido';
}

/**
 * Recommendations for detection mode by platform
 */
export function getRecommendedModeForPlatform(
    source: 'meta' | 'google' | 'tiktok' | 'general'
): 'strict' | 'balanced' | 'permissive' {
    switch (source) {
        case 'meta':
            return 'strict';       // Black hat needs strict
        case 'google':
            return 'balanced';     // More lenient
        case 'tiktok':
            return 'balanced';     // Moderate
        case 'general':
        default:
            return 'balanced';
    }
}
