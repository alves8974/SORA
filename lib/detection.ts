/**
 * Facebook Bot Detection System
 * Detecta bots e crawlers do Facebook através de múltiplas técnicas
 */

// User-Agents conhecidos do Facebook
const FACEBOOK_USER_AGENTS = [
    'facebookexternalhit',
    'facebot',
    'facebookcatalog',
    'facebook',
    'meta-externalagent',
    'meta-externalfetcher',
];

// Outros bots comuns
const COMMON_BOTS = [
    'bot',
    'crawler',
    'spider',
    'crawling',
    'lighthouse',
    'googlebot',
    'bingbot',
];

// Padrões de referer da Biblioteca de Anúncios do Facebook
const ADS_LIBRARY_REFERERS = [
    'facebook.com/ads/library',
    'facebook.com/ads/archive',
    'facebook.com/business/ads/library',
    'facebook.com/ads/preferences',
    'transparency.fb.com',
    'facebook.com/ads/transparency',
    'facebook.com/page_transparency',
    'business.facebook.com/ads',
    // Versões mobile
    'm.facebook.com/ads/library',
    'm.facebook.com/ads/archive',
    // Versões localizadas
    'fb.com/ads/library',
    'fb.com/ads/archive',
];

// IPs conhecidos do Facebook (ranges principais)
const FACEBOOK_IP_RANGES = [
    '31.13.24.0/21',
    '31.13.64.0/18',
    '66.220.144.0/20',
    '69.63.176.0/20',
    '69.171.224.0/19',
    '74.119.76.0/22',
    '102.132.96.0/20',
    '103.4.96.0/22',
    '157.240.0.0/17',
    '173.252.64.0/18',
    '179.60.192.0/22',
    '185.60.216.0/22',
    '204.15.20.0/22',
];

export interface DetectionResult {
    isBot: boolean;
    confidence: number;
    reasons: string[];
    userAgent: string;
    ip: string;
    timestamp: Date;
}

/**
 * Detecta se a requisição vem de um bot do Facebook ou da Biblioteca de Anúncios
 */
export function detectFacebookBot(userAgent: string, ip?: string, headers?: Headers, referer?: string): DetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    const ua = userAgent.toLowerCase();

    // 1. Verificação de Referer da Biblioteca de Anúncios (PRIORIDADE MÁXIMA)
    if (referer) {
        const refererLower = referer.toLowerCase();
        for (const adsLibraryPattern of ADS_LIBRARY_REFERERS) {
            if (refererLower.includes(adsLibraryPattern)) {
                reasons.push(`🎯 COMPETITOR DETECTED: Access from Facebook Ads Library (${adsLibraryPattern})`);
                confidence += 100; // Confiança máxima - certeza de que é espionagem
                break;
            }
        }
    }

    // 2. Verificação de User-Agent do Facebook
    for (const fbAgent of FACEBOOK_USER_AGENTS) {
        if (ua.includes(fbAgent)) {
            reasons.push(`Facebook User-Agent detected: ${fbAgent}`);
            confidence += 50;
            break;
        }
    }

    // 3. Verificação de bots comuns
    for (const bot of COMMON_BOTS) {
        if (ua.includes(bot)) {
            reasons.push(`Common bot pattern detected: ${bot}`);
            confidence += 20;
            break;
        }
    }

    // 4. Verificação de headers suspeitos
    if (headers) {
        // Facebook bots geralmente não enviam Accept-Language
        if (!headers.get('accept-language')) {
            reasons.push('Missing Accept-Language header (bot indicator)');
            confidence += 15;
        }

        // Verifica se é uma requisição de preview
        const purpose = headers.get('x-purpose') || headers.get('purpose');
        if (purpose === 'preview') {
            reasons.push('Preview request detected');
            confidence += 30;
        }

        // Facebook-specific headers
        if (headers.get('x-fb-http-engine')) {
            reasons.push('Facebook HTTP engine header detected');
            confidence += 40;
        }
    }

    // 5. Verificação de ausência de caracteres JS (headless browser)
    // Isso será verificado no middleware via cookies

    // 6. User-Agent muito simples ou vazio
    if (!userAgent || userAgent.length < 10) {
        reasons.push('Suspicious User-Agent (too short or empty)');
        confidence += 25;
    }

    // 7. Verificação de IP do Facebook (opcional, se fornecido)
    if (ip && isFacebookIP(ip)) {
        reasons.push(`IP matches Facebook range: ${ip}`);
        confidence += 35;
    }

    const isBot = confidence >= 40; // Threshold de 40% para considerar bot

    return {
        isBot,
        confidence: Math.min(confidence, 100),
        reasons,
        userAgent,
        ip: ip || 'unknown',
        timestamp: new Date(),
    };
}

/**
 * Verifica se um IP pertence aos ranges do Facebook
 */
function isFacebookIP(ip: string): boolean {
    // Implementação simplificada - em produção, use uma lib de IP matching
    // Por agora, apenas verifica alguns prefixos conhecidos
    const ipParts = ip.split('.');
    if (ipParts.length !== 4) return false;

    const firstOctet = parseInt(ipParts[0]);
    const secondOctet = parseInt(ipParts[1]);

    // Ranges mais comuns do Facebook
    if (firstOctet === 31 && secondOctet === 13) return true;
    if (firstOctet === 66 && secondOctet === 220) return true;
    if (firstOctet === 69 && (secondOctet === 63 || secondOctet === 171)) return true;
    if (firstOctet === 157 && secondOctet === 240) return true;
    if (firstOctet === 173 && secondOctet === 252) return true;

    return false;
}

/**
 * Extrai o IP real da requisição considerando proxies
 */
export function getRealIP(headers: Headers): string {
    // Vercel usa x-real-ip e x-forwarded-for
    const realIP = headers.get('x-real-ip');
    if (realIP) return realIP;

    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Pega o primeiro IP da lista (IP original)
        return forwardedFor.split(',')[0].trim();
    }

    return 'unknown';
}
