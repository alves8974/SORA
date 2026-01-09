/**
 * Type Definitions for Professional Cloaker Platform
 */

// ==================== CAMPAIGNS ====================

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'draft';

    // === SaaS Features ===
    slug: string;                       // Random URL slug (e.g., 'Kcj7xLm')
    method: 'mirror' | 'redirect' | 'prepage';  // Integration method
    trafficSource: 'meta' | 'google' | 'tiktok' | 'general'; // Traffic platform
    domainId?: string;                  // Optional: linked custom domain

    // Page Configuration
    safePageUrl?: string;
    safePageHtml?: string;
    realPageUrl?: string;
    realPageHtml?: string;

    // Click Tracking
    trackClicks: boolean;
    clickSelector?: string;             // CSS selector do CTA (ex: '[data-cta]')

    // URL Template (with UTM placeholders)
    campaignUrlTemplate?: string;       // "https://domain.com/slug?utm_source={{site_source_name}}"

    // Detection Configuration
    config: CampaignConfig;

    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}

// ==================== DOMAINS ====================

export interface Domain {
    id: string;
    userId?: string;                     // Owner (for multi-tenant)
    domain: string;                      // e.g., "oferta.com"
    campaignId?: string;                 // Optional: linked campaign
    status: 'pending' | 'active' | 'failed';
    verificationToken: string;           // For CNAME verification
    verificationMethod: 'cname' | 'txt'; // DNS verification type
    verifiedAt?: string;
    sslStatus?: 'pending' | 'active' | 'failed';
    sslIssuedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CampaignConfig {
    // === NEW: Detection Mode (Critical Fix) ===
    detectionMode: 'strict' | 'balanced' | 'permissive';

    // Thresholds (now probabilistic 0.0-1.0)
    botThreshold: number; // 0.0-1.0, default 0.7 (70%)
    fingerprintingEnabled: boolean;
    behavioralEnabled: boolean;
    externalApisEnabled: boolean;

    // === NEW: Probabilistic Weights (sum to 1.0) ===
    weights: {
        referer: number;        // 0.35 (35% of final score)
        ipRange: number;        // 0.25 (25%) - ASN-based now
        userAgent: number;      // 0.15 (15%) - reduced from 50
        headers: number;        // 0.15 (15%) - reduced
        fingerprint: number;    // 0.05 (5%)  - analytics only
        behavioral: number;     // 0.05 (5%)  - weak signal
        externalApi: number;    // 0.0  (0%)  - disabled by default
    };

    // Advanced Options
    allowedCountries?: string[];
    blockedCountries?: string[];
    allowedIps?: string[];
    blockedIps?: string[];

    // Rate Limiting
    maxVisitsPerHour?: number;
    maxVisitsPerIp?: number;

    // === NEW: Privacy & Compliance ===
    anonymizeIPs: boolean; // Hash IPs for GDPR compliance
}

// ==================== DETECTION ====================

export interface DetectionResult {
    isBot: boolean;
    confidence: number;
    totalScore: number;
    maxPossibleScore: number;

    // Individual scores
    scores: {
        referer?: DetectionScore;
        userAgent?: DetectionScore;
        ipRange?: DetectionScore;
        headers?: DetectionScore;
        fingerprint?: DetectionScore;
        behavioral?: DetectionScore;
        externalApi?: DetectionScore;
    };

    // Metadata
    userAgent: string;
    ip: string;
    timestamp: Date;
    campaignId?: string;
}

export interface DetectionScore {
    score: number;        // Points earned
    maxScore: number;     // Max possible points
    confidence: number;   // 0-100
    reasons: string[];
    weight: number;
}

// ==================== FINGERPRINTING ====================

export interface FingerprintData {
    // Canvas
    canvasHash?: string;

    // WebGL
    webglVendor?: string;
    webglRenderer?: string;
    webglHash?: string;

    // Screen
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
    pixelRatio: number;

    // Browser
    platform: string;
    language: string;
    languages: string[];
    timezone: string;
    timezoneOffset: number;

    // Hardware
    hardwareConcurrency: number;
    deviceMemory?: number;

    // Battery
    batteryCharging?: boolean;
    batteryLevel?: number;

    // Audio
    audioHash?: string;

