/**
 * INVERTED Cloaker Scoring System (v2.1)
 * 
 * NEW LOGIC: SAFE PAGE is default. OFFER PAGE only for legitimate ad traffic.
 * 
 * This inverts the traditional cloaker approach:
 * - Traditional: Detect bots → show safe page
 * - Inverted: Detect legitimate ad clicks → show offer page
 * 
 * Legitimate Meta Ads traffic is identified by:
 * 1. Presence of fbclid parameter (Facebook Click ID)
 * 2. Absence of bot User-Agent patterns
 * 3. NOT from Ads Library referer
 * 4. Optional: Organic Facebook referer (feed, stories, reels)
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
 * Result type for inverted cloaker logic
 */
export interface LegitimateTrafficResult {
    isLegitimateAdTraffic: boolean;  // true = show offer, false = show safe page
    confidence: number;
    reasons: string[];
    redFlags: string[];
    hasFbclid: boolean;
    hasValidReferer: boolean;
    isBot: boolean;  // Keep for logging compatibility
    totalScore: number;
    maxPossibleScore: number;
    scores: DetectionResult['scores'];
    userAgent: string;
    ip: string;
    timestamp: Date;
}

// Known bot User-Agents
const BOT_USER_AGENTS = [
    'facebookexternalhit',
    'facebot',
    'facebookcatalog',
    'meta-externalagent',
    'meta-externalfetcher',
    'bot',
    'crawler',
    'spider',
    'crawling',
    'lighthouse',
    'googlebot',
    'bingbot',
    'headless',
    'phantom',
    'selenium',
    'puppeteer',
    'playwright',
];

// Ads Library patterns (competitors/reviewers)
const ADS_LIBRARY_PATTERNS = [
    'facebook.com/ads/library',
    'facebook.com/ads/archive',
    'facebook.com/business/ads/library',
    'facebook.com/ads/transparency',
    'facebook.com/ads_library',
    'facebook.com/adsmanager',
    'business.facebook.com/ads',
    'm.facebook.com/ads/library',
    'm.facebook.com/ads',
    'fb.com/ads/library',
    'fb.com/ads',
    'transparency.fb.com',
    'transparency.meta.com',
    'meta.com/transparency',
    'ads.tiktok.com/business/creativecenter',
    'library.tiktok.com',
    'adstransparency.google.com',
    'adlibrary',
];

// Valid organic Facebook referers (legitimate ad placements)
const LEGITIMATE_FB_REFERERS = [
    'facebook.com/posts',
    'facebook.com/permalink',
    'facebook.com/groups',
    'facebook.com/events',
    'facebook.com/marketplace',
    'facebook.com/watch',
    'facebook.com/stories',
    'facebook.com/reel',
    'facebook.com/feed',
    'facebook.com/photo',
    'facebook.com/video',
    'fb.watch',
    'instagram.com/p/',
    'instagram.com/reel',
    'instagram.com/stories',
    'l.facebook.com',  // Facebook link shim
    'lm.facebook.com', // Mobile link shim
    'l.instagram.com', // Instagram link shim
];

/**
 * MAIN FUNCTION: Detect if traffic is from legitimate Meta Ads
 * 
 * Returns isLegitimateAdTraffic = true ONLY if:
 * 1. Has fbclid parameter (required)
 * 2. NOT a bot User-Agent
 * 3. NOT from Ads Library
 */
