/**
 * Vercel API Integration
 * Programmatically add domains to Vercel project
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

interface VercelDomainAddResponse {
    name: string;
    apexName: string;
    projectId: string;
    redirect?: string;
    verified: boolean;
    verification?: {
        type: string;
        domain: string;
        value: string;
        reason: string;
    }[];
}

/**
 * Add domain to Vercel project
 * Official Vercel API: POST /v9/projects/{idOrName}/domains
 */
export async function addDomainToVercel(
    domain: string
): Promise<{ success: boolean; data?: VercelDomainAddResponse; error?: string }> {
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
        return {
            success: false,
            error: 'Vercel credentials not configured. Set VERCEL_TOKEN and VERCEL_PROJECT_ID env vars.',
        };
    }

    try {
        const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
                ...(VERCEL_TEAM_ID && { 'X-Vercel-Team-Id': VERCEL_TEAM_ID }),
            },
            body: JSON.stringify({ name: domain }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error?.message || 'Failed to add domain to Vercel',
            };
        }

        return {
            success: true,
            data: data as VercelDomainAddResponse,
        };
    } catch (error) {
        console.error('Vercel API error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Remove domain from Vercel project
 */
export async function removeDomainFromVercel(
    domain: string
): Promise<{ success: boolean; error?: string }> {
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
        return { success: false, error: 'Vercel credentials not configured' };
    }

    try {
        const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                ...(VERCEL_TEAM_ID && { 'X-Vercel-Team-Id': VERCEL_TEAM_ID }),
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return {
                success: false,
                error: data.error?.message || 'Failed to remove domain',
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check domain verification status
 */
export async function checkDomainVerification(
    domain: string
): Promise<{ verified: boolean; error?: string }> {
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
        return { verified: false, error: 'Vercel credentials not configured' };
    }

    try {
        const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                ...(VERCEL_TEAM_ID && { 'X-Vercel-Team-Id': VERCEL_TEAM_ID }),
            },
        });

        if (!response.ok) {
            return { verified: false, error: 'Domain not found' };
        }

        const data = await response.json();
        return { verified: data.verified || false };
    } catch (error) {
        return {
            verified: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get domain configuration from Vercel
 */
export async function getVercelDomainConfig(
    domain: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
        return { success: false, error: 'Vercel credentials not configured' };
    }

    try {
        const url = `https://api.vercel.com/v6/domains/${domain}/config`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                ...(VERCEL_TEAM_ID && { 'X-Vercel-Team-Id': VERCEL_TEAM_ID }),
            },
        });

        if (!response.ok) {
            return { success: false, error: 'Failed to get domain config' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
