/**
 * Postgres Database Layer
 * Logging visits, clicks, and stats
 */

import { sql } from '@vercel/postgres';
import type { DetectionResult, CampaignStats } from './types';
import type { LegitimateTrafficResult } from './scoring-v2';

/**
 * Simple hash function for IP anonymization (Edge Runtime compatible)
 */
function hashIP(ip: string): string {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Log a visit to Postgres (not Redis)
 * Async, non-blocking
 * Supports both old DetectionResult and new LegitimateTrafficResult
 */
export async function logVisitToPostgres(
    campaignId: string,
    detection: DetectionResult | LegitimateTrafficResult,
    pageServed: 'safe' | 'real',
    metadata?: {
        referer?: string;
        country?: string;
        anonymizeIP?: boolean;
        isNewVisit?: boolean;  // If false, skip logging (duplicate visit)
    }
): Promise<void> {
    try {
        // Skip logging if this is a duplicate visit (deduplication)
        if (metadata?.isNewVisit === false) {
            console.log(`[Dedup] Skipping duplicate visit for campaign ${campaignId}`);
            return;
        }

        const ipHash = metadata?.anonymizeIP !== false
            ? hashIP(detection.ip)
            : detection.ip;

        await sql`
      INSERT INTO visit_logs (
        campaign_id,
        ip_hash,
        user_agent,
        referer,
        country,
        is_bot,
        confidence,
        probability,
        page_served,
        detection_details
      ) VALUES (
        ${campaignId},
        ${ipHash},
        ${detection.userAgent},
        ${metadata?.referer || null},
        ${metadata?.country || null},
        ${detection.isBot},
        ${detection.confidence},
        ${detection.totalScore},
        ${pageServed},
        ${JSON.stringify(detection.scores)}
      )
    `;
    } catch (error) {
        console.error('Failed to log visit:', error);
        // Non-blocking - don't throw
    }
}

/**
 * Get campaign statistics (from Postgres)
 * Now includes click tracking and CTR
 */
export async function getCampaignStats(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
): Promise<any> {
    try {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const end = endDate || new Date();

        // Get visit counts and bot breakdown
        const visitStats = await sql`
            SELECT
                COUNT(*) as total_visits,
                COUNT(*) FILTER (WHERE is_bot = true) as bot_visits,
                COUNT(*) FILTER (WHERE is_bot = false) as real_visits,
                COUNT(*) FILTER (WHERE page_served = 'safe') as safe_page_views,
                COUNT(*) FILTER (WHERE page_served = 'real') as real_page_views,
                AVG(confidence) FILTER (WHERE is_bot = true) as avg_bot_confidence
            FROM visit_logs
            WHERE campaign_id = ${campaignId}
                AND visited_at >= ${start.toISOString()}
                AND visited_at <= ${end.toISOString()}
        `;

        // Get click count
        const clickStats = await sql`
            SELECT COUNT(*) as total_clicks
            FROM click_logs cl
            JOIN visit_logs vl ON cl.visit_id = vl.id::text
            WHERE vl.campaign_id = ${campaignId}
                AND cl.clicked_at >= ${start.toISOString()}
                AND cl.clicked_at <= ${end.toISOString()}
        `;

        const totalVisits = parseInt(visitStats.rows[0]?.total_visits || '0');
        const botVisits = parseInt(visitStats.rows[0]?.bot_visits || '0');
        const realVisits = parseInt(visitStats.rows[0]?.real_visits || '0');
        const safePageViews = parseInt(visitStats.rows[0]?.safe_page_views || '0');
        const realPageViews = parseInt(visitStats.rows[0]?.real_page_views || '0');
        const totalClicks = parseInt(clickStats.rows[0]?.total_clicks || '0');

        // Calculate CTR (clicks / real page views * 100)
        const ctr = realPageViews > 0 ? (totalClicks / realPageViews) * 100 : 0;

        // Calculate cloaking rate
        const cloakingRate = totalVisits > 0 ? (botVisits / totalVisits) * 100 : 0;

        return {
            campaignId,
            totalVisits,
            botVisits,
            realVisits,
            safePageViews,
            realPageViews,
            totalClicks,
            ctr: parseFloat(ctr.toFixed(2)),
            cloakingRate: parseFloat(cloakingRate.toFixed(2)),
            avgBotConfidence: parseFloat(visitStats.rows[0]?.avg_bot_confidence || '0'),
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
        };
    } catch (error) {
        console.error('Error getting campaign stats:', error);
        return {
            campaignId,
            totalVisits: 0,
            botVisits: 0,
            realVisits: 0,
            safePageViews: 0,
            realPageViews: 0,
            totalClicks: 0,
            ctr: 0,
            cloakingRate: 0,
            avgBotConfidence: 0,
        };
    }
}

/**
 * Get global stats (all campaigns)
 */
export async function getGlobalStats(): Promise<any> {
    try {
        const stats = await sql`
            SELECT
                COUNT(*) as total_visits,
                COUNT(*) FILTER (WHERE is_bot = true) as bot_visits,
                COUNT(*) FILTER (WHERE is_bot = false) as real_visits,
                AVG(confidence) FILTER (WHERE is_bot = true) as avg_bot_confidence
            FROM visit_logs
            WHERE visited_at > NOW() - INTERVAL '30 days'
        `;

        const totalVisits = parseInt(stats.rows[0]?.total_visits || '0');
        const botVisits = parseInt(stats.rows[0]?.bot_visits || '0');
        const realVisits = parseInt(stats.rows[0]?.real_visits || '0');

        return {
            totalVisits,
            totalBotVisits: botVisits,
            totalRealVisits: realVisits,
            avgCloakingRate: totalVisits > 0 ? (botVisits / totalVisits) * 100 : 0,
            avgBotConfidence: parseFloat(stats.rows[0]?.avg_bot_confidence || '0'),
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting global stats:', error);
        return {
            totalVisits: 0,
            totalBotVisits: 0,
            totalRealVisits: 0,
            avgCloakingRate: 0,
            avgBotConfidence: 0,
            lastUpdated: new Date().toISOString(),
        };
    }
}

export async function logClickToPostgres(
    visitId: string,
    url?: string,
    referrer?: string
): Promise<void> {
    try {
        await sql`
            INSERT INTO click_logs (visit_id, url, referrer, clicked_at)
            VALUES (${visitId}, ${url || null}, ${referrer || null}, NOW())
        `;
    } catch (error) {
        console.error('Error logging click to Postgres:', error);
        // Don't throw - click tracking should never break the page
    }
}

/**
 * Visit log interface for API responses
 */
export interface VisitLogEntry {
    id: string;
    campaignId: string;
    timestamp: string;
    ipHash: string;
    userAgent: string;
    referer: string | null;
    country: string | null;
    isBot: boolean;
    confidence: number;
    probability: number;
    pageServed: 'safe' | 'real';
    detectionDetails: any;
}

/**
 * Get recent logs from Postgres (for Logs page)
 * Fetches the most recent visit logs across all campaigns
 */
export async function getRecentLogsFromPostgres(limit: number = 100): Promise<VisitLogEntry[]> {
    try {
        const result = await sql`
            SELECT 
                id,
                campaign_id,
                visited_at,
                ip_hash,
                user_agent,
                referer,
                country,
                is_bot,
                confidence,
                probability,
                page_served,
                detection_details
            FROM visit_logs
            ORDER BY visited_at DESC
            LIMIT ${limit}
        `;

        return result.rows.map(row => ({
            id: row.id?.toString() || '',
            campaignId: row.campaign_id,
            timestamp: row.visited_at?.toISOString() || new Date().toISOString(),
            ipHash: row.ip_hash,
            userAgent: row.user_agent || '',
            referer: row.referer,
            country: row.country,
            isBot: row.is_bot,
            confidence: parseFloat(row.confidence) || 0,
            probability: parseFloat(row.probability) || 0,
            pageServed: row.page_served,
            detectionDetails: row.detection_details || {}
        }));
    } catch (error) {
        console.error('Error fetching logs from Postgres:', error);
        return [];
    }
}

/**
 * Get logs for a specific campaign
 */
export async function getCampaignLogsFromPostgres(
    campaignId: string,
    limit: number = 100
): Promise<VisitLogEntry[]> {
    try {
        const result = await sql`
            SELECT 
                id,
                campaign_id,
                visited_at,
                ip_hash,
                user_agent,
                referer,
                country,
                is_bot,
                confidence,
                probability,
                page_served,
                detection_details
            FROM visit_logs
            WHERE campaign_id = ${campaignId}
            ORDER BY visited_at DESC
            LIMIT ${limit}
        `;

        return result.rows.map(row => ({
            id: row.id?.toString() || '',
            campaignId: row.campaign_id,
            timestamp: row.visited_at?.toISOString() || new Date().toISOString(),
            ipHash: row.ip_hash,
            userAgent: row.user_agent || '',
            referer: row.referer,
            country: row.country,
            isBot: row.is_bot,
            confidence: parseFloat(row.confidence) || 0,
            probability: parseFloat(row.probability) || 0,
            pageServed: row.page_served,
            detectionDetails: row.detection_details || {}
        }));
    } catch (error) {
        console.error('Error fetching campaign logs from Postgres:', error);
        return [];
    }
}