export function detectLegitimateAdTraffic(
    userAgent: string,
    ip: string,
    headers: Headers,
    searchParams: URLSearchParams,
    config: CampaignConfig
): LegitimateTrafficResult {
    const reasons: string[] = [];
    const redFlags: string[] = [];
    const referer = headers.get('referer') || '';
    const ua = userAgent.toLowerCase();
    const refererLower = referer.toLowerCase();

    // === CHECK 1: fbclid parameter (REQUIRED for offer page) ===
    const fbclid = searchParams.get('fbclid');
    const hasFbclid = !!fbclid && fbclid.length > 10;

    if (hasFbclid) {
        reasons.push(`✓ Has fbclid: ${fbclid.substring(0, 20)}...`);
    } else {
        redFlags.push('✗ No fbclid parameter - not from Meta Ads click');
    }

    // === CHECK 2: Bot User-Agent (BLOCKS offer page) ===
    let isBot = false;
    for (const botPattern of BOT_USER_AGENTS) {
        if (ua.includes(botPattern)) {
            isBot = true;
            redFlags.push(`✗ Bot User-Agent detected: ${botPattern}`);
            break;
        }
    }

    if (!isBot) {
        reasons.push('✓ Not a bot User-Agent');
    }

    // === CHECK 3: Ads Library referer (BLOCKS offer page) ===
    let isFromAdsLibrary = false;
    for (const pattern of ADS_LIBRARY_PATTERNS) {
        if (refererLower.includes(pattern)) {
            isFromAdsLibrary = true;
            redFlags.push(`✗ Ads Library referer detected: ${pattern}`);
            break;
        }
    }

    if (!isFromAdsLibrary && referer) {
        reasons.push('✓ Referer is not Ads Library');
    }

    // === CHECK 4: Valid Facebook referer (BONUS, not required) ===
    let hasValidReferer = false;
    for (const pattern of LEGITIMATE_FB_REFERERS) {
        if (refererLower.includes(pattern)) {
            hasValidReferer = true;
            reasons.push(`✓ Valid Facebook referer: ${pattern}`);
            break;
        }
    }

    // === CHECK 5: Additional suspicious signals ===

    // Facebook-specific headers (bots use these)
    if (headers.get('x-fb-http-engine')) {
        redFlags.push('✗ Facebook HTTP engine header (server-side bot)');
        isBot = true;
    }

    // Preview requests
    const purpose = headers.get('x-purpose') || headers.get('purpose');
    if (purpose === 'preview') {
        redFlags.push('✗ Preview request header');
        isBot = true;
    }

    // Missing Accept-Language (common in bots)
    if (!headers.get('accept-language')) {
        redFlags.push('✗ Missing Accept-Language (suspicious)');
    }

    // Very short or empty User-Agent
    if (!userAgent || userAgent.length < 20) {
        redFlags.push('✗ Suspicious User-Agent (too short)');
        isBot = true;
    }

    // === FINAL DECISION ===
    // Show OFFER only if:
    // 1. Has fbclid (required)
    // 2. NOT a bot
    // 3. NOT from Ads Library
    const isLegitimateAdTraffic = hasFbclid && !isBot && !isFromAdsLibrary;

    // Calculate confidence score
    let confidence = 0;
    if (hasFbclid) confidence += 40;
    if (!isBot) confidence += 30;
    if (!isFromAdsLibrary) confidence += 20;
    if (hasValidReferer) confidence += 10;

    // Reduce confidence for red flags
    confidence = Math.max(0, confidence - (redFlags.length * 10));

    return {
        isLegitimateAdTraffic,
        confidence,
        reasons,
        redFlags,
        hasFbclid,
        hasValidReferer,
        isBot,
        totalScore: isLegitimateAdTraffic ? 1.0 : 0.0,
        maxPossibleScore: 1.0,
        scores: {},
        userAgent,
        ip,
        timestamp: new Date(),
    };
}

/**
 * Normalize a score to 0.0-1.0 range
 */
function normalize(score: number, maxScore: number): number {
    if (maxScore === 0) return 0;
    return Math.min(Math.max(score / maxScore, 0), 1.0);
}

/**
 * Calculate bot probability using weighted signals
 * Returns 0.0 (definitely human) to 1.0 (definitely bot)
 */
