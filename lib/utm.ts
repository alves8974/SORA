/**
 * UTM Parameter Pass-Through Utilities
 * Preserves tracking parameters from Facebook Ads to final destination
 */

/**
 * Build target URL with preserved UTM parameters
 * Handles hash fragments correctly
 */
export function buildTargetUrl(
    baseUrl: string,
    searchParams: URLSearchParams
): string {
    try {
        const targetUrl = new URL(baseUrl);

        // Preserve existing hash fragment
        const hash = targetUrl.hash;
        targetUrl.hash = '';

        // Copy all search params from original URL
        searchParams.forEach((value, key) => {
            // Don't override existing params in target URL
            if (!targetUrl.searchParams.has(key)) {
                targetUrl.searchParams.set(key, value);
            }
        });

        // Restore hash fragment
        if (hash) {
            targetUrl.hash = hash;
        }

        return targetUrl.toString();
    } catch (error) {
        console.error('Error building target URL:', error);
        return baseUrl; // Fallback to base URL
    }
}

/**
 * Get Facebook Ads URL template with placeholders
 * Used in dashboard to show user what to put in Facebook Ads
 */
export function getFacebookAdsUrlTemplate(
    baseUrl: string,
    slug: string
): string {
    const template = `${baseUrl}/${slug}?utm_source={{site_source_name}}&utm_campaign={{campaign.name}}&utm_medium={{placement}}&utm_content={{ad.name}}`;
    return template;
}

/**
 * Common UTM parameters from Facebook Ads
 */
export const FACEBOOK_UTM_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'fbclid', // Facebook Click ID
] as const;

/**
 * Extract UTM params from request
 */
export function extractUtmParams(searchParams: URLSearchParams): Record<string, string> {
    const utmParams: Record<string, string> = {};

    FACEBOOK_UTM_PARAMS.forEach(param => {
        const value = searchParams.get(param);
        if (value) {
            utmParams[param] = value;
        }
    });

    // Also include any other params that start with utm_
    searchParams.forEach((value, key) => {
        if (key.startsWith('utm_') && !utmParams[key]) {
            utmParams[key] = value;
        }
    });

    return utmParams;
}

/**
 * Log UTM parameters for analytics
 */
export function logUtmParams(
    campaignId: string,
    utmParams: Record<string, string>
): void {
    if (Object.keys(utmParams).length > 0) {
        console.log(`[UTM] Campaign ${campaignId}:`, utmParams);
    }
}
