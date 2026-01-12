import { NextResponse, NextFetchEvent } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRealIP } from './lib/detection';
import { getCachedCampaign, getCampaign, getCampaignBySlug, cacheCampaign } from './lib/database';
import { detectLegitimateAdTraffic } from './lib/scoring-v2';
import { logVisitToPostgres } from './lib/database-postgres';
import { extractSlugFromPath } from './lib/slugs';
import { getDomainByName } from './lib/database-domains';
import { getOrCreateVisitorSession, shouldCountVisit, getVisitorCookieConfig } from './lib/visitor-session';
import { createOfferToken } from './lib/token-crypto';

/**
 * INVERTED CLOAKER LOGIC (v2.1) - WITH TOKEN PROTECTION
 * 
 * DEFAULT: Show SAFE PAGE (protect the offer)
 * EXCEPTION: Show OFFER PAGE only for legitimate Meta Ads traffic
 * 
 * NEW: Uses encrypted tokens to prevent URL exposure in:
 * - HTML source code
 * - Browser DevTools
 * - Network inspection
 * 
 * Flow:
 * 1. Detect legitimate traffic
 * 2. If legitimate → create encrypted token → redirect to /prepage?t=[token]
 * 3. Prepage validates token → redirects to offer
 * 4. If not legitimate → show safe page directly
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
        pathname.startsWith('/prepage') || // Allow prepage to load
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

        // Get cookie config for visitor tracking
        const cookieConfig = getVisitorCookieConfig();

        // === TOKEN-PROTECTED REDIRECT FOR OFFERS ===
        if (shouldShowOfferPage) {
            const offerUrl = campaign.realPageUrl || '/';

            // Build offer URL with UTM parameters
            let finalOfferUrl = offerUrl;
            if (searchParams.toString() && offerUrl.startsWith('http')) {
                const targetUrl = new URL(offerUrl);
                const hash = targetUrl.hash;
                targetUrl.hash = '';

                searchParams.forEach((value, key) => {
                    if (!targetUrl.searchParams.has(key)) {
                        targetUrl.searchParams.set(key, value);
                    }
                });

                if (hash) targetUrl.hash = hash;
                finalOfferUrl = targetUrl.toString();
            }

            // Create encrypted token (expires in 60 seconds)
            const token = createOfferToken(finalOfferUrl, campaign.id, 60);

            // Redirect to prepage with token
            const prepageUrl = new URL('/prepage', request.url);
            prepageUrl.searchParams.set('t', token);

            const response = NextResponse.redirect(prepageUrl.toString());
            response.cookies.set(cookieConfig.name, visitorSession.visitorId, {
                maxAge: cookieConfig.maxAge,
                httpOnly: cookieConfig.httpOnly,
                secure: cookieConfig.secure,
                sameSite: cookieConfig.sameSite,
                path: cookieConfig.path
            });
            return response;
        }

        // === SAFE PAGE (default) ===
        let safePageUrl = campaign.safePageUrl || '/safe';

        // For external safe pages, redirect
        if (safePageUrl.startsWith('http')) {
            const response = NextResponse.redirect(safePageUrl);
            response.cookies.set(cookieConfig.name, visitorSession.visitorId, {
                maxAge: cookieConfig.maxAge,
                httpOnly: cookieConfig.httpOnly,
                secure: cookieConfig.secure,
                sameSite: cookieConfig.sameSite,
                path: cookieConfig.path
            });
            return response;
        }

        // For internal safe pages, rewrite
        const response = NextResponse.rewrite(new URL(safePageUrl, request.url));
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

