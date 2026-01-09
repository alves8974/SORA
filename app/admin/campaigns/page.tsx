'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Campaign } from '@/lib/types';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/campaigns');
            const data = await response.json();
            if (data.success) {
                setCampaigns(data.data);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

        try {
            const response = await fetch(`/api/campaigns/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
            });

            const data = await response.json();
            if (data.success) {
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1
                        className="text-3xl font-bold text-white"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Campanhas
                    </h1>
                    <p style={{ color: 'var(--sorafy-text-muted)' }}>
                        Gerencie suas campanhas de cloaking
                    </p>
                </div>

                <button
                    onClick={() => router.push('/admin/campaigns/new')}
                    className="px-6 py-3 flex items-center gap-2 rounded-full font-medium transition-all hover:scale-105"
                    style={{
                        background: 'var(--sorafy-gradient)',
                        boxShadow: 'var(--sorafy-shadow-lg)',
                        color: 'white'
                    }}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Nova Campanha</span>
                </button>
            </div>

            {/* Campaigns Grid */}
            {campaigns.length === 0 ? (
                <div
                    className="text-center py-20 rounded-2xl"
                    style={{
                        background: 'var(--sorafy-bg-card)',
                        border: '1px solid var(--sorafy-border)'
                    }}
                >
                    <div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'var(--sorafy-gradient)',
                            boxShadow: 'var(--sorafy-shadow-lg)'
                        }}
                    >
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </div>
                    <h3
                        className="text-2xl font-bold text-white mb-2"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Nenhuma campanha ainda
                    </h3>
                    <p
                        className="mb-6"
                        style={{ color: 'var(--sorafy-text-muted)' }}
                    >
                        Crie sua primeira campanha para começar a proteger suas ofertas
                    </p>
                    <button
                        onClick={() => router.push('/admin/campaigns/new')}
                        className="px-8 py-3 rounded-full font-medium transition-all hover:scale-105"
                        style={{
                            background: 'var(--sorafy-gradient)',
                            boxShadow: 'var(--sorafy-shadow-lg)',
                            color: 'white'
                        }}
                    >
                        Criar Campanha
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onDelete={() => handleDelete(campaign.id)}
                            onToggleStatus={() => handleToggleStatus(campaign.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CampaignCard({
    campaign,
    onDelete,
    onToggleStatus
}: {
    campaign: Campaign;
    onDelete: () => void;
    onToggleStatus: () => void;
}) {
    const [stats, setStats] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch(`/api/campaigns/${campaign.id}/stats`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data.data);
                }
            })
            .catch(console.error);
    }, [campaign.id]);

    const statusConfig = {
        active: {
            bg: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            label: 'Ativo',
            dot: '#22c55e'
        },
        paused: {
            bg: 'rgba(234, 179, 8, 0.1)',
            color: '#eab308',
            label: 'Pausado',
            dot: '#eab308'
        },
        draft: {
            bg: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            label: 'Rascunho',
            dot: '#6b7280'
        },
    };

    const status = statusConfig[campaign.status] || statusConfig.draft;

    const handleCopy = () => {
        const url = `${window.location.origin}/${campaign.slug || campaign.id.slice(-8)}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
                background: 'var(--sorafy-bg-card)',
                border: '1px solid var(--sorafy-border)'
            }}
        >
            {/* Header */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--sorafy-border)' }}>
                <div className="flex justify-between items-start mb-3">
                    <h3
                        className="text-lg font-bold text-white line-clamp-1"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        {campaign.name}
                    </h3>
                    <span
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                        style={{
                            background: status.bg,
                            color: status.color
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: status.dot }}
                        />
                        {status.label}
                    </span>
                </div>
                {campaign.description && (
                    <p
                        className="text-sm line-clamp-2"
                        style={{ color: 'var(--sorafy-text-muted)' }}
                    >
                        {campaign.description}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--sorafy-border)' }}>
                {stats ? (
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className="text-center p-3 rounded-xl"
                            style={{ background: 'rgba(47, 128, 237, 0.1)' }}
                        >
                            <p
                                className="text-xl font-bold"
                                style={{ color: 'var(--sorafy-primary)' }}
                            >
                                {stats.totalVisits}
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--sorafy-text-muted)' }}
                            >
                                Visitas
                            </p>
                        </div>
                        <div
                            className="text-center p-3 rounded-xl"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <p className="text-xl font-bold" style={{ color: '#ef4444' }}>
                                {stats.botVisits}
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--sorafy-text-muted)' }}
                            >
                                Bots
                            </p>
                        </div>
                        <div
                            className="text-center p-3 rounded-xl"
                            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                        >
                            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                                {stats.realVisits}
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--sorafy-text-muted)' }}
                            >
                                Reais
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-16 flex items-center justify-center">
                        <div
                            className="animate-pulse text-sm"
                            style={{ color: 'var(--sorafy-text-muted)' }}
                        >
                            Carregando...
                        </div>
                    </div>
                )}
            </div>

            {/* URL */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--sorafy-border)' }}>
                <p
                    className="text-xs mb-2"
                    style={{ color: 'var(--sorafy-text-muted)' }}
                >
                    URL da Campanha:
                </p>
                <div
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(47, 128, 237, 0.05)' }}
                >
                    <code
                        className="text-sm flex-1 truncate"
                        style={{ color: 'var(--sorafy-primary)' }}
                    >
                        /{campaign.slug || campaign.id.slice(-8)}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: copied
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(47, 128, 237, 0.1)',
                            color: copied ? '#22c55e' : 'var(--sorafy-primary)'
                        }}
                    >
                        {copied ? '✓ Copiado' : 'Copiar'}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="p-5 flex gap-2">
                <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="flex-1 px-4 py-2.5 rounded-xl text-center text-sm font-medium transition-all hover:scale-105"
                    style={{
                        background: 'var(--sorafy-gradient)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(47, 128, 237, 0.3)'
                    }}
                >
                    Editar
                </Link>

                <button
                    onClick={onToggleStatus}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                        background: campaign.status === 'active'
                            ? 'rgba(234, 179, 8, 0.1)'
                            : 'rgba(34, 197, 94, 0.1)',
                        color: campaign.status === 'active' ? '#eab308' : '#22c55e',
                        border: `1px solid ${campaign.status === 'active' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                    }}
                >
                    {campaign.status === 'active' ? 'Pausar' : 'Ativar'}
                </button>

                <button
                    onClick={onDelete}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>

            {/* Footer */}
            <div
                className="px-5 py-3 text-xs"
                style={{
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--sorafy-text-muted)'
                }}
            >
                Atualizado: {new Date(campaign.updatedAt).toLocaleDateString('pt-BR')}
            </div>
        </div>
    );
}
