import { NextResponse } from 'next/server';
import { logClickToPostgres } from '@/lib/database-postgres';

// Rate limiting map (in-memory, simple)
const clickRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_CLICKS_PER_WINDOW = 30;

/**
 * POST /api/track-click
 * Track CTA click events
 */
export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type');

        let visitId: string;
        let timestamp: string;
        let url: string | undefined;
        let referrer: string | undefined;

        // Handle both JSON and sendBeacon (text/plain)
        if (contentType?.includes('application/json')) {
            const body = await request.json();
            visitId = body.visitId;
            timestamp = body.timestamp;
            url = body.url;
            referrer = body.referrer;
        } else {
            // sendBeacon sends as text/plain
            const body = await request.text();
            const data = JSON.parse(body);
            visitId = data.visitId;
            timestamp = data.timestamp;
            url = data.url;
            referrer = data.referrer;
        }

        // Validation
        if (!visitId || typeof visitId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'visitId required' },
                { status: 400 }
            );
        }

        // Rate limiting
        const now = Date.now();
        const key = visitId;
        const lastClick = clickRateLimit.get(key) || 0;

        if (now - lastClick < RATE_LIMIT_WINDOW_MS) {
            const clickCount = Array.from(clickRateLimit.entries())
                .filter(([k, t]) => k.startsWith(visitId) && now - t < RATE_LIMIT_WINDOW_MS)
                .length;

            if (clickCount >= MAX_CLICKS_PER_WINDOW) {
                return NextResponse.json(
                    { success: false, error: 'Rate limit exceeded' },
                    { status: 429 }
                );
            }
        }

        clickRateLimit.set(key, now);

        // Clean old entries (simple cleanup)
        if (clickRateLimit.size > 10000) {
            const cutoff = now - RATE_LIMIT_WINDOW_MS;
            const entries = Array.from(clickRateLimit.entries());
            for (const [k, t] of entries) {
                if (t < cutoff) {
                    clickRateLimit.delete(k);
                }
            }
        }

        // Log click to Postgres
        await logClickToPostgres(visitId, url, referrer);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/track-click
 * Handle image beacon tracking (fallback)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const visitId = searchParams.get('visitId');

        if (!visitId) {
            // Return 1x1 transparent GIF even on error
            return new Response(
                Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'image/gif',
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        // Log click
        await logClickToPostgres(visitId);

        // Return 1x1 transparent GIF
        return new Response(
            Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
            {
                status: 200,
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('Error tracking click (GET):', error);
        // Still return GIF to not break page
        return new Response(
            Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
            {
                status: 200,
                headers: { 'Content-Type': 'image/gif' },
            }
        );
    }
}
