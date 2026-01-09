/**
 * Advanced Scoring System
 * Multi-layer weighted scoring for bot detection
 */

import type {
    DetectionResult,
    DetectionScore,
    CampaignConfig,
    FingerprintData,
    BehavioralData,
    IPQualityResult
} from './types';

/**
 * Calculate detection score from all sources
 */
export function calculateDetectionScore(
    userAgent: string,
    ip: string,
    headers: Headers,
    config: CampaignConfig,
    fingerprint?: FingerprintData,
    behavioral?: BehavioralData,
    ipQuality?: IPQualityResult
): DetectionResult {
    const scores: DetectionResult['scores'] = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Get referer from headers
    const referer = headers.get('referer') || undefined;

    // 0. PRIORITY: Referer Analysis (Facebook Ads Library Detection)
    // This has the highest priority - if detected, immediately flag as bot
    if (referer && config.weights.referer > 0) {
        scores.referer = analyzeReferer(referer, config.weights.referer);
        if (scores.referer.score === scores.referer.maxScore) {
            // If ads library detected, override everything else
            return {
                isBot: true,
                confidence: 100,
                totalScore: scores.referer.score,
                maxPossibleScore: scores.referer.maxScore,
                scores,
                userAgent,
                ip,
                timestamp: new Date(),
            };
        }
        totalScore += scores.referer.score;
        maxPossibleScore += scores.referer.maxScore;
    }

    // 1. User-Agent Analysis
    if (config.weights.userAgent > 0) {
        scores.userAgent = analyzeUserAgent(userAgent, config.weights.userAgent);
        totalScore += scores.userAgent.score;
        maxPossibleScore += scores.userAgent.maxScore;
    }

    // 2. IP Range Analysis
    if (config.weights.ipRange > 0) {
        scores.ipRange = analyzeIPRange(ip, config.weights.ipRange);
        totalScore += scores.ipRange.score;
        maxPossibleScore += scores.ipRange.maxScore;
    }

    // 3. Headers Analysis
    if (config.weights.headers > 0) {
        scores.headers = analyzeHeaders(headers, config.weights.headers);
        totalScore += scores.headers.score;
        maxPossibleScore += scores.headers.maxScore;
    }

    // 4. Fingerprint Analysis
    if (fingerprint && config.fingerprintingEnabled && config.weights.fingerprint > 0) {
        scores.fingerprint = analyzeFingerprint(fingerprint, config.weights.fingerprint);
        totalScore += scores.fingerprint.score;
        maxPossibleScore += scores.fingerprint.maxScore;
    }

    // 5. Behavioral Analysis
    if (behavioral && config.behavioralEnabled && config.weights.behavioral > 0) {
        scores.behavioral = analyzeBehavioral(behavioral, config.weights.behavioral);
        totalScore += scores.behavioral.score;
        maxPossibleScore += scores.behavioral.maxScore;
    }

    // 6. External API Analysis
    if (ipQuality && config.externalApisEnabled && config.weights.externalApi > 0) {
        scores.externalApi = analyzeIPQuality(ipQuality, config.weights.externalApi);
        totalScore += scores.externalApi.score;
        maxPossibleScore += scores.externalApi.maxScore;
    }

    // Calculate final confidence
    const confidence = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const isBot = confidence >= config.botThreshold;

    return {
        isBot,
        confidence: Math.round(confidence),
        totalScore,
        maxPossibleScore,
        scores,
        userAgent,
        ip,
        timestamp: new Date(),
    };
}

/**
 * Analyze Referer (Priority Detection for Ads Library)
 */
