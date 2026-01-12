'use client';

import { useState, useEffect } from 'react';
import type { VisitLogEntry } from '@/lib/database-postgres';

export default function LogsPage() {
    const [logs, setLogs] = useState<VisitLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'bots' | 'real'>('all');

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs?limit=100');
            const data = await response.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'bots') return log.isBot;
        if (filter === 'real') return !log.isBot;
        return true;
    });

    const botCount = logs.filter(l => l.isBot).length;
    const realCount = logs.filter(l => !l.isBot).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        className="text-3xl font-bold text-white"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Logs de Visitas
                    </h1>
                    <p style={{ color: 'var(--sorafy-text-muted)' }}>
                        Histórico completo de todas as visitas detectadas
                    </p>
                </div>

                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                    style={{
                        background: 'var(--sorafy-gradient)',
                        boxShadow: 'var(--sorafy-shadow-glow)'
                    }}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Atualizar
                    </span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3">
                <FilterButton
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    label="Todos"
                    count={logs.length}
                    color="blue"
                />
                <FilterButton
                    active={filter === 'bots'}
                    onClick={() => setFilter('bots')}
                    label="Bots"
                    count={botCount}
                    color="red"
                />
                <FilterButton
                    active={filter === 'real'}
                    onClick={() => setFilter('real')}
                    label="Reais"
                    count={realCount}
                    color="green"
                />
            </div>

            {/* Logs Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--sorafy-bg-card)',
                    border: '1px solid var(--sorafy-border)'
                }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div
                            className="w-12 h-12 rounded-xl animate-pulse flex items-center justify-center"
                            style={{
                                background: 'var(--sorafy-gradient)',
                                boxShadow: 'var(--sorafy-shadow-lg)'
                            }}
                        >
                            <svg className="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-16">
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'rgba(47, 128, 237, 0.1)',
                                border: '1px solid rgba(47, 128, 237, 0.2)'
                            }}
                        >
                            <svg className="w-8 h-8" style={{ color: 'var(--sorafy-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className="text-white font-medium mb-1">Nenhum log encontrado</p>
                        <p style={{ color: 'var(--sorafy-text-muted)', fontSize: '14px' }}>
                            Aguardando visitas...
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        Data/Hora
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        Página
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        IP Hash
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        Confiança
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        Detalhes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <LogRow key={log.id || index} log={log} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, count, color = 'blue' }: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    color?: string;
}) {
    const colorStyles = {
        blue: {
            bg: 'rgba(47, 128, 237, 0.1)',
            border: 'rgba(47, 128, 237, 0.3)',
            text: '#2F80ED'
        },
        red: {
            bg: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
            text: '#ef4444'
        },
        green: {
            bg: 'rgba(34, 197, 94, 0.1)',
            border: 'rgba(34, 197, 94, 0.3)',
            text: '#22c55e'
        }
    };

    const style = colorStyles[color as keyof typeof colorStyles];

    return (
        <button
            onClick={onClick}
            className="px-4 py-2 rounded-xl font-medium transition-all"
            style={{
                background: active ? style.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? style.border : 'var(--sorafy-border)'}`,
                color: active ? style.text : 'var(--sorafy-text-muted)'
            }}
        >
            {label} ({count})
        </button>
    );
}

function LogRow({ log }: { log: VisitLogEntry }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="cursor-pointer transition-all"
                onClick={() => setExpanded(!expanded)}
                style={{
                    borderBottom: '1px solid var(--sorafy-border)',
                    background: expanded ? 'rgba(47, 128, 237, 0.05)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                    if (!expanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
                onMouseLeave={(e) => {
                    if (!expanded) e.currentTarget.style.background = 'transparent';
                }}
            >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {log.isBot ? (
                        <span
                            className="px-3 py-1 text-xs font-semibold rounded-full"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            🤖 Bot
                        </span>
                    ) : (
                        <span
                            className="px-3 py-1 text-xs font-semibold rounded-full"
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}
                        >
                            ✅ Real
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{
                            background: log.pageServed === 'safe'
                                ? 'rgba(234, 179, 8, 0.1)'
                                : 'rgba(47, 128, 237, 0.1)',
                            color: log.pageServed === 'safe' ? '#eab308' : '#2F80ED',
                            border: `1px solid ${log.pageServed === 'safe' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(47, 128, 237, 0.3)'}`
                        }}
                    >
                        {log.pageServed === 'safe' ? '🛡️ Safe' : '💰 Offer'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{ color: 'var(--sorafy-text-muted)' }}>
                    {log.ipHash}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-16 h-2 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${log.confidence}%`,
                                    background: log.confidence > 70
                                        ? '#ef4444'
                                        : log.confidence > 40
                                            ? '#eab308'
                                            : '#22c55e'
                                }}
                            />
                        </div>
                        <span className="text-sm font-medium text-white">
                            {log.confidence.toFixed(0)}%
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--sorafy-primary)' }}>
                    <span className="flex items-center gap-1">
                        {expanded ? '▼' : '▶'} Ver
                    </span>
                </td>
            </tr>

            {expanded && (
                <tr style={{ background: 'rgba(47, 128, 237, 0.03)' }}>
                    <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-white font-medium mb-2 text-sm">User-Agent:</h4>
                                <p
                                    className="text-sm font-mono p-3 rounded-xl"
                                    style={{
                                        color: 'var(--sorafy-text-muted)',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--sorafy-border)'
                                    }}
                                >
                                    {log.userAgent || 'N/A'}
                                </p>
                            </div>

                            {log.referer && (
                                <div>
                                    <h4 className="text-white font-medium mb-2 text-sm">Referrer:</h4>
                                    <p
                                        className="text-sm font-mono p-3 rounded-xl break-all"
                                        style={{
                                            color: 'var(--sorafy-text-muted)',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--sorafy-border)'
                                        }}
                                    >
                                        {log.referer}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-white font-medium mb-1 text-sm">Campaign ID:</h4>
                                    <p className="text-sm font-mono" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        {log.campaignId}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1 text-sm">Probability Score:</h4>
                                    <p className="text-sm font-mono" style={{ color: 'var(--sorafy-text-muted)' }}>
                                        {(log.probability * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
