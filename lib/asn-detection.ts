/**
 * ASN Detection with Redis Caching
 * Critical fix from Gemini: Avoid DNS latency on every request
 */

import { kv } from '@vercel/kv';

export const PLATFORM_ASNS: Record<string, readonly string[]> = {
    META: ['AS32934', 'AS63293'],
    GOOGLE: ['AS15169', 'AS396982'],
    TIKTOK: ['AS396986'],
    DATACENTERS: ['AS16509', 'AS14061', 'AS20473']
};

/**
 * Get ASN with Redis caching (CRITICAL FIX from Gemini)
 * Cache TTL: 24h (ASN rarely changes)
 */
export async function getCachedASN(ip: string): Promise<string | null> {
    try {
        // 1. Check cache first (<10ms)
        const cacheKey = `asn:${ip}`;
        const cached = await kv.get<string>(cacheKey);

        if (cached) {
            return cached; // Cache hit - instant return
        }

        // 2. Cache miss - do DNS lookup (50-200ms)
        const asn = await getASNFromDNS(ip);

        if (asn) {
            // 3. Cache for 24h
            await kv.set(cacheKey, asn, { ex: 86400 }); // 24h TTL
        }

        return asn;
    } catch (error) {
        console.error('ASN lookup failed:', error);
        return null; // Fallback to IP ranges
    }
}

/**
 * DNS lookup via Team Cymru (implementation)
 * Only called on cache miss
 */
async function getASNFromDNS(ip: string): Promise<string | null> {
    try {
        // Reverse IP: 8.8.8.8 → 8.8.8.8.origin.asn.cymru.com
        const parts = ip.split('.');
        if (parts.length !== 4) return null;

        const reversed = parts.reverse().join('.');
        const hostname = `${reversed}.origin.asn.cymru.com`;

        // Use dns.promises.resolve (Node.js built-in)
        const dns = require('dns').promises;
        const records = await dns.resolveTxt(hostname);

        // Parse: "15169 | 8.8.8.0/24 | US | arin | 1992-12-01"
        if (records && records[0] && records[0][0]) {
            const asn = records[0][0].split('|')[0].trim();
            return `AS${asn}`;
        }

        return null;
    } catch (error) {
        // DNS timeout or not found
        return null;
    }
}

/**
 * Check if IP belongs to platform (with cache)
 */
export async function isPlatformIP(
    ip: string,
    platform: keyof typeof PLATFORM_ASNS
): Promise<boolean> {
    const asn = await getCachedASN(ip);
    if (!asn) return false;

    return PLATFORM_ASNS[platform].includes(asn);
}

/**
 * Check if datacenter IP (hosting/VPN)
 */
export async function isDatacenterIP(ip: string): Promise<boolean> {
    const asn = await getCachedASN(ip);
    if (!asn) return false;

    return PLATFORM_ASNS.DATACENTERS.includes(asn);
}

/**
 * IP Range fallback (when ASN lookup fails)
 * Legacy method - used as backup
 */
export function checkIPRangeFallback(
    ip: string,
    platform: 'meta' | 'google' | 'tiktok'
): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    if (platform === 'meta') {
        return (
            (first === 31 && second === 13) ||
            (first === 66 && second === 220) ||
            (first === 69 && (second === 63 || second === 171)) ||
            (first === 157 && second === 240) ||
            (first === 173 && second === 252)
        );
    }

    if (platform === 'google') {
        return (
            (first === 66 && second === 249) ||
            (first === 64 && second === 233)
        );
    }

    return false;
}

/**
 * Combined detection: ASN with fallback
 * Best of both worlds
 */
export async function detectPlatformIP(
    ip: string,
    platform: 'meta' | 'google' | 'tiktok'
): Promise<boolean> {
    // Try ASN first (cached, fast)
    const platformKey = platform.toUpperCase() as keyof typeof PLATFORM_ASNS;
    const asnMatch = await isPlatformIP(ip, platformKey);

    if (asnMatch) return true;

    // Fallback to IP ranges
    return checkIPRangeFallback(ip, platform);
}
