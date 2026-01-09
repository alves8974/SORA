import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
    const headersList = headers();
    const allHeaders: Record<string, string> = {};

    headersList.forEach((value, key) => {
        allHeaders[key] = value;
    });

    // Key detection signals
    const userAgent = allHeaders['user-agent'] || 'N/A';
    const referer = allHeaders['referer'] || 'N/A';
    const ip = allHeaders['x-forwarded-for'] || allHeaders['x-real-ip'] || 'N/A';

    // Facebook-specific headers
    const fbHttpEngine = allHeaders['x-fb-http-engine'] || 'N/A';
    const purpose = allHeaders['x-purpose'] || allHeaders['purpose'] || 'N/A';

    // Check for bot indicators
    const ua = userAgent.toLowerCase();
    const isFacebookBot = ua.includes('facebookexternalhit') ||
        ua.includes('facebot') ||
        ua.includes('meta-externalagent');

    const isAdsLibrary = referer.toLowerCase().includes('ads/library') ||
        referer.toLowerCase().includes('ads/archive') ||
        referer.toLowerCase().includes('transparency.fb');

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        detection: {
            isFacebookBot,
            isAdsLibrary,
            shouldBlock: isFacebookBot || isAdsLibrary,
        },
        keySignals: {
            userAgent,
            referer,
            ip: ip.split(',')[0], // First IP only
            fbHttpEngine,
            purpose,
        },
        allHeaders,
        message: isFacebookBot || isAdsLibrary
            ? '🛑 BOT DETECTED - Would show SAFE PAGE'
            : '✅ HUMAN - Would show OFFER PAGE',
    });
}
