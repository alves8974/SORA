import { notFound } from 'next/navigation';
import { getCampaign } from '@/lib/database';

export default async function CampaignPage({
    params,
}: {
    params: { campaignId: string };
}) {
    const campaign = await getCampaign(params.campaignId);

    if (!campaign) {
        notFound();
    }

    if (campaign.status !== 'active') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Campaign Paused</h1>
                    <p className="text-gray-600">This campaign is currently not active.</p>
                </div>
            </div>
        );
    }

    // The actual rendering will be handled by middleware
    // This component serves as a placeholder for SSR

    return (
        <div id="campaign-content">
            {/* Content will be injected via SSR in middleware */}
        </div>
    );
}

// Enable dynamic rendering
export const dynamic = 'force-dynamic';
