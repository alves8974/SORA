'use client';

import { useState, useEffect } from 'react';

interface CampaignStats {
    campaignId: string;
    totalVisits: number;
    botVisits: number;
    realVisits: number;
    safePageViews: number;
    realPageViews: number;
    totalClicks: number;
    ctr: number;
    cloakingRate: number;
}

export default function CampaignAnalytics({ campaignId }: { campaignId: string }) {
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [campaignId]);

    async function fetchStats() {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/stats`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total de Visitas"
                    value={stats.totalVisits}
                    icon="👥"
                    color="blue"
                />
                <MetricCard
                    title="Visitas Reais"
                    value={stats.realVisits}
                    subtitle={`${((stats.realVisits / stats.totalVisits) * 100 || 0).toFixed(1)}% do total`}
                    icon="✅"
                    color="green"
                />
                <MetricCard
                    title="Bots Detectados"
                    value={stats.botVisits}
                    subtitle={`${stats.cloakingRate.toFixed(1)}% do total`}
                    icon="🤖"
                    color="red"
                />
                <MetricCard
                    title="CTR (Taxa de Cliques)"
                    value={`${stats.ctr.toFixed(1)}%`}
                    subtitle={`${stats.totalClicks} clicks`}
                    icon="🎯"
                    color="purple"
                    highlight={true}
                />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Click Funnel */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
                    <div className="space-y-4">
                        <FunnelStep
                            label="Total de Visitas"
                            value={stats.totalVisits}
                            percentage={100}
                            color="blue"
                        />
                        <FunnelStep
                            label="Visitas Reais (Passou cloaking)"
                            value={stats.realVisits}
                            percentage={(stats.realVisits / stats.totalVisits) * 100 || 0}
                            color="green"
                        />
                        <FunnelStep
                            label="Página Real Exibida"
                            value={stats.realPageViews}
                            percentage={(stats.realPageViews / stats.totalVisits) * 100 || 0}
                            color="cyan"
                        />
                        <FunnelStep
                            label="Cliques no CTA"
                            value={stats.totalClicks}
                            percentage={(stats.totalClicks / stats.totalVisits) * 100 || 0}
                            color="purple"
                            highlight={true}
                        />
                    </div>
                </div>

                {/* Bot vs Real Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Breakdown de Tráfego</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Safe Page (Bots)</span>
                                <span className="text-sm font-bold text-red-600">{stats.safePageViews}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(stats.safePageViews / stats.totalVisits) * 100 || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Real Page (Humanos)</span>
                                <span className="text-sm font-bold text-green-600">{stats.realPageViews}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(stats.realPageViews / stats.totalVisits) * 100 || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Taxa de Aprovação</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {((stats.realPageViews / stats.totalVisits) * 100 || 0).toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Tráfego que passou pela detecção de bots
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    icon,
    color,
    highlight = false,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: string;
    color: string;
    highlight?: boolean;
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        purple: 'from-purple-500 to-purple-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };

    return (
        <div
            className={`bg-white rounded-lg shadow p-6 ${highlight ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center text-2xl shadow-md`}
                >
                    {icon}
                </div>
            </div>

            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>

            {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
        </div>
    );
}

function FunnelStep({
    label,
    value,
    percentage,
    color,
    highlight = false,
}: {
    label: string;
    value: number;
    percentage: number;
    color: string;
    highlight?: boolean;
}) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        cyan: 'bg-cyan-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className={highlight ? 'bg-purple-50 p-3 rounded-lg' : ''}>
            <div className="flex justify-between mb-2">
                <span className={`text-sm ${highlight ? 'font-semibold' : 'font-medium'}`}>
                    {label}
                </span>
                <span className={`text-sm font-bold ${highlight ? 'text-purple-600' : ''}`}>
                    {value}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`${colorClasses[color as keyof typeof colorClasses]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% do total</p>
        </div>
    );
}