export function calculateDetectionProbability(
    userAgent: string,
    ip: string,
    headers: Headers,
    config: CampaignConfig,
    fingerprint?: FingerprintData,
    behavioral?: BehavioralData,
    ipQuality?: IPQualityResult
): DetectionResult {
    const scores: DetectionResult['scores'] = {};
    const referer = headers.get('referer') || undefined;

    // === CRITICAL: Red Flags (Override) ===
    // These immediately flag as bot regardless of mode
    const redFlags: string[] = [];

    // 1. Ads Library Detection (95% confidence, not 100%)
    if (referer && config.weights.referer > 0) {
        scores.referer = analyzeReferer(referer, 1.0);
        if (scores.referer.confidence >= 95) {
            redFlags.push('Ads Library Detected');
        }
    }

    // 2. Known Bot User-Agent
    if (config.weights.userAgent > 0) {
        scores.userAgent = analyzeUserAgent(userAgent, 1.0);
        if (scores.userAgent.confidence >= 90) {
            redFlags.push('Bot User-Agent Detected');
        }
    }

    // 3. IP Range / ASN
    if (config.weights.ipRange > 0) {
        scores.ipRange = analyzeIPRange(ip, 1.0);
        if (scores.ipRange.confidence >= 85) {
            redFlags.push('Bot IP/ASN Detected');
        }
    }

    // 4. Headers Analysis
    if (config.weights.headers > 0) {
        scores.headers = analyzeHeaders(headers, 1.0);
    }

    // 5. Fingerprint (analytics only, low weight)
    if (fingerprint && config.fingerprintingEnabled && config.weights.fingerprint > 0) {
        scores.fingerprint = analyzeFingerprint(fingerprint, 1.0);
    }

    // 6. Behavioral (weak signal)
    if (behavioral && config.behavioralEnabled && config.weights.behavioral > 0) {
        scores.behavioral = analyzeBehavioral(behavioral, 1.0);
    }

    // 7. External API
    if (ipQuality && config.externalApisEnabled && config.weights.externalApi > 0) {
        scores.externalApi = analyzeIPQuality(ipQuality, 1.0);
    }

    // === Calculate Weighted Probability ===
    let probability = 0.0;

    // Each signal contributes weighted percentage
    if (scores.referer) {
        probability += normalize(scores.referer.score, scores.referer.maxScore) * config.weights.referer;
    }
    if (scores.ipRange) {
        probability += normalize(scores.ipRange.score, scores.ipRange.maxScore) * config.weights.ipRange;
    }
    if (scores.userAgent) {
        probability += normalize(scores.userAgent.score, scores.userAgent.maxScore) * config.weights.userAgent;
    }
    if (scores.headers) {
        probability += normalize(scores.headers.score, scores.headers.maxScore) * config.weights.headers;
    }
    if (scores.fingerprint) {
        probability += normalize(scores.fingerprint.score, scores.fingerprint.maxScore) * config.weights.fingerprint;
    }
    if (scores.behavioral) {
        probability += normalize(scores.behavioral.score, scores.behavioral.maxScore) * config.weights.behavioral;
    }
    if (scores.externalApi) {
        probability += normalize(scores.externalApi.score, scores.externalApi.maxScore) * config.weights.externalApi;
    }

    // === Apply Detection Mode Logic ===
    let isBot = false;
    let finalConfidence = Math.round(probability * 100);

    if (redFlags.length > 0) {
        // Red flags = immediate block (all modes)
        isBot = true;
        finalConfidence = 95; // High confidence
    } else {
        // Apply mode-specific threshold
        switch (config.detectionMode) {
            case 'strict':
                // Block unless very low probability
                // Good for: Facebook Ads (Black Hat)
                isBot = probability >= 0.50; // 50% threshold
                break;

            case 'balanced':
                // Block if moderate-high probability
                // Good for: Most cases
                isBot = probability >= config.botThreshold; // Default 0.7 (70%)
                break;

            case 'permissive':
                // Allow unless very high probability
                // Good for: Google Ads, TikTok
                isBot = probability >= 0.85; // 85% threshold
                break;

            default:
                isBot = probability >= config.botThreshold;
        }
    }

    return {
        isBot,
        confidence: finalConfidence,
        totalScore: probability,
        maxPossibleScore: 1.0,
        scores,
        userAgent,
        ip,
        timestamp: new Date(),
    };
}

/**
 * Analyze Referer (Ads Library Detection)
 * CRITICAL: This is the main detection for Ads Library clicks
 * Confidence: 95% (not 100% - can be spoofed)
 */
