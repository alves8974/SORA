import { NextResponse, NextFetchEvent } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRealIP } from './lib/detection';
import { getCachedCampaign, getCampaign, getCampaignBySlug, cacheCampaign } from './lib/database';
import { detectLegitimateAdTraffic } from './lib/scoring-v2';
import { logVisitToPostgres } from './lib/database-postgres';
import { extractSlugFromPath } from './lib/slugs';
import { getDomainByName } from './lib/database-domains';
import { getOrCreateVisitorSession, shouldCountVisit, getVisitorCookieConfig } from './lib/visitor-session';

/**
 * INVERTED CLOAKER LOGIC (v2.0)
 * 
 * DEFAULT: Show SAFE PAGE (protect the offer)
 * EXCEPTION: Show OFFER PAGE only for legitimate Meta Ads traffic
 * 
 * Legitimate traffic is detected by:
 * 1. Presence of fbclid parameter (Facebook Click ID)
 * 2. NOT a known bot User-Agent
 * 3. NOT from Ads Library referer
 * 4. Organic Facebook referer (feed, stories, reels, etc.)
 */

export async function middleware(request: NextRequest, event: NextFetchEvent) {
    const { pathname } = request.nextUrl;

    // Get hostname for multi-domain support
    const hostname = request.headers.get('host') || '';

    // Ignore static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.includes('.') // static files
    ) {
        return NextResponse.next();
    }

    // === MULTI-DOMAIN ROUTING ===
    // Check if hostname is a custom domain (not Vercel default)
    const isCustomDomain = hostname &&
        !hostname.includes('vercel.app') &&
        !hostname.includes('localhost');

    let domainCampaignId: string | undefined;

    if (isCustomDomain) {
        // Look up domain in database
        const domain = await getDomainByName(hostname);

        if (domain && domain.status === 'active' && domain.campaignId) {
            domainCampaignId = domain.campaignId;
        }
    }

    // Handle campaign routes: /slug or /c/[id] (legacy)
    const slug = extractSlugFromPath(pathname);

    if (slug || pathname.startsWith('/c/')) {
        // Extract identifier (slug or legacy ID)
        const identifier = slug || pathname.split('/')[2];

        if (!identifier) {
            return NextResponse.next();
        }

        // Get campaign
        let campaign = slug
            ? await getCampaignBySlug(identifier)
            : await getCachedCampaign(identifier) || await getCampaign(identifier);

        if (campaign && !slug) {
            await cacheCampaign(campaign);
        }

        if (!campaign) {
            return NextResponse.next(); // Will trigger 404
        }

        if (campaign.status !== 'active') {
            return NextResponse.next();
        }

        // Get request info
        const userAgent = request.headers.get('user-agent') || '';
        const ip = getRealIP(request.headers);
        const referer = request.headers.get('referer') || undefined;
        const searchParams = request.nextUrl.searchParams;

        // === INVERTED LOGIC ===
        // Detect if this is LEGITIMATE AD TRAFFIC (the only case to show offer)
        const detectionResult = detectLegitimateAdTraffic(
            userAgent,
            ip,
            request.headers,
            searchParams,
            campaign.config
        );

        // INVERTED: isLegitimateAdTraffic = true means show OFFER
        // Default (false) = show SAFE PAGE
        const shouldShowOfferPage = detectionResult.isLegitimateAdTraffic;
        const targetPage = shouldShowOfferPage ? 'real' : 'safe';

        // === VISITOR DEDUPLICATION ===
        // Get or create visitor session to prevent counting duplicates
        const visitorSession = getOrCreateVisitorSession(request, ip, userAgent);
        const isNewVisit = shouldCountVisit(visitorSession, campaign.id);

        // Log visit asynchronously (only if not a duplicate)
        event.waitUntil(
            logVisitToPostgres(
                campaign.id,
                detectionResult,
                targetPage,
                {
                    referer,
                    anonymizeIP: campaign.config.anonymizeIPs,
                    isNewVisit  // Only count if this is a new visit
                }
            )
        );

        // Get the appropriate page content
        let pageUrl = shouldShowOfferPage
            ? (campaign.realPageUrl || '/')
            : (campaign.safePageUrl || '/safe');

        // UTM Pass-Through: Preserve tracking parameters
        if (searchParams.toString() && pageUrl.startsWith('http')) {
            const targetUrl = new URL(pageUrl);
            const hash = targetUrl.hash;
            targetUrl.hash = '';

            searchParams.forEach((value, key) => {
                if (!targetUrl.searchParams.has(key)) {
                    targetUrl.searchParams.set(key, value);
                }
            });

            if (hash) targetUrl.hash = hash;
            pageUrl = targetUrl.toString();
        }

        // Redirect or rewrite (with visitor cookie)
        const cookieConfig = getVisitorCookieConfig();

        if (pageUrl.startsWith('http')) {
            const response = NextResponse.redirect(pageUrl);
            response.cookies.set(cookieConfig.name, visitorSession.visitorId, {
                maxAge: cookieConfig.maxAge,
                httpOnly: cookieConfig.httpOnly,
                secure: cookieConfig.secure,
                sameSite: cookieConfig.sameSite,
                path: cookieConfig.path
            });
            return response;
        }

        const response = NextResponse.rewrite(new URL(pageUrl, request.url));
        response.cookies.set(cookieConfig.name, visitorSession.visitorId, {
            maxAge: cookieConfig.maxAge,
            httpOnly: cookieConfig.httpOnly,
            secure: cookieConfig.secure,
            sameSite: cookieConfig.sameSite,
            path: cookieConfig.path
        });
        return response;
    }

    // Legacy routes: Always show safe page by default
    if (pathname === '/' || pathname === '/safe') {
        return NextResponse.rewrite(new URL('/safe', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
