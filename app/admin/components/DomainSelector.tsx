'use client';

import { useState, useEffect } from 'react';

interface Domain {
    id: string;
    domain: string;
    status: 'pending' | 'active' | 'failed';
}

interface DomainSelectorProps {
    value?: string;
    onChange: (domainId: string | undefined) => void;
    label?: string;
    helperText?: string;
}

export default function DomainSelector({
    value,
    onChange,
    label = 'Domínio Personalizado',
    helperText = 'Opcional: Associe um domínio personalizado a esta campanha'
}: DomainSelectorProps) {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDomains();
    }, []);

    async function fetchDomains() {
        try {
            const res = await fetch('/api/domains');
            const data = await res.json();
            if (data.success) {
                // Only show active domains
                setDomains(data.data.filter((d: Domain) => d.status === 'active'));
            }
        } catch (err) {
            console.error('Error fetching domains:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {domains.length === 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                        (Nenhum domínio ativo disponível)
                    </span>
                )}
            </label>

            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={domains.length === 0}
            >
                <option value="">Nenhum (usar domínio padrão)</option>
                {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                        {domain.domain}
                    </option>
                ))}
            </select>

            {helperText && (
                <p className="text-sm text-gray-500">{helperText}</p>
            )}

            {domains.length === 0 && (
                <p className="text-sm text-amber-600">
                    ⚠️ Adicione domínios em{' '}
                    <a href="/admin/domains" className="underline hover:text-amber-700">
                        Configurações de Domínios
                    </a>
                </p>
            )}
        </div>
    );
}
