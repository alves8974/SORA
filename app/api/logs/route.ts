import { NextResponse } from 'next/server';
import { getRecentLogsFromPostgres } from '@/lib/database-postgres';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const logs = await getRecentLogsFromPostgres(limit);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
