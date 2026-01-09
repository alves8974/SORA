import { NextResponse } from 'next/server';
import { getCampaignStats } from '@/lib/database-postgres';

/**
 * GET /api/campaigns/[id]/stats
 * Get campaign statistics
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const stats = await getCampaignStats(params.id);

        if (!stats) {
            return NextResponse.json(
                { success: false, error: 'Campaign stats not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaign stats' },
            { status: 500 }
        );
    }
}
