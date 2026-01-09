/**
 * External API Integrations
 * Proxy/VPN detection and IP quality scoring
 */

import type { IPQualityResult } from './types';

/**
 * Check IP quality using IPIntel.io
 */
export async function checkIPIntel(ip: string, apiKey?: string): Promise<IPQualityResult | null> {
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://check.getipintel.net/check.php?ip=${ip}&contact=${apiKey}&format=json&flags=b`,
            {
                method: 'GET',
                headers: {
                    'User-Agent': 'Cloaker/1.0',
                },
            }
        );

        const data = await response.json();

        // IPIntel returns 0-1 score, convert to 0-100
        const score = Math.round(data.result * 100);

        return {
            provider: 'ipintel',
            isProxy: score > 90,
            isVpn: score > 90,
            isTor: false,
            isHosting: score > 95,
            score,
            country: '',
        };
    } catch (error) {
        console.error('IPIntel check failed:', error);
        return null;
    }
}

/**
 * Check IP quality using ProxyCheck.io
 */
export async function checkProxyCheck(ip: string, apiKey?: string): Promise<IPQualityResult | null> {
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://proxycheck.io/v2/${ip}?key=${apiKey}&vpn=1&asn=1`,
            {
                method: 'GET',
            }
        );

        const data = await response.json();
        const ipData = data[ip];

        if (!ipData) return null;

        const isProxy = ipData.proxy === 'yes';
        const isVpn = ipData.type === 'VPN';
        const isTor = ipData.type === 'TOR';

        return {
            provider: 'proxycheck',
            isProxy,
            isVpn,
            isTor,
            isHosting: ipData.type === 'Hosting',
            score: isProxy || isVpn || isTor ? 90 : 10,
            country: ipData.isocode || '',
            isp: ipData.provider || '',
        };
    } catch (error) {
        console.error('ProxyCheck check failed:', error);
        return null;
    }
}

/**
 * Check IP quality using IPQS (IP Quality Score)
 */
export async function checkIPQS(ip: string, apiKey?: string): Promise<IPQualityResult | null> {
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}?strictness=1`,
            {
                method: 'GET',
            }
        );

        const data = await response.json();

        if (!data.success) return null;

        return {
            provider: 'ipqs',
            isProxy: data.proxy,
            isVpn: data.vpn,
            isTor: data.tor,
            isHosting: data.host,
            score: data.fraud_score,
            country: data.country_code,
            isp: data.ISP,
        };
    } catch (error) {
        console.error('IPQS check failed:', error);
        return null;
    }
}

/**
 * Check IP quality using best available provider
 */
export async function checkIPQuality(
    ip: string,
    apiKeys?: {
        ipintel?: string;
        proxycheck?: string;
        ipqs?: string;
    }
): Promise<IPQualityResult | null> {
    // Try providers in order of reliability
    if (apiKeys?.ipqs) {
        const result = await checkIPQS(ip, apiKeys.ipqs);
        if (result) return result;
    }

    if (apiKeys?.proxycheck) {
        const result = await checkProxyCheck(ip, apiKeys.proxycheck);
        if (result) return result;
    }

    if (apiKeys?.ipintel) {
        const result = await checkIPIntel(ip, apiKeys.ipintel);
        if (result) return result;
    }

    return null;
}

/**
 * Get geolocation from IP (free service)
 */
export async function getGeolocation(ip: string): Promise<{ country: string; timezone: string } | null> {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        return {
            country: data.country_code || '',
            timezone: data.timezone || '',
        };
    } catch (error) {
        console.error('Geolocation failed:', error);
        return null;
    }
}
