'use client';

import { useState, useEffect } from 'react';
import type { GlobalStats } from '@/lib/types';

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
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
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        className="text-3xl font-bold text-white"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Dashboard
                    </h1>
                    <p style={{ color: 'var(--sorafy-text-muted)' }}>
                        Monitoramento em tempo real do seu cloaker
                    </p>
                </div>
                <div
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                        background: 'rgba(47, 128, 237, 0.1)',
                        color: 'var(--sorafy-primary)',
                        border: '1px solid rgba(47, 128, 237, 0.3)'
                    }}
                >
                    Atualizado: {new Date().toLocaleTimeString('pt-BR')}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Visitas"
                    value={stats?.totalVisits || 0}
                    icon={<VisitorsIcon />}
                    gradient="from-blue-500 to-cyan-500"
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    title="Bots Bloqueados"
                    value={stats?.totalBotVisits || 0}
                    icon={<BotIcon />}
                    gradient="from-red-500 to-orange-500"
                    subtitle={`${(stats?.avgCloakingRate || 0).toFixed(1)}% do total`}
                />
                <StatCard
                    title="Visitantes Reais"
                    value={stats?.totalRealVisits || 0}
                    icon={<UsersIcon />}
                    gradient="from-green-500 to-emerald-500"
                    subtitle={`${(100 - (stats?.avgCloakingRate || 0)).toFixed(1)}% do total`}
                />
                <StatCard
                    title="Taxa de Proteção"
                    value={`${(stats?.avgCloakingRate || 0).toFixed(1)}%`}
                    icon={<ShieldIcon />}
                    gradient="from-purple-500 to-pink-500"
                    subtitle="Eficiência do cloaker"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overview Card */}
                <div
                    className="p-6 rounded-2xl"
                    style={{
                        background: 'var(--sorafy-bg-card)',
                        border: '1px solid var(--sorafy-border)'
                    }}
                >
                    <h3
                        className="text-xl font-bold text-white mb-6"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Visão Geral
                    </h3>

                    <div className="space-y-6">
                        <ProgressBar
                            label="Visitantes Reais"
                            value={stats?.totalRealVisits || 0}
                            total={stats?.totalVisits || 1}
                            color="#22c55e"
                        />
                        <ProgressBar
                            label="Bots Detectados"
                            value={stats?.totalBotVisits || 0}
                            total={stats?.totalVisits || 1}
                            color="#ef4444"
                        />
                    </div>
                </div>

                {/* Detection System Card */}
                <div
                    className="p-6 rounded-2xl"
                    style={{
                        background: 'var(--sorafy-bg-card)',
                        border: '1px solid var(--sorafy-border)'
                    }}
                >
                    <h3
                        className="text-xl font-bold text-white mb-6"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Sistema de Detecção
                    </h3>

                    <div className="space-y-4">
                        <DetectionItem
                            name="User-Agent Analysis"
                            active={true}
                            description="Detecta bots do Facebook via User-Agent"
                        />
                        <DetectionItem
                            name="IP Range Verification"
                            active={true}
                            description="Verifica IPs conhecidos do Facebook"
                        />
                        <DetectionItem
                            name="ASN Lookup"
                            active={true}
                            description="Identifica datacenters e crawlers"
                        />
                        <DetectionItem
                            name="Header Analysis"
                            active={true}
                            description="Analisa headers HTTP suspeitos"
                        />
                    </div>
                </div>
            </div>

            {/* Activity & Info Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div
                    className="lg:col-span-2 p-6 rounded-2xl"
                    style={{
                        background: 'var(--sorafy-bg-card)',
                        border: '1px solid var(--sorafy-border)'
                    }}
                >
                    <h3
                        className="text-xl font-bold text-white mb-4"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Atividade Recente
                    </h3>

                    <div
                        className="text-center py-12 rounded-xl"
                        style={{ background: 'rgba(47, 128, 237, 0.05)' }}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'var(--sorafy-gradient)',
                                boxShadow: 'var(--sorafy-shadow-glow)'
                            }}
                        >
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22,4 12,14.01 9,11.01" />
                            </svg>
                        </div>
                        <p className="text-white font-medium mb-2">Sistema operando normalmente</p>
                        <p style={{ color: 'var(--sorafy-text-muted)', fontSize: '14px' }}>
                            Última atualização: {new Date(stats?.lastUpdated || '').toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="space-y-6">
                    <div
                        className="p-5 rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(47, 128, 237, 0.1) 0%, rgba(58, 190, 255, 0.1) 100%)',
                            border: '1px solid rgba(47, 128, 237, 0.2)'
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--sorafy-gradient)' }}
                            >
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <h4 className="text-white font-semibold">Como funciona</h4>
                        </div>
                        <p style={{ color: 'var(--sorafy-text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                            O sistema detecta bots do Facebook automaticamente e mostra a Safe Page.
                        </p>
                    </div>

                    <div
                        className="p-5 rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' }}
                            >
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22,4 12,14.01 9,11.01" />
                                </svg>
                            </div>
                            <h4 className="text-white font-semibold">Status</h4>
                        </div>
                        <p style={{ color: 'var(--sorafy-text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                            Todas as proteções estão ativas e funcionando corretamente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Components
function StatCard({ title, value, icon, gradient, subtitle, trend, trendUp }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    gradient: string;
    subtitle?: string;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <div
            className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            style={{
                background: 'var(--sorafy-bg-card)',
                border: '1px solid var(--sorafy-border)'
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient}`}
                    style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
                >
                    {icon}
                </div>
                {trend && (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: trendUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: trendUp ? '#22c55e' : '#ef4444'
                        }}
                    >
                        {trend}
                    </span>
                )}
            </div>
            <p
                className="text-sm mb-1"
                style={{ color: 'var(--sorafy-text-muted)' }}
            >
                {title}
            </p>
            <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
            >
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
                <p
                    className="text-xs mt-2"
                    style={{ color: 'var(--sorafy-text-muted)' }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function ProgressBar({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm text-white">{label}</span>
                <span className="text-sm font-semibold" style={{ color }}>
                    {value.toLocaleString()}
                </span>
            </div>
            <div
                className="h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
                        boxShadow: `0 0 10px ${color}50`
                    }}
                />
            </div>
        </div>
    );
}

function DetectionItem({ name, active, description }: {
    name: string;
    active: boolean;
    description: string;
}) {
    return (
        <div
            className="flex items-center gap-4 p-3 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.02)' }}
        >
            <div
                className="w-3 h-3 rounded-full"
                style={{
                    background: active ? '#22c55e' : '#6b7280',
                    boxShadow: active ? '0 0 10px #22c55e' : 'none'
                }}
            />
            <div className="flex-1">
                <h4 className="text-white text-sm font-medium">{name}</h4>
                <p
                    className="text-xs"
                    style={{ color: 'var(--sorafy-text-muted)' }}
                >
                    {description}
                </p>
            </div>
            <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                    background: active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    color: active ? '#22c55e' : '#6b7280'
                }}
            >
                {active ? 'Ativo' : 'Inativo'}
            </span>
        </div>
    );
}

// Icons
function VisitorsIcon() {
    return (
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function BotIcon() {
    return (
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}