    // Fonts
    fonts?: string[];

    // Plugins
    plugins?: string[];

    // Touch
    touchSupport: boolean;
    maxTouchPoints: number;

    // Media Devices
    mediaDevices?: {
        audioInput: number;
        audioOutput: number;
        videoInput: number;
    };
}

export interface BehavioralData {
    // Mouse
    mouseMovements: number;
    mouseClicks: number;
    mouseDistance: number; // pixels traveled

    // Scroll
    scrollEvents: number;
    scrollDistance: number;

    // Timing
    timeToFirstInteraction?: number; // ms
    timeOnPage: number;

    // Keyboard
    keyPresses: number;

    // Touch
    touchEvents: number;

    // Navigation
    pageVisibility: boolean;
    focusChanges: number;
}

// ==================== LOGGING ====================

export interface VisitLog {
    id: string;
    campaignId: string;
    timestamp: string;

    // Request Info
    userAgent: string;
    ip: string;
    country?: string;
    referer?: string;

    // Detection
    isBot: boolean;
    confidence: number;
    detection: DetectionResult;

    // Page Served
    page: 'safe' | 'real';

    // Fingerprint (if collected)
    fingerprint?: FingerprintData;
    behavioral?: BehavioralData;

    // External API Results
    ipQuality?: IPQualityResult;
}

export interface IPQualityResult {
    provider: 'ipintel' | 'proxycheck' | 'ipqs';
    isProxy: boolean;
    isVpn: boolean;
    isTor: boolean;
    isHosting: boolean;
    score: number; // 0-100
    country: string;
    isp?: string;
}

// ==================== ANALYTICS ====================

export interface CampaignStats {
    campaignId: string;

    // Counts
    totalVisits: number;
    botVisits: number;
    realVisits: number;

    // Rates
    cloakingRate: number; // percentage
    conversionRate?: number; // if tracking enabled

    // Breakdown
    byCountry: Record<string, number>;
    byDevice: Record<string, number>;
    byHour: Record<string, number>;

    // Detection Methods
    detectionBreakdown: {
        userAgent: number;
        ipRange: number;
        headers: number;
        fingerprint: number;
        behavioral: number;
        externalApi: number;
    };

    // Time
    lastVisit?: string;
    lastUpdated: string;
}

export interface GlobalStats {
    totalCampaigns: number;
    activeCampaigns: number;
    totalVisits: number;
    totalBotVisits: number;
    totalRealVisits: number;
    avgCloakingRate: number;

    // Top Campaigns
    topCampaigns: {
        campaignId: string;
        name: string;
        visits: number;
    }[];

    lastUpdated: string;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==================== SETTINGS ====================

export interface SystemSettings {
    // Feature Flags
    fingerprintingEnabled: boolean;
    behavioralEnabled: boolean;
    externalApisEnabled: boolean;

    // API Keys
    ipintelApiKey?: string;
    proxycheckApiKey?: string;
    fingerprintjsProKey?: string;

    // Global Defaults
    defaultBotThreshold: number;
    defaultWeights: CampaignConfig['weights'];

    // Rate Limiting
    globalRateLimit: number;

    // Retention
    logRetentionDays: number;
}

// ==================== HELPERS ====================

export type CampaignStatus = Campaign['status'];
export type PageType = 'safe' | 'real';
export type DetectionMethod = keyof CampaignConfig['weights'];

// ==================== SaaS MULTI-TENANT ====================

// Domain interface already defined above at line 43

/**
 * Click Tracking Logs
 * Differentiates visits from actual clicks on CTA
 */
export interface ClickLog {
    id: string;
    campaignId: string;
    visitLogId: string;                  // Links to VisitLog
    timestamp: string;
    eventType: 'click' | 'conversion';
    elementClicked?: string;             // CSS selector clicked
    metadata?: Record<string, any>;
}

/**
 * Enhanced Campaign Stats with CTR
 */
export interface EnhancedCampaignStats extends CampaignStats {
    totalClicks: number;
    ctr: number;                         // Click-through rate (clicks/realVisits)
    conversionRate?: number;
}

// Type aliases for better DX
export type TrafficSource = Campaign['trafficSource'];
export type IntegrationMethod = Campaign['method'];

