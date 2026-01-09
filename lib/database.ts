import { kv } from '@vercel/kv';
import type {
    Campaign,
    CampaignConfig,
    CampaignStats,
    DetectionResult,
    VisitLog,
    GlobalStats,
    IPQualityResult,
    FingerprintData,
    BehavioralData
} from './types';
import { generateUniqueSlug } from './slugs';

// ==================== CAMPAIGNS ====================

/**
 * Create a new campaign with random slug
 */
export async function createCampaign(
    campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & { slug?: string }
): Promise<Campaign> {
    const id = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate unique random slug if not provided
    const slug = campaign.slug || await generateUniqueSlug();

    const newCampaign: Campaign = {
        ...campaign,
        id,
        slug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Save campaign
    await kv.set(`campaign:${id}`, newCampaign);

    // Index slug → id mapping for fast lookup
    await kv.set(`slug:${slug}`, id);

    // Add to list
    await kv.lpush('campaigns:list', id);

    // Initialize stats
    await initCampaignStats(id);

    return newCampaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
    try {
        const campaign = await kv.get<Campaign>(`campaign:${id}`);
        return campaign;
    } catch (error) {
        console.error(`Error getting campaign ${id}:`, error);
        return null;
    }
}

/**
 * Get campaign by slug (for URL routing)
 */
export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
    try {
        // Get campaign ID from slug index
        const campaignId = await kv.get<string>(`slug:${slug}`);

        if (!campaignId) {
            return null;
        }

        // Get campaign data
        return await getCampaign(campaignId);
    } catch (error) {
        console.error(`Error getting campaign by slug ${slug}:`, error);
        return null;
    }
}

/**
 * Get all campaigns
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
    try {
        const campaignIds = await kv.lrange('campaigns:list', 0, -1);

        if (!campaignIds || campaignIds.length === 0) {
            return [];
        }

        const campaigns = await Promise.all(
            campaignIds.map(id => kv.get<Campaign>(`campaign:${id as string}`))
        );

        return campaigns.filter(c => c !== null) as Campaign[];
    } catch (error) {
        console.error('Error getting all campaigns:', error);
        return [];
    }
}

/**
 * Update campaign
 */
export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    try {
        const campaign = await getCampaign(id);
        if (!campaign) return null;

        const updated: Campaign = {
            ...campaign,
            ...updates,
            id, // Prevent ID change
            updatedAt: new Date().toISOString(),
        };

        await kv.set(`campaign:${id}`, updated);

        // Clear cache
        await kv.del(`cache:campaign:${id}`);

        return updated;
    } catch (error) {
        console.error(`Error updating campaign ${id}:`, error);
        return null;
    }
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<boolean> {
    try {
        // Remove from list
        await kv.lrem('campaigns:list', 0, id);

        // Delete campaign data
        await kv.del(
            `campaign:${id}`,
            `campaign:${id}:stats`,
            `campaign:${id}:visits`,
            `cache:campaign:${id}`
        );

        return true;
    } catch (error) {
        console.error(`Error deleting campaign ${id}:`, error);
        return false;
    }
}

/**
 * Toggle campaign status
 */
export async function toggleCampaignStatus(id: string): Promise<Campaign | null> {
    const campaign = await getCampaign(id);
    if (!campaign) return null;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    return updateCampaign(id, { status: newStatus });
}

// ==================== CAMPAIGN STATS ====================

/**
 * Initialize campaign stats
 */
async function initCampaignStats(campaignId: string): Promise<void> {
    const stats: CampaignStats = {
        campaignId,
        totalVisits: 0,
        botVisits: 0,
        realVisits: 0,
        cloakingRate: 0,
        byCountry: {},
        byDevice: {},
        byHour: {},
        detectionBreakdown: {
            userAgent: 0,
            ipRange: 0,
            headers: 0,
            fingerprint: 0,
            behavioral: 0,
            externalApi: 0,
        },
        lastUpdated: new Date().toISOString(),
    };

    await kv.set(`campaign:${campaignId}:stats`, stats);
}

/**
 * Get campaign stats
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    try {
        const stats = await kv.get<CampaignStats>(`campaign:${campaignId}:stats`);
        return stats;
    } catch (error) {
        console.error(`Error getting stats for campaign ${campaignId}:`, error);
        return null;
    }
}

/**
 * Update campaign stats
 */
async function updateCampaignStats(
    campaignId: string,
    detection: DetectionResult,
    country?: string,
    device?: string
): Promise<void> {
    try {
        const stats = await getCampaignStats(campaignId);
        if (!stats) return;

        // Update counts
        stats.totalVisits++;
        if (detection.isBot) {
            stats.botVisits++;
        } else {
            stats.realVisits++;
        }

        // Update cloaking rate
        stats.cloakingRate = (stats.botVisits / stats.totalVisits) * 100;

        // Update by country
        if (country) {
            stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
        }

        // Update by device
        if (device) {
            stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;
        }

        // Update by hour
        const hour = new Date().getHours().toString();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

        // Update detection breakdown
        Object.entries(detection.scores).forEach(([method, score]) => {
            if (score && score.score > 0) {
                stats.detectionBreakdown[method as keyof typeof stats.detectionBreakdown]++;
            }
        });

        stats.lastVisit = new Date().toISOString();
        stats.lastUpdated = new Date().toISOString();

        await kv.set(`campaign:${campaignId}:stats`, stats);
    } catch (error) {
        console.error('Error updating campaign stats:', error);
    }
}

// ==================== VISIT LOGGING ====================

/**
 * Log a visit for a campaign
 */
