import { NextResponse } from 'next/server';
import { validateOfferToken } from '@/lib/token-crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/validate-token
 * 
 * Validates an encrypted token and returns the offer URL if valid.
 * This endpoint is called by the prepage to get the redirect URL.
 * 
 * Security: Token is validated server-side, so the offer URL
 * is never exposed in client-side code until after validation.
 */
export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'No token provided' },
                { status: 400 }
            );
        }

        const result = validateOfferToken(token);

        if (result.valid && result.url) {
            return NextResponse.json({
                valid: true,
                r: result.url  // Short key to avoid obvious naming
            });
        }

        return NextResponse.json({
            valid: false,
            error: result.error || 'Invalid token'
        });
    } catch (error) {
        console.error('Token validation error:', error);
        return NextResponse.json(
            { valid: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
