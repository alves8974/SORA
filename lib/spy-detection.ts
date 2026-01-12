/**
 * Spy Tool Detection Module
 * 
 * Detects and blocks:
 * 1. Datacenter IPs (AWS, Google Cloud, DigitalOcean, etc.)
 * 2. Headless browsers (Puppeteer, Playwright, Selenium)
 * 
 * These are commonly used by spy tools like:
 * - Minea, BigSpy, PowerAdSpy, AdSpy, Dropispy, etc.
 */

// ============================================
// DATACENTER ASN RANGES
// These are Autonomous System Numbers of known datacenters
// ============================================

export const DATACENTER_ASNS = [
    // Amazon AWS
    'AS16509', 'AS14618', 'AS7224',
    // Google Cloud
    'AS15169', 'AS396982',
    // Microsoft Azure
    'AS8075', 'AS8068',
    // DigitalOcean
    'AS14061',
    // Linode
    'AS63949',
    // Vultr
    'AS20473',
    // OVH
    'AS16276',
    // Hetzner
    'AS24940',
    // Cloudflare (workers)
    'AS13335',
    // Oracle Cloud
    'AS31898',
    // IBM Cloud
    'AS36351',
    // Alibaba Cloud
    'AS45102',
    // Scaleway
    'AS12876',
];

// ============================================
// DATACENTER IP RANGES (partial list of most common)
// Format: start of IP range
// ============================================

export const DATACENTER_IP_PREFIXES = [
    // AWS
    '3.', '13.', '15.', '18.', '34.', '35.', '44.', '50.', '52.', '54.', '99.',
    // Google Cloud
    '34.', '35.', '104.196.', '104.197.', '104.198.', '104.199.',
    '108.170.', '130.211.', '142.250.',
    // DigitalOcean
    '104.131.', '104.236.', '107.170.', '138.68.', '139.59.', '142.93.',
    '157.230.', '159.65.', '159.89.', '161.35.', '162.243.', '163.47.',
    '164.90.', '165.22.', '165.227.', '167.71.', '167.99.', '174.138.',
    '178.62.', '178.128.', '188.166.', '192.241.', '198.199.', '198.211.',
    '206.189.', '207.154.', '209.97.',
    // Vultr
    '45.32.', '45.63.', '45.76.', '45.77.', '64.156.', '64.237.',
    '66.42.', '78.141.', '80.240.', '95.179.', '104.156.', '104.207.',
    '107.191.', '108.61.', '136.244.', '140.82.', '141.164.', '144.202.',
    '149.28.', '149.248.', '155.138.', '192.248.', '207.148.', '208.167.',
    '209.250.', '216.128.', '217.69.',
    // OVH
    '51.38.', '51.68.', '51.75.', '51.77.', '51.79.', '51.81.', '51.83.',
    '51.89.', '51.91.', '51.161.', '51.178.', '51.195.', '51.210.', '51.222.',
    '54.36.', '54.37.', '54.38.', '54.39.',
    '91.121.', '92.222.', '135.125.', '137.74.', '139.99.', '141.94.',
    '142.44.', '144.217.', '145.239.', '147.135.', '149.56.', '151.80.',
    '158.69.', '164.132.', '167.114.', '176.31.', '178.32.', '178.33.',
    '188.165.', '192.95.', '192.99.', '193.70.', '195.154.', '198.27.',
    '198.50.', '198.100.', '198.245.', '213.32.', '213.186.', '213.251.',
    // Hetzner
    '5.9.', '46.4.', '78.46.', '78.47.', '88.198.', '88.99.', '94.130.',
    '95.216.', '116.202.', '116.203.', '128.140.', '135.181.', '136.243.',
    '138.201.', '142.132.', '144.76.', '148.251.', '157.90.', '159.69.',
    '162.55.', '167.233.', '168.119.', '176.9.', '178.63.', '188.34.',
    '188.40.', '195.201.', '213.133.', '213.239.',
    // Linode
    '45.33.', '45.56.', '45.79.', '50.116.', '66.175.', '69.164.',
    '72.14.', '74.207.', '85.90.', '96.126.', '97.107.', '139.162.',
    '172.104.', '173.230.', '173.255.', '176.58.', '178.79.', '192.155.',
    '192.81.', '198.58.', '198.74.', '207.192.', '212.71.',
    // Scaleway
    '51.15.', '51.158.', '62.210.', '163.172.', '195.154.', '212.47.',
];

