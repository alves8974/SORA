/**
 * Domain Management Layer
 * Handles custom domains for campaigns
 */

import { kv } from '@vercel/kv';
import type { Domain } from './types';
import { nanoid } from 'nanoid';

/**
 * Generate verification token for DNS verification
 */
function generateVerificationToken(): string {
    return nanoid(64); // 64 characters random string
}

/**
 * Create a new domain
 */
export async function createDomain(
    domain: string,
    options?: {
        userId?: string;
        campaignId?: string;
    }
): Promise<Domain> {
    const id = `domain_${Date.now()}_${nanoid(9)}`;
    const verificationToken = generateVerificationToken();

    const newDomain: Domain = {
        id,
        userId: options?.userId,
        domain: domain.toLowerCase().trim(),
        campaignId: options?.campaignId,
        status: 'pending',
        verificationToken,
        verificationMethod: 'cname',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Save domain
    await kv.set(`domain:${id}`, newDomain);

    // Index domain name → id for fast lookup
    await kv.set(`domain:name:${newDomain.domain}`, id);

    // Add to list
    await kv.lpush('domains:list', id);

    return newDomain;
}

/**
 * Get domain by ID
 */
export async function getDomain(id: string): Promise<Domain | null> {
    try {
        const domain = await kv.get<Domain>(`domain:${id}`);
        return domain;
    } catch (error) {
        console.error(`Error getting domain ${id}:`, error);
        return null;
    }
}

/**
 * Get domain by name (e.g., "oferta.com")
 */
export async function getDomainByName(domainName: string): Promise<Domain | null> {
    try {
        const normalizedDomain = domainName.toLowerCase().trim();
        const domainId = await kv.get<string>(`domain:name:${normalizedDomain}`);

        if (!domainId) {
            return null;
        }

        return await getDomain(domainId);
    } catch (error) {
        console.error(`Error getting domain by name ${domainName}:`, error);
        return null;
    }
}

/**
 * Get all domains
 */
export async function getAllDomains(): Promise<Domain[]> {
    try {
        const domainIds = await kv.lrange('domains:list', 0, -1);

        if (!domainIds || domainIds.length === 0) {
            return [];
        }

        const domains = await Promise.all(
            domainIds.map(id => kv.get<Domain>(`domain:${id as string}`))
        );

        return domains.filter(d => d !== null) as Domain[];
    } catch (error) {
        console.error('Error getting all domains:', error);
        return [];
    }
}

/**
 * Update domain
 */
export async function updateDomain(
    id: string,
    updates: Partial<Domain>
): Promise<Domain | null> {
    try {
        const domain = await getDomain(id);
        if (!domain) return null;

        const updated: Domain = {
            ...domain,
            ...updates,
            id, // Prevent ID change
            updatedAt: new Date().toISOString(),
        };

        await kv.set(`domain:${id}`, updated);

        return updated;
    } catch (error) {
        console.error(`Error updating domain ${id}:`, error);
        return null;
    }
}

/**
 * Delete domain
 */
export async function deleteDomain(id: string): Promise<boolean> {
    try {
        const domain = await getDomain(id);
        if (!domain) return false;

        // Remove from list
        await kv.lrem('domains:list', 0, id);

        // Delete domain data
        await kv.del(
            `domain:${id}`,
            `domain:name:${domain.domain}`
        );

        return true;
    } catch (error) {
        console.error(`Error deleting domain ${id}:`, error);
        return false;
    }
}

/**
 * Verify domain DNS configuration
 * Uses Vercel API for real verification
 */
export async function verifyDomainDNS(
    domainName: string
): Promise<{ verified: boolean; message: string }> {
    try {
        // Try to use Vercel API for verification
        const { checkDomainVerification } = await import('./vercel-api');
        const result = await checkDomainVerification(domainName);

        if (result.error) {
            // If Vercel API not configured, fall back to DNS check
            return await verifyDomainDNSFallback(domainName);
        }

        return {
            verified: result.verified,
            message: result.verified
                ? 'Domain verified successfully via Vercel!'
                : 'Domain DNS not yet configured. Please add CNAME record.',
        };
    } catch (error) {
        console.error('Domain verification error:', error);
        return await verifyDomainDNSFallback(domainName);
    }
}

/**
 * Fallback DNS verification using public DNS resolver
 */
async function verifyDomainDNSFallback(
    domainName: string
): Promise<{ verified: boolean; message: string }> {
    try {
        // Use Google DNS over HTTPS for CNAME lookup
        const response = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(domainName)}&type=CNAME`,
            { signal: AbortSignal.timeout(5000) }
        );

        if (!response.ok) {
            return { verified: false, message: 'DNS lookup failed. Please try again.' };
        }

        const data = await response.json();

        // Check if CNAME points to Vercel
        if (data.Answer && Array.isArray(data.Answer)) {
            for (const record of data.Answer) {
                const target = (record.data || '').toLowerCase();
                if (target.includes('vercel') || target.includes('vercel-dns.com')) {
                    return { verified: true, message: 'CNAME verified - points to Vercel!' };
                }
            }
            return { verified: false, message: 'CNAME found but not pointing to Vercel. Update to cname.vercel-dns.com' };
        }

        return { verified: false, message: 'No CNAME record found. Add CNAME pointing to cname.vercel-dns.com' };
    } catch (error) {
        return { verified: false, message: 'DNS verification temporarily unavailable. Please try again.' };
    }
}

/**
 * Get CNAME instructions for user
 */
export function getCNAMEInstructions(domain: string): {
    record: string;
    type: string;
    value: string;
    instructions: string[];
} {
    return {
        record: domain,
        type: 'CNAME',
        value: 'cname.vercel-dns.com',
        instructions: [
            `1. Acesse o painel do seu provedor de DNS (GoDaddy, Cloudflare, etc)`,
            `2. Adicione um registro CNAME`,
            `3. Nome/Host: ${domain}`,
            `4. Valor/Target: cname.vercel-dns.com`,
            `5. Aguarde propagação DNS (5-30 minutos)`,
            `6. Clique em "Verificar" aqui no dashboard`,
        ],
    };
}

/**
 * Associate domain with campaign
 */
export async function linkDomainToCampaign(
    domainId: string,
    campaignId: string
): Promise<boolean> {
    const domain = await getDomain(domainId);
    if (!domain) return false;

    await updateDomain(domainId, { campaignId });
    return true;
}
