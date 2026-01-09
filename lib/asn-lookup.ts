/**
 * ASN (Autonomous System Number) Detection
 * Identifies bot traffic by ISP/datacenter ownership
 * 
 * Uses free IP-API.com for lookups (no API key required)
 * Rate limit: 45 requests/minute (free tier)
 */

// Cache ASN results to reduce API calls
const asnCache = new Map<string, { result: ASNResult; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface ASNResult {
    asn: string;           // e.g., "AS32934"
    org: string;           // e.g., "Facebook, Inc"
    isp: string;           // ISP name
    country: string;       // Country code
    isBot: boolean;        // Is this a known bot network?
    isHosting: boolean;    // Is this a datacenter/cloud?
    confidence: number;    // 0-100
    reasons: string[];
}

// Known bot/crawler ASNs
const BOT_ASNS: Record<string, { name: string; confidence: number }> = {
    // Facebook/Meta
    'AS32934': { name: 'Facebook', confidence: 95 },
    'AS63293': { name: 'Facebook (AS2)', confidence: 95 },

    // Google
    'AS15169': { name: 'Google', confidence: 80 },
    'AS396982': { name: 'Google Cloud', confidence: 70 },

    // Microsoft
    'AS8075': { name: 'Microsoft', confidence: 60 },
    'AS8068': { name: 'Microsoft (Azure)', confidence: 65 },

    // Amazon
    'AS16509': { name: 'Amazon AWS', confidence: 50 },
    'AS14618': { name: 'Amazon AWS (East)', confidence: 50 },

    // Cloudflare
    'AS13335': { name: 'Cloudflare', confidence: 40 },

    // DigitalOcean
    'AS14061': { name: 'DigitalOcean', confidence: 55 },

    // Linode
    'AS63949': { name: 'Linode', confidence: 55 },

    // OVH
    'AS16276': { name: 'OVH', confidence: 55 },

    // ByteDance/TikTok
    'AS138699': { name: 'ByteDance', confidence: 90 },
    'AS396986': { name: 'ByteDance (US)', confidence: 90 },
};

// Known hosting/datacenter keywords
const HOSTING_KEYWORDS = [
    'hosting',
    'cloud',
    'datacenter',
    'data center',
    'server',
    'vps',
    'virtual',
    'dedicated',
    'colocation',
    'aws',
    'azure',
    'google cloud',
    'digitalocean',
    'linode',
    'vultr',
    'ovh',
    'hetzner',
];

/**
 * Lookup ASN information for an IP address
 * Uses IP-API.com (free, no key required)
 */
export async function lookupASN(ip: string): Promise<ASNResult> {
    // Check cache first
    const cached = asnCache.get(ip);
    if (cached && Date.now() < cached.expiry) {
        return cached.result;
    }

    // Skip private IPs
    if (isPrivateIP(ip)) {
        return {
            asn: 'private',
            org: 'Private Network',
            isp: 'Private',
            country: 'XX',
            isBot: false,
            isHosting: false,
            confidence: 0,
            reasons: ['Private IP address'],
        };
    }

    try {
        // Use IP-API.com (free, 45 req/min)
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,isp,org,as,hosting,query`,
            {
                signal: AbortSignal.timeout(3000), // 3 second timeout
            }
        );

        if (!response.ok) {
            throw new Error(`IP-API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'fail') {
            throw new Error(data.message || 'IP-API lookup failed');
        }

        const result = analyzeASNResult(data);

        // Cache result
        asnCache.set(ip, {
            result,
            expiry: Date.now() + CACHE_TTL,
        });

        return result;

    } catch (error) {
        console.warn(`ASN lookup failed for ${ip}:`, error);

        // Return neutral result on failure
        return {
            asn: 'unknown',
            org: 'Unknown',
            isp: 'Unknown',
            country: 'XX',
            isBot: false,
            isHosting: false,
            confidence: 0,
            reasons: ['Lookup failed'],
        };
    }
}

/**
 * Analyze IP-API response and determine if bot
 */
function analyzeASNResult(data: any): ASNResult {
    const reasons: string[] = [];
    let isBot = false;
    let confidence = 0;

    // Extract ASN number from "AS12345 Company Name" format
    const asnMatch = data.as?.match(/^(AS\d+)/);
    const asn = asnMatch ? asnMatch[1] : 'unknown';

    // Check known bot ASNs
    const knownBot = BOT_ASNS[asn];
    if (knownBot) {
        reasons.push(`Known ${knownBot.name} ASN (${asn})`);
        isBot = true;
        confidence = Math.max(confidence, knownBot.confidence);
    }

    // Check hosting flag from IP-API
    if (data.hosting === true) {
        reasons.push('Datacenter/hosting IP');
        isBot = true;
        confidence = Math.max(confidence, 50);
    }

    // Check ISP/org for hosting keywords
    const orgLower = (data.org || '').toLowerCase();
    const ispLower = (data.isp || '').toLowerCase();

    for (const keyword of HOSTING_KEYWORDS) {
        if (orgLower.includes(keyword) || ispLower.includes(keyword)) {
            reasons.push(`Hosting keyword found: "${keyword}"`);
            confidence = Math.max(confidence, 40);
            break;
        }
    }

    return {
        asn,
        org: data.org || 'Unknown',
        isp: data.isp || 'Unknown',
        country: data.countryCode || 'XX',
        isBot,
        isHosting: data.hosting === true,
        confidence,
        reasons,
    };
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // 10.x.x.x
    if (first === 10) return true;

    // 172.16-31.x.x
    if (first === 172 && second >= 16 && second <= 31) return true;

    // 192.168.x.x
    if (first === 192 && second === 168) return true;

    // 127.x.x.x (localhost)
    if (first === 127) return true;

    return false;
}

/**
 * Quick check without API call (uses only known ASNs)
 * For when you can't make external API calls (e.g., middleware)
 */
export function quickASNCheck(ip: string): { possible: boolean; reason?: string } {
    // Check common Facebook IP ranges
    const parts = ip.split('.');
    if (parts.length !== 4) return { possible: false };

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // Facebook ranges
    if (first === 31 && second === 13) return { possible: true, reason: 'Facebook IP range' };
    if (first === 66 && second === 220) return { possible: true, reason: 'Facebook IP range' };
    if (first === 69 && (second === 63 || second === 171)) return { possible: true, reason: 'Facebook IP range' };
    if (first === 157 && second === 240) return { possible: true, reason: 'Facebook IP range' };
    if (first === 173 && second === 252) return { possible: true, reason: 'Facebook IP range' };

    // Google ranges
    if (first === 66 && second === 249) return { possible: true, reason: 'Google IP range' };
    if (first === 64 && second === 233) return { possible: true, reason: 'Google IP range' };

    return { possible: false };
}

/**
 * Get cache stats (for debugging)
 */
export function getASNCacheStats(): { size: number; entries: string[] } {
    return {
        size: asnCache.size,
        entries: Array.from(asnCache.keys()).slice(0, 10), // First 10
    };
}