function analyzeReferer(referer: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    const refererLower = referer.toLowerCase();

    // Facebook Ads Library patterns (HIGHEST PRIORITY)
    const adsLibraryPatterns = [
        'facebook.com/ads/library',
        'facebook.com/ads/archive',
        'facebook.com/business/ads/library',
        'facebook.com/ads/preferences',
        'transparency.fb.com',
        'facebook.com/ads/transparency',
        'facebook.com/page_transparency',
        'business.facebook.com/ads',
        'm.facebook.com/ads/library',
        'm.facebook.com/ads/archive',
        'fb.com/ads/library',
        'fb.com/ads/archive',
    ];

    for (const pattern of adsLibraryPatterns) {
        if (refererLower.includes(pattern)) {
            reasons.push(`🎯 COMPETITOR ALERT: Access from Facebook Ads Library (${pattern})`);
            score = maxScore; // Maximum score - guaranteed detection
            break;
        }
    }

    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze User-Agent
 */
function analyzeUserAgent(userAgent: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    const ua = userAgent.toLowerCase();

    // Facebook bots
    if (ua.includes('facebookexternalhit')) {
        reasons.push('Facebook External Hit detected');
        score = weight;
    } else if (ua.includes('facebot')) {
        reasons.push('Facebot detected');
        score = weight;
    } else if (ua.includes('meta-externalagent')) {
        reasons.push('Meta External Agent detected');
        score = weight;
    }

    // Other common bots
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        reasons.push('Bot/Crawler pattern in User-Agent');
        score = Math.max(score, weight * 0.8);
    }

    // Headless browsers
    if (ua.includes('headless') || ua.includes('phantom')) {
        reasons.push('Headless browser detected');
        score = Math.max(score, weight * 0.9);
    }

    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze IP Range
 */
function analyzeIPRange(ip: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    const parts = ip.split('.');
    if (parts.length !== 4) {
        return { score: 0, maxScore, confidence: 0, reasons, weight };
    }

    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);

    // Facebook IP ranges
    if (firstOctet === 31 && secondOctet === 13) {
        reasons.push('Facebook IP range (31.13.x.x)');
        score = weight;
    } else if (firstOctet === 66 && secondOctet === 220) {
        reasons.push('Facebook IP range (66.220.x.x)');
        score = weight;
    } else if (firstOctet === 69 && (secondOctet === 63 || secondOctet === 171)) {
        reasons.push(`Facebook IP range (69.${secondOctet}.x.x)`);
        score = weight;
    } else if (firstOctet === 157 && secondOctet === 240) {
        reasons.push('Facebook IP range (157.240.x.x)');
        score = weight;
    } else if (firstOctet === 173 && secondOctet === 252) {
        reasons.push('Facebook IP range (173.252.x.x)');
        score = weight;
    }

    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze Headers
 */
function analyzeHeaders(headers: Headers, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    // Missing Accept-Language
    if (!headers.get('accept-language')) {
        reasons.push('Missing Accept-Language header');
        score += weight * 0.3;
    }

    // Preview requests
    const purpose = headers.get('x-purpose') || headers.get('purpose');
    if (purpose === 'preview') {
        reasons.push('Preview request detected');
        score += weight * 0.7;
    }

    // Facebook HTTP engine
    if (headers.get('x-fb-http-engine')) {
        reasons.push('Facebook HTTP engine detected');
        score += weight * 0.9;
    }

    // Cap at max score
    score = Math.min(score, maxScore);
    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze Fingerprint
 */
function analyzeFingerprint(fingerprint: FingerprintData, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    // Missing canvas fingerprint
    if (!fingerprint.canvasHash) {
        reasons.push('Canvas fingerprinting blocked');
        score += weight * 0.4;
    }

    // Missing WebGL
    if (!fingerprint.webglVendor || !fingerprint.webglRenderer) {
        reasons.push('WebGL information unavailable');
        score += weight * 0.3;
    }

    // Suspicious screen resolution (common bot resolution)
    if (fingerprint.screenWidth === 1024 && fingerprint.screenHeight === 768) {
        reasons.push('Common bot screen resolution detected');
        score += weight * 0.2;
    }

    //  No battery info on "mobile"
    if (fingerprint.touchSupport && fingerprint.batteryLevel === undefined) {
        reasons.push('Touch device without battery info');
        score += weight * 0.25;
    }

    // Low hardware concurrency
    if (fingerprint.hardwareConcurrency && fingerprint.hardwareConcurrency < 2) {
        reasons.push('Suspiciously low CPU cores');
        score += weight * 0.15;
    }

    // Cap at max score
    score = Math.min(score, maxScore);
    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze Behavioral Data
 */
function analyzeBehavioral(behavioral: BehavioralData, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    // No mouse movement
    if (behavioral.mouseMovements === 0 && behavioral.timeOnPage > 1000) {
        reasons.push('No mouse movement detected');
        score += weight * 0.5;
    }

    // Instant interactions
    if (behavioral.timeToFirstInteraction && behavioral.timeToFirstInteraction < 100) {
        reasons.push('Suspiciously fast interactions');
        score += weight * 0.4;
    }

    // No interactions at all
    if (
        behavioral.mouseMovements === 0 &&
        behavioral.mouseClicks === 0 &&
        behavioral.scrollEvents === 0 &&
        behavioral.timeOnPage > 2000
    ) {
        reasons.push('Zero user interactions');
        score += weight * 0.7;
    }

    // Unnatural patterns
    if (behavioral.mouseMovements > 100 && behavioral.mouseDistance < 50) {
        reasons.push('Unnatural mouse movement pattern');
        score += weight * 0.3;
    }

    // Cap at max score
    score = Math.min(score, maxScore);
    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze IP Quality from External API
 */
function analyzeIPQuality(ipQuality: IPQualityResult, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = weight;

    if (ipQuality.isProxy) {
        reasons.push(`Proxy detected (${ipQuality.provider})`);
        score += weight * 0.7;
    }

    if (ipQuality.isVpn) {
        reasons.push(`VPN detected (${ipQuality.provider})`);
        score += weight * 0.6;
    }

    if (ipQuality.isTor) {
        reasons.push(`Tor network detected (${ipQuality.provider})`);
        score += weight * 0.8;
    }

    if (ipQuality.isHosting) {
        reasons.push(`Hosting/Datacenter IP (${ipQuality.provider})`);
        score += weight * 0.5;
    }

    // High fraud score
    if (ipQuality.score > 75) {
        reasons.push(`High fraud score: ${ipQuality.score}`);
        score += weight * 0.4;
    }

    // Cap at max score
    score = Math.min(score, maxScore);
    const confidence = (score / maxScore) * 100;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Get default campaign config
 */
export function getDefaultConfig(): CampaignConfig {
    return {
        detectionMode: 'balanced',
        botThreshold: 0.7,
        anonymizeIPs: true,
        fingerprintingEnabled: true,
        behavioralEnabled: false,
        externalApisEnabled: false,
        weights: {
            userAgent: 0.30,
            ipRange: 0.25,
            referer: 0.20,
            headers: 0.15,
            fingerprint: 0.05,
            behavioral: 0.05,
            externalApi: 0.0
        },
    };
}
