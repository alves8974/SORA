import { NextResponse } from 'next/server';
import { getGlobalStats } from '@/lib/database-postgres';

export async function GET() {
    try {
        const stats = await getGlobalStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
