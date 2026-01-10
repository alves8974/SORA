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
        let error = vercelResult.error;

        // If adding failed, we still check if it exists and verification status
        // This handles cases where it might already exist or other non-critical errors
        if (!vercelResult.success) {
            console.warn(`Failed to add domain ${domain.domain} to Vercel:`, vercelResult.error);
        }

        // Check verification status
        let isVerified = vercelResult.data?.verified || false;

        // If not verified from the add result (or add failed), check explicitly
        if (!vercelResult.success || !isVerified) {
            const check = await checkDomainVerification(domain.domain);

            if (check.error) {
                // If add failed AND check failed, then it's a real failure
                if (!vercelResult.success) {
                    await updateDomain(params.id, { status: 'failed' });
                    return NextResponse.json(
                        { success: false, error: vercelResult.error || check.error },
                        { status: 500 }
                    );
                }
                // If add succeeded but check failed, we trust the add result (unverified)
            } else {
                isVerified = check.verified;
            }
        }

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
