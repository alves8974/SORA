import { NextResponse } from 'next/server';
import {
    getCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaignStatus,
} from '@/lib/database';

/**
 * GET /api/campaigns/[id]
 * Get campaign by ID
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaign = await getCampaign(params.id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: campaign,
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/campaigns/[id]
 * Update campaign
 */
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const campaign = await updateCampaign(params.id, body);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: campaign,
            message: 'Campaign updated successfully',
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete campaign
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const deleted = await deleteCampaign(params.id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found or could not be deleted' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Campaign deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/campaigns/[id]
 * Partial update campaign (or toggle status if no body)
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const contentType = request.headers.get('content-type');

        // If there's a JSON body, do a partial update
        if (contentType?.includes('application/json')) {
            const body = await request.json();
            const campaign = await updateCampaign(params.id, body);

            if (!campaign) {
                return NextResponse.json(
                    { success: false, error: 'Campaign not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: campaign,
                message: 'Campaign updated successfully',
            });
        }

        // Otherwise, just toggle status (legacy behavior)
        const campaign = await toggleCampaignStatus(params.id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: campaign,
            message: `Campaign ${campaign.status === 'active' ? 'activated' : 'paused'}`,
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}