export async function logCampaignVisit(
    campaignId: string,
    detection: DetectionResult,
    page: 'safe' | 'real',
    options?: {
        referer?: string;
        country?: string;
        fingerprint?: FingerprintData;
        behavioral?: BehavioralData;
        ipQuality?: IPQualityResult;
    }
): Promise<void> {
    try {
        const visitId = `visit:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

        const log: VisitLog = {
            id: visitId,
            campaignId,
            timestamp: detection.timestamp.toISOString(),
            userAgent: detection.userAgent,
            ip: detection.ip,
            country: options?.country,
            referer: options?.referer,
            isBot: detection.isBot,
            confidence: detection.confidence,
            detection,
            page,
            fingerprint: options?.fingerprint,
            behavioral: options?.behavioral,
            ipQuality: options?.ipQuality,
        };

        // Save the log (expires in 30 days)
        await kv.set(visitId, log, { ex: 60 * 60 * 24 * 30 });

        // Add to campaign's recent visits
        await kv.lpush(`campaign:${campaignId}:visits`, visitId);
        await kv.ltrim(`campaign:${campaignId}:visits`, 0, 999);

        // Add to global recent visits
        await kv.lpush('visits:recent', visitId);
        await kv.ltrim('visits:recent', 0, 999);

        // Update campaign stats
        await updateCampaignStats(campaignId, detection, options?.country);

        // Update global stats
        await updateGlobalStats(detection.isBot);

    } catch (error) {
        console.error('Error logging campaign visit:', error);
    }
}

/**
 * Get recent logs for a campaign
 */
export async function getCampaignLogs(campaignId: string, limit: number = 100): Promise<VisitLog[]> {
    try {
        const visitIds = await kv.lrange(`campaign:${campaignId}:visits`, 0, limit - 1);

        if (!visitIds || visitIds.length === 0) {
            return [];
        }

        const logs = await Promise.all(
            visitIds.map(id => kv.get<VisitLog>(id as string))
        );

        return logs.filter(log => log !== null) as VisitLog[];
    } catch (error) {
        console.error('Error getting campaign logs:', error);
        return [];
    }
}

// ==================== GLOBAL STATS ====================

/**
 * Update global statistics
 */
async function updateGlobalStats(isBot: boolean): Promise<void> {
    try {
        await kv.incr('stats:total');

        if (isBot) {
            await kv.incr('stats:bots');
        } else {
            await kv.incr('stats:real');
        }

        await kv.set('stats:updated', new Date().toISOString());
    } catch (error) {
        console.error('Error updating global stats:', error);
    }
}

/**
 * Get global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    try {
        const [total, bots, real, campaigns] = await Promise.all([
            kv.get<number>('stats:total') || 0,
            kv.get<number>('stats:bots') || 0,
            kv.get<number>('stats:real') || 0,
            getAllCampaigns(),
        ]);

        const totalVisits = Number(total) || 0;
        const botVisits = Number(bots) || 0;
        const realVisits = Number(real) || 0;

        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

        // Get top campaigns by visits
        const campaignStats = await Promise.all(
            campaigns.slice(0, 10).map(c => getCampaignStats(c.id))
        );

        const topCampaigns = campaignStats
            .filter(s => s !== null)
            .map(s => ({
                campaignId: s!.campaignId,
                name: campaigns.find(c => c.id === s!.campaignId)?.name || 'Unknown',
                visits: s!.totalVisits,
            }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);

        return {
            totalCampaigns: campaigns.length,
            activeCampaigns,
            totalVisits,
            totalBotVisits: botVisits,
            totalRealVisits: realVisits,
            avgCloakingRate: totalVisits > 0 ? (botVisits / totalVisits) * 100 : 0,
            topCampaigns,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting global stats:', error);
        return {
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalVisits: 0,
            totalBotVisits: 0,
            totalRealVisits: 0,
            avgCloakingRate: 0,
            topCampaigns: [],
            lastUpdated: new Date().toISOString(),
        };
    }
}

/**
 * Get recent logs (all campaigns)
 */
export async function getRecentLogs(limit: number = 100): Promise<VisitLog[]> {
    try {
        const visitIds = await kv.lrange('visits:recent', 0, limit - 1);

        if (!visitIds || visitIds.length === 0) {
            return [];
        }

        const logs = await Promise.all(
            visitIds.map(id => kv.get<VisitLog>(id as string))
        );

        return logs.filter(log => log !== null) as VisitLog[];
    } catch (error) {
        console.error('Error getting recent logs:', error);
        return [];
    }
}

// ==================== CACHE ====================

/**
 * Cache campaign for fast lookup
 */
export async function cacheCampaign(campaign: Campaign): Promise<void> {
    await kv.set(`cache:campaign:${campaign.id}`, campaign, { ex: 300 }); // 5 min
}

/**
 * Get cached campaign
 */
export async function getCachedCampaign(id: string): Promise<Campaign | null> {
    return await kv.get<Campaign>(`cache:campaign:${id}`);
}

// ==================== LEGACY COMPATIBILITY ====================

/**
 * Legacy log visit function (for backward compatibility)
 */
export async function logVisit(detection: DetectionResult, page: 'safe' | 'real', referer?: string): Promise<void> {
    // This is kept for backward compatibility but won't be used in new system
    console.warn('Legacy logVisit called - use logCampaignVisit instead');
}

export interface Stats {
    totalVisits: number;
    botVisits: number;
    realVisits: number;
    cloakingRate: number;
    lastUpdated: string;
}

// Re-export for backward compatibility
export type { VisitLog };

/**
 * Legacy getStats function
 */
export async function getStats(): Promise<Stats> {
    const globalStats = await getGlobalStats();
    return {
        totalVisits: globalStats.totalVisits,
        botVisits: globalStats.totalBotVisits,
        realVisits: globalStats.totalRealVisits,
        cloakingRate: globalStats.avgCloakingRate,
        lastUpdated: globalStats.lastUpdated,
    };
}
