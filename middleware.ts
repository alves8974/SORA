import { NextResponse, NextFetchEvent } from 'next/server';
import type { NextRequest } from 'next/server';
import { detectFacebookBot, getRealIP } from './lib/detection';
import { getCachedCampaign, getCampaign, getCampaignBySlug, cacheCampaign } from './lib/database';
import { calculateDetectionProbability } from './lib/scoring-v2';
import { logVisitToPostgres } from './lib/database-postgres';
import { extractSlugFromPath } from './lib/slugs';
import { getDomainByName } from './lib/database-domains';

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
    // NEW: Direct slug routing (e.g., /Kcj7xLm)
    // LEGACY: /c/campaign-id pattern

    const slug = extractSlugFromPath(pathname);

    if (slug || pathname.startsWith('/c/')) {
        // Extract identifier (slug or legacy ID)
        const identifier = slug || pathname.split('/')[2];

        if (!identifier) {
            return NextResponse.next();
        }

        // Get campaign (try slug first, then ID for backward compatibility)
        let campaign = slug
            ? await getCampaignBySlug(identifier)
            : await getCachedCampaign(identifier) || await getCampaign(identifier);

        if (campaign && !slug) {
            // Cache for faster lookup
            await cacheCampaign(campaign);
        }

        if (!campaign) {
            return NextResponse.next(); // Will trigger 404
        }

        // Check if campaign is active
        if (campaign.status !== 'active') {
            return NextResponse.next(); // Let page handle it
        }

        // Get request info
        const userAgent = request.headers.get('user-agent') || '';
        const ip = getRealIP(request.headers);
        const referer = request.headers.get('referer') || undefined;

        // Advanced detection using NEW probabilistic scoring system
        const detectionResult = calculateDetectionProbability(
            userAgent,
            ip,
            request.headers,
            campaign.config
        );

        // Determine which page to show
        const shouldShowSafePage = detectionResult.isBot;
        const targetPage = shouldShowSafePage ? 'safe' : 'real';

        // CRITICAL FIX (Gemini): Log ASYNC without blocking user
        // event.waitUntil ensures log completes but doesn't block response
        event.waitUntil(
            logVisitToPostgres(
                campaign.id,
                detectionResult,
                targetPage,
                {
                    referer,
                    anonymizeIP: campaign.config.anonymizeIPs
                }
            )
        );

        // Get the appropriate page content
        let pageUrl = shouldShowSafePage
            ? (campaign.safePageUrl || '/safe')
            : (campaign.realPageUrl || '/');

        // UTM Pass-Through: Preserve tracking parameters
        const searchParams = request.nextUrl.searchParams;
        if (searchParams.toString() && pageUrl.startsWith('http')) {
            // Build URL with preserved UTM parameters
            const targetUrl = new URL(pageUrl);
            const hash = targetUrl.hash;
            targetUrl.hash = '';

            // Copy all params
            searchParams.forEach((value, key) => {
                if (!targetUrl.searchParams.has(key)) {
                    targetUrl.searchParams.set(key, value);
                }
            });

            if (hash) targetUrl.hash = hash;
            pageUrl = targetUrl.toString();
        }

        // If using external URLs, redirect
        if (pageUrl.startsWith('http')) {
            return NextResponse.redirect(pageUrl);
        }

        // Otherwise, rewrite to the target page (SSR, same URL)
        return NextResponse.rewrite(new URL(pageUrl, request.url));
    }

    // Legacy routes (for backward compatibility)
    if (pathname === '/' || pathname === '/safe') {
        const userAgent = request.headers.get('user-agent') || '';
        const ip = getRealIP(request.headers);
        const referer = request.headers.get('referer') || undefined;

        // Basic detection for legacy routes
        const detection = detectFacebookBot(userAgent, ip, request.headers, referer);

        if (pathname === '/' && detection.isBot) {
            return NextResponse.rewrite(new URL('/safe', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
