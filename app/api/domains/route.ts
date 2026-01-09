import { NextResponse } from 'next/server';
import { createDomain, getAllDomains } from '@/lib/database-domains';
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * GET /api/domains
 * List all domains
 */
export async function GET() {
    try {
        const domains = await getAllDomains();

        return NextResponse.json({
            success: true,
            data: domains,
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch domains' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/domains
 * Create a new domain
 */
export async function POST(request: Request) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(request, RATE_LIMIT_CONFIGS.domainOps);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { domain, campaignId } = await request.json();

        // Validation
        if (!domain || typeof domain !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Domain is required' },
                { status: 400 }
            );
        }

        // Basic domain validation
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        if (!domainRegex.test(domain)) {
            return NextResponse.json(
                { success: false, error: 'Invalid domain format' },
                { status: 400 }
            );
        }

        // Create domain
        const newDomain = await createDomain(domain, { campaignId });

        return NextResponse.json({
            success: true,
            data: newDomain,
        });
    } catch (error) {
        console.error('Error creating domain:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create domain' },
            { status: 500 }
        );
    }
}
