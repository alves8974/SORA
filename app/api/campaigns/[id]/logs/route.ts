import { NextResponse } from 'next/server';
import { getCampaignLogs } from '@/lib/database';

/**
 * GET /api/campaigns/[id]/logs
 * Get campaign logs
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const logs = await getCampaignLogs(params.id, limit);

        return NextResponse.json({
            success: true,
            data: logs,
        });
    } catch (error) {
        console.error('Error fetching campaign logs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaign logs' },
            { status: 500 }
        );
    }
}
