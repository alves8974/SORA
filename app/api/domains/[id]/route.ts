import { NextResponse } from 'next/server';
import { getDomain, updateDomain, deleteDomain, verifyDomainDNS } from '@/lib/database-domains';

/**
 * GET /api/domains/[id]
 * Get domain by ID
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const domain = await getDomain(params.id);

        if (!domain) {
            return NextResponse.json(
                { success: false, error: 'Domain not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: domain,
        });
    } catch (error) {
        console.error('Error fetching domain:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch domain' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/domains/[id]
 * Update domain
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const updates = await request.json();
        const domain = await updateDomain(params.id, updates);

        if (!domain) {
            return NextResponse.json(
                { success: false, error: 'Domain not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: domain,
        });
    } catch (error) {
        console.error('Error updating domain:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update domain' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/domains/[id]
 * Delete domain
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const success = await deleteDomain(params.id);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Domain not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Domain deleted',
        });
    } catch (error) {
        console.error('Error deleting domain:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete domain' },
            { status: 500 }
        );
    }
}
