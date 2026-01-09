/**
 * Helper function to get campaign URL
 * Handles both custom domains and default Vercel URLs
 */

import type { Campaign, Domain } from './types';

/**
 * Get full campaign URL based on domain and slug
 */
export function getCampaignUrl(
    campaign: Campaign,
    domain?: Domain,
    baseUrl?: string
): string {
    // If campaign has linked domain and domain is active
    if (campaign.domainId && domain && domain.status === 'active') {
        return `https://${domain.domain}/${campaign.slug}`;
    }

    // Default to Vercel URL or provided base URL
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.vercel.app';
    return `${base}/${campaign.slug}`;
}

/**
 * Get Facebook Ads URL template with UTM placeholders
 */
export function getCampaignFacebookUrl(
    campaign: Campaign,
    domain?: Domain,
    baseUrl?: string
): string {
    const baseUrlFinal = getCampaignUrl(campaign, domain, baseUrl);
    return `${baseUrlFinal}?utm_source={{site_source_name}}&utm_campaign={{campaign.name}}&utm_medium={{placement}}`;
}

/**
 * Format campaign display name with domain
 */
export function getCampaignDisplayUrl(
    campaign: Campaign,
    domain?: Domain
): string {
    if (campaign.domainId && domain) {
        return `${domain.domain}/${campaign.slug}`;
    }
    return `/${campaign.slug}`;
}
