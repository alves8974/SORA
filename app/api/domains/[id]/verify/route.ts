import { NextResponse } from 'next/server';
import { getDomain, updateDomain } from '@/lib/database-domains';
import { addDomainToVercel, checkDomainVerification } from '@/lib/vercel-api';

/**
 * POST /api/domains/[id]/verify
 * Verify domain DNS configuration and add to Vercel
 */
export async function POST(
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

        // Add domain to Vercel project
        const vercelResult = await addDomainToVercel(domain.domain);

        if (!vercelResult.success) {
            // Update status to failed
            await updateDomain(params.id, { status: 'failed' });

            return NextResponse.json(
                {
                    success: false,
                    error: vercelResult.error || 'Failed to add domain to Vercel'
                },
                { status: 500 }
            );
        }

        // Check if already verified
        const isVerified = vercelResult.data?.verified || false;

        // Update domain status
        await updateDomain(params.id, {
            status: isVerified ? 'active' : 'pending',
            verifiedAt: isVerified ? new Date().toISOString() : undefined,
            sslStatus: isVerified ? 'active' : 'pending',
        });

        return NextResponse.json({
            success: true,
            data: {
                verified: isVerified,
                domain: vercelResult.data,
                message: isVerified
                    ? 'Domain verified and active!'
                    : 'Domain added. Please configure DNS CNAME record.',
            },
        });
    } catch (error) {
        console.error('Error verifying domain:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify domain' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/domains/[id]/verify
 * Check current verification status
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

        // Check verification status on Vercel
        const { verified, error } = await checkDomainVerification(domain.domain);

        if (error) {
            return NextResponse.json(
                { success: false, error },
                { status: 500 }
            );
        }

        // Update if status changed
        if (verified && domain.status !== 'active') {
            await updateDomain(params.id, {
                status: 'active',
                verifiedAt: new Date().toISOString(),
                sslStatus: 'active',
                sslIssuedAt: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                verified,
                domain: domain.domain,
                status: verified ? 'active' : domain.status,
            },
        });
    } catch (error) {
        console.error('Error checking verification:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check verification' },
            { status: 500 }
        );
    }
}