// ============================================
// HEADLESS BROWSER DETECTION
// ============================================

export const HEADLESS_INDICATORS = {
    userAgentPatterns: [
        'headless',
        'phantomjs',
        'nightmare',
        'selenium',
        'webdriver',
        'puppeteer',
        'playwright',
        'cypress',
        'chrome-lighthouse',
        'speed insights',
        'pagespeed',
        'gtmetrix',
        'pingdom',
        'uptime',
        'bot',
        'crawl',
        'spider',
        'scrape',
        'python-requests',
        'python-urllib',
        'java/',
        'apache-httpclient',
        'okhttp',
        'curl/',
        'wget/',
        'httpie',
        'insomnia',
        'postman',
    ],
    // Headers that headless browsers often have/miss
    suspiciousHeaders: [
        'x-requested-with', // Usually missing in headless
    ],
    // Chrome-specific headers that real browsers have
    expectedChromeHeaders: [
        'sec-ch-ua',
        'sec-ch-ua-mobile',
        'sec-ch-ua-platform',
    ],
};

/**
 * Check if IP is from a known datacenter
 */
export function isDatacenterIP(ip: string): { isDatacenter: boolean; reason?: string } {
    if (!ip) return { isDatacenter: false };

    // Check IP prefixes
    for (const prefix of DATACENTER_IP_PREFIXES) {
        if (ip.startsWith(prefix)) {
            return {
                isDatacenter: true,
                reason: `IP matches datacenter prefix: ${prefix}*`
            };
        }
    }

    return { isDatacenter: false };
}

/**
 * Check if request is from a headless browser
 */
export function isHeadlessBrowser(
    userAgent: string,
    headers: Headers
): { isHeadless: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const ua = userAgent.toLowerCase();

    // Check User-Agent patterns
    for (const pattern of HEADLESS_INDICATORS.userAgentPatterns) {
        if (ua.includes(pattern.toLowerCase())) {
            reasons.push(`User-Agent contains: "${pattern}"`);
        }
    }

    // Check for missing Chrome client hints (real Chrome browsers have these)
    const isChrome = ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr');
    if (isChrome) {
        for (const header of HEADLESS_INDICATORS.expectedChromeHeaders) {
            if (!headers.get(header)) {
                reasons.push(`Missing Chrome header: ${header}`);
            }
        }
    }

    // Check for webdriver property indicator
    // Note: This is set via header by some detection systems
    if (headers.get('x-webdriver') === 'true') {
        reasons.push('WebDriver header detected');
    }

    // Very short or empty User-Agent
    if (!userAgent || userAgent.length < 50) {
        reasons.push('Suspiciously short User-Agent');
    }

    // Missing common headers that real browsers send
    if (!headers.get('accept-language')) {
        reasons.push('Missing Accept-Language header');
    }

    if (!headers.get('accept-encoding')) {
        reasons.push('Missing Accept-Encoding header');
    }

    return {
        isHeadless: reasons.length >= 2, // At least 2 indicators to flag
        reasons
    };
}

/**
 * Combined spy tool detection
 */
export function detectSpyTool(
    ip: string,
    userAgent: string,
    headers: Headers
): {
    isSpyTool: boolean;
    confidence: 'low' | 'medium' | 'high';
    reasons: string[];
} {
    const reasons: string[] = [];
    let score = 0;

    // Check datacenter IP
    const datacenterCheck = isDatacenterIP(ip);
    if (datacenterCheck.isDatacenter) {
        reasons.push(datacenterCheck.reason!);
        score += 50;
    }

    // Check headless browser
    const headlessCheck = isHeadlessBrowser(userAgent, headers);
    if (headlessCheck.isHeadless) {
        reasons.push(...headlessCheck.reasons);
        score += 30 * headlessCheck.reasons.length;
    }

    // Determine confidence
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (score >= 80) confidence = 'high';
    else if (score >= 50) confidence = 'medium';

    return {
        isSpyTool: score >= 50,
        confidence,
        reasons
    };
}
