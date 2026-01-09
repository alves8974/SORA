'use client';

import { useState, useEffect } from 'react';
import { getCNAMEInstructions } from '@/lib/database-domains';

interface Domain {
    id: string;
    domain: string;
    status: 'pending' | 'active' | 'failed';
    verificationToken: string;
    campaignId?: string;
    createdAt: string;
}

export default function DomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDomain, setNewDomain] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDomains();
    }, []);

    async function fetchDomains() {
        try {
            const res = await fetch('/api/domains');
            const data = await res.json();
            if (data.success) {
                setDomains(data.data);
            }
        } catch (err) {
            console.error('Error fetching domains:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddDomain(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setAdding(true);

        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain }),
            });

            const data = await res.json();

            if (data.success) {
                setDomains([data.data, ...domains]);
                setNewDomain('');
                await handleVerify(data.data.id);
            } else {
                setError(data.error || 'Failed to add domain');
            }
        } catch (err) {
            setError('Failed to add domain');
        } finally {
            setAdding(false);
        }
    }

    async function handleVerify(domainId: string) {
        try {
            const res = await fetch(`/api/domains/${domainId}/verify`, {
                method: 'POST',
            });

            const data = await res.json();

            if (data.success) {
                fetchDomains();
            }
        } catch (err) {
            console.error('Verification error:', err);
        }
    }

    async function handleDelete(domainId: string) {
        if (!confirm('Tem certeza que deseja deletar este domínio?')) return;

        try {
            await fetch(`/api/domains/${domainId}`, { method: 'DELETE' });
            setDomains(domains.filter(d => d.id !== domainId));
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    const instructions = newDomain ? getCNAMEInstructions(newDomain) : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div
                    className="w-16 h-16 rounded-2xl animate-pulse flex items-center justify-center"
                    style={{
                        background: 'var(--sorafy-gradient)',
                        boxShadow: 'var(--sorafy-shadow-lg)'
                    }}
                >
                    <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    Domínios Personalizados
                </h1>
                <p style={{ color: 'var(--sorafy-text-muted)' }}>
                    Adicione domínios personalizados para suas campanhas
                </p>
            </div>

            {/* Add Domain Form */}
            <div
                className="p-6 rounded-2xl"
                style={{
                    background: 'var(--sorafy-bg-card)',
                    border: '1px solid var(--sorafy-border)'
                }}
            >
                <h2
                    className="text-xl font-bold text-white mb-6"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    Adicionar Novo Domínio
                </h2>

                <form onSubmit={handleAddDomain} className="space-y-4">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--sorafy-text-secondary)' }}
                        >
                            Domínio
                        </label>
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="exemplo.com"
                            className="w-full"
                            required
                        />
                    </div>

                    {error && (
                        <div
                            className="p-4 rounded-xl text-sm"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={adding}
                        className="px-6 py-3 rounded-full font-medium transition-all hover:scale-105 disabled:opacity-50"
                        style={{
                            background: 'var(--sorafy-gradient)',
                            boxShadow: 'var(--sorafy-shadow-lg)',
                            color: 'white'
                        }}
                    >
                        {adding ? 'Adicionando...' : 'Adicionar Domínio'}
                    </button>
                </form>

                {/* CNAME Instructions */}
                {instructions && (
                    <div
                        className="mt-6 p-5 rounded-xl"
                        style={{
                            background: 'rgba(47, 128, 237, 0.1)',
                            border: '1px solid rgba(47, 128, 237, 0.3)'
                        }}
                    >
                        <h3
                            className="font-semibold mb-3 flex items-center gap-2"
                            style={{ color: 'var(--sorafy-primary)' }}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Instruções CNAME
                        </h3>
                        <div className="space-y-2 text-sm" style={{ color: 'var(--sorafy-text-secondary)' }}>
                            {instructions.instructions.map((instruction, i) => (
                                <p key={i}>{instruction}</p>
                            ))}
                        </div>
                        <div
                            className="mt-4 p-4 rounded-xl grid grid-cols-2 gap-4"
                            style={{ background: 'var(--sorafy-bg-card)' }}
                        >
                            <div>
                                <span
                                    className="text-xs font-semibold"
                                    style={{ color: 'var(--sorafy-text-muted)' }}
                                >
                                    Tipo:
                                </span>
                                <p className="text-white font-mono">{instructions.type}</p>
                            </div>
                            <div>
                                <span
                                    className="text-xs font-semibold"
                                    style={{ color: 'var(--sorafy-text-muted)' }}
                                >
                                    Valor:
                                </span>
                                <code
                                    className="block text-sm p-2 rounded mt-1"
                                    style={{
                                        background: 'rgba(47, 128, 237, 0.1)',
                                        color: 'var(--sorafy-primary)'
                                    }}
                                >
                                    {instructions.value}
                                </code>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Domains List */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--sorafy-bg-card)',
                    border: '1px solid var(--sorafy-border)'
                }}
            >
                <div
                    className="p-6 border-b"
                    style={{ borderColor: 'var(--sorafy-border)' }}
                >
                    <h2
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Meus Domínios ({domains.length})
                    </h2>
                </div>

                <div>
                    {domains.length === 0 ? (
                        <div
                            className="p-12 text-center"
                            style={{ color: 'var(--sorafy-text-muted)' }}
                        >
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(47, 128, 237, 0.1)' }}
                            >
                                <svg
                                    className="w-8 h-8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{ color: 'var(--sorafy-primary)' }}
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                            </div>
                            Nenhum domínio adicionado ainda
                        </div>
                    ) : (
                        domains.map((domain, index) => (
                            <div
                                key={domain.id}
                                className="p-6 flex items-center justify-between transition-all hover:bg-opacity-50"
                                style={{
                                    borderBottom: index < domains.length - 1 ? '1px solid var(--sorafy-border)' : 'none',
                                    background: 'transparent'
                                }}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(47, 128, 237, 0.1)' }}
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                style={{ color: 'var(--sorafy-primary)' }}
                                            >
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="2" y1="12" x2="22" y2="12" />
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{domain.domain}</h3>
                                            <p
                                                className="text-xs"
                                                style={{ color: 'var(--sorafy-text-muted)' }}
                                            >
                                                Adicionado em {new Date(domain.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <StatusBadge status={domain.status} />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {domain.status !== 'active' && (
                                        <button
                                            onClick={() => handleVerify(domain.id)}
                                            className="px-4 py-2 text-sm rounded-xl font-medium transition-all hover:scale-105"
                                            style={{
                                                background: 'var(--sorafy-gradient)',
                                                color: 'white',
                                                boxShadow: '0 4px 12px rgba(47, 128, 237, 0.3)'
                                            }}
                                        >
                                            Verificar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(domain.id)}
                                        className="px-4 py-2 text-sm rounded-xl font-medium transition-all"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'pending' | 'active' | 'failed' }) {
    const config = {
        active: {
            bg: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            label: '✓ Ativo',
            dot: '#22c55e'
        },
        pending: {
            bg: 'rgba(234, 179, 8, 0.1)',
            color: '#eab308',
            label: '⏳ Pendente',
            dot: '#eab308'
        },
        failed: {
            bg: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            label: '✗ Falhou',
            dot: '#ef4444'
        },
    };

    const s = config[status];

    return (
        <span
            className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={{ background: s.bg, color: s.color }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: s.dot }}
            />
            {s.label}
        </span>
    );
}