function analyzeReferer(referer: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    const refererLower = referer.toLowerCase();

    // === HIGH CONFIDENCE: Direct Ads Library patterns ===
    const adsLibraryPatterns = [
        // Facebook Ads Library (all variations)
        'facebook.com/ads/library',
        'facebook.com/ads/archive',
        'facebook.com/business/ads/library',
        'facebook.com/ads/transparency',
        'facebook.com/ads_library',
        'facebook.com/adsmanager',
        'business.facebook.com/ads',
        'm.facebook.com/ads/library',
        'm.facebook.com/ads',
        'fb.com/ads/library',
        'fb.com/ads',
        // Meta Transparency
        'transparency.fb.com',
        'transparency.meta.com',
        'meta.com/transparency',
        // TikTok Ads Library
        'ads.tiktok.com/business/creativecenter',
        'library.tiktok.com',
        'tiktok.com/business/creative',
        // Google Ads Transparency
        'adstransparency.google.com',
        'google.com/ads/transparency',
        // Other ad libraries
        'adlibrary',
        'adsinfo',
        'ads_info',
        'ad-library',
    ];

    for (const pattern of adsLibraryPatterns) {
        if (refererLower.includes(pattern)) {
            reasons.push(`🎯 ADS LIBRARY: ${pattern} detected`);
            score = 95;
            break;
        }
    }

    // === MEDIUM CONFIDENCE: Facebook click without organic context ===
    // If someone clicks from Facebook but it's NOT from a post/feed,
    // it might be from the Ads Library preview button
    if (score === 0 && refererLower.includes('facebook.com')) {
        // Check if it's a normal organic click (has post/feed context)
        const organicPatterns = [
            '/posts/',
            '/permalink/',
            '/groups/',
            '/events/',
            '/marketplace/',
            '/watch/',
            '/stories/',
            '/reel/',
            '/feed',
            'fbid=',
            'story_fbid',
            'photo.php',
            'video.php',
        ];

        const isOrganic = organicPatterns.some(p => refererLower.includes(p));

        if (!isOrganic) {
            // Direct Facebook referer without organic context
            // Could be Ads Library or Ads Manager preview
            reasons.push('⚠️ Facebook referer without organic context (suspicious)');
            score = 60; // Medium confidence
        }
    }

    // === LOW CONFIDENCE: Meta/Instagram without clear context ===
    if (score === 0) {
        if (refererLower.includes('instagram.com/about') ||
            refererLower.includes('meta.com/') ||
            refererLower.includes('business.instagram.com')) {
            reasons.push('Meta/Instagram business page (low confidence)');
            score = 30;
        }
    }

    const confidence = score;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze User-Agent
 * Weight reduced: 30 (was 50)
 */
function analyzeUserAgent(userAgent: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    const ua = userAgent.toLowerCase();

    // Facebook bots (high confidence)
    if (ua.includes('facebookexternalhit') || ua.includes('facebot')) {
        reasons.push('Facebook Bot UA');
        score = 90;
    } else if (ua.includes('meta-externalagent')) {
        reasons.push('Meta External Agent');
        score = 85;
    }
    // Other bots (medium confidence)
    else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        reasons.push('Generic bot pattern');
        score = 60;
    }
    // Headless (spoofable)
    else if (ua.includes('headless') || ua.includes('phantom')) {
        reasons.push('Headless browser');
        score = 70;
    }

    const confidence = score;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze IP Range
 * TODO: Implement ASN lookup for production
 * Weight: 40 (increased from 35)
 */
function analyzeIPRange(ip: string, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    const parts = ip.split('.');
    if (parts.length !== 4) {
        return { score: 0, maxScore, confidence: 0, reasons, weight };
    }

    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);

    // Facebook IP ranges (will be replaced with ASN lookup)
    if (firstOctet === 31 && secondOctet === 13) {
        reasons.push('Facebook IP range (31.13.x.x)');
        score = 85;
    } else if (firstOctet === 66 && secondOctet === 220) {
        reasons.push('Facebook IP range (66.220.x.x)');
        score = 85;
    } else if (firstOctet === 157 && secondOctet === 240) {
        reasons.push('Facebook IP range (157.240.x.x)');
        score = 85;
    } else if (firstOctet === 173 && secondOctet === 252) {
        reasons.push('Facebook IP range (173.252.x.x)');
        score = 85;
    }

    const confidence = score;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Analyze Headers
 * Now includes Sec-Fetch-* headers for better cross-site detection
 * Weight: 35
 */
function analyzeHeaders(headers: Headers, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    // Missing Accept-Language (weak signal)
    if (!headers.get('accept-language')) {
        reasons.push('Missing Accept-Language (weak signal)');
        score += 20;
    }

    // Preview requests (strong signal)
    const purpose = headers.get('x-purpose') || headers.get('purpose');
    if (purpose === 'preview') {
        reasons.push('Preview request header');
        score += 60;
    }

    // Facebook HTTP engine (strong signal)
    if (headers.get('x-fb-http-engine')) {
        reasons.push('Facebook HTTP engine');
        score += 70;
    }

    // === NEW: Sec-Fetch-* headers (modern browsers) ===
    // These are harder to spoof and provide good context

    const secFetchSite = headers.get('sec-fetch-site');
    const secFetchMode = headers.get('sec-fetch-mode');
    const secFetchDest = headers.get('sec-fetch-dest');

    // Check the origin header for Facebook/Meta domains
    const origin = headers.get('origin') || '';
    if (origin.includes('facebook.com') || origin.includes('meta.com') || origin.includes('fb.com')) {
        reasons.push('Origin from Facebook/Meta domain');
        score += 40;
    }

    // Check if this is a cross-site navigation (could be from Ads Library)
    // This alone isn't enough, but combined with other signals it helps
    if (secFetchSite === 'cross-site' && secFetchMode === 'navigate') {
        // Cross-site navigation - check referer too
        const referer = headers.get('referer') || '';
        if (referer.includes('facebook.com') || referer.includes('fb.com')) {
            reasons.push('Cross-site navigation from Facebook');
            score += 30;
        }
    }

    // Iframes and embeds (sometimes used in previews)
    if (secFetchDest === 'iframe' || secFetchDest === 'embed') {
        reasons.push('Iframe/embed request');
        score += 20;
    }

    score = Math.min(score, maxScore);
    const confidence = score;

    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Other analysis functions (fingerprint, behavioral, etc)
 * Kept from original but with reduced weights
 */
function analyzeFingerprint(fingerprint: FingerprintData, weight: number): DetectionScore {
    // Simplified - just return low score
    // Fingerprinting is analytics-only now
    return { score: 0, maxScore: 100, confidence: 0, reasons: ['Analytics only'], weight };
}

function analyzeBehavioral(behavioral: BehavioralData, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    // Very basic - bots can simulate this easily
    if (behavioral.mouseMovements === 0 && behavioral.timeOnPage > 2000) {
        reasons.push('No mouse movement (weak signal)');
        score = 40; // Low confidence
    }

    const confidence = score;
    return { score, maxScore, confidence, reasons, weight };
}

function analyzeIPQuality(ipQuality: IPQualityResult, weight: number): DetectionScore {
    const reasons: string[] = [];
    let score = 0;
    const maxScore = 100;

    if (ipQuality.isProxy || ipQuality.isVpn) {
        reasons.push('Proxy/VPN detected');
        score = 60;
    }

    if (ipQuality.isTor) {
        reasons.push('Tor network');
        score = 80;
    }

    const confidence = score;
    return { score, maxScore, confidence, reasons, weight };
}

/**
 * Get default config with new probabilistic weights
 */
export function getDefaultConfig(): CampaignConfig {
    return {
        detectionMode: 'balanced', // NEW
        botThreshold: 0.7, // 70% probability
        fingerprintingEnabled: false, // Analytics only
        behavioralEnabled: false, // Weak signal
        externalApisEnabled: false,
        weights: {
            referer: 0.35,      // 35% of final score
            ipRange: 0.25,      // 25%
            userAgent: 0.15,    // 15% (reduced)
            headers: 0.15,      // 15% (reduced)
            fingerprint: 0.05,  // 5% (analytics)
            behavioral: 0.05,   // 5% (weak)
            externalApi: 0.0,   // 0% (disabled)
        },
        anonymizeIPs: true, // GDPR compliance
    };
}

// Legacy export for backward compatibility
export { calculateDetectionProbability as calculateDetectionScore };
