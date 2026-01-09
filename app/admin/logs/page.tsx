'use client';

import { useState, useEffect } from 'react';
import { VisitLog } from '@/lib/database';

export default function LogsPage() {
    const [logs, setLogs] = useState<VisitLog[]>([]);
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
            setLogs(data);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Logs de Visitas</h1>
                    <p className="text-gray-600 mt-1">Histórico completo de todas as visitas detectadas</p>
                </div>

                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                    <span>🔄</span>
                    <span>Atualizar</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
                <FilterButton
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    label="Todos"
                    count={logs.length}
                />
                <FilterButton
                    active={filter === 'bots'}
                    onClick={() => setFilter('bots')}
                    label="Bots"
                    count={logs.filter(l => l.isBot).length}
                    color="red"
                />
                <FilterButton
                    active={filter === 'real'}
                    onClick={() => setFilter('real')}
                    label="Reais"
                    count={logs.filter(l => !l.isBot).length}
                    color="green"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-4xl mb-4">📭</p>
                        <p className="text-lg font-medium">Nenhum log encontrado</p>
                        <p className="text-sm mt-2">Aguardando visitas...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data/Hora
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Página
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        IP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Confiança
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Detalhes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
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
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        red: 'bg-red-100 text-red-800 border-red-300',
        green: 'bg-green-100 text-green-800 border-green-300',
    };

    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${active
                ? `${colorClasses[color as keyof typeof colorClasses]} border-2 shadow-md`
                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
        >
            {label} ({count})
        </button>
    );
}

function LogRow({ log }: { log: VisitLog }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {log.isBot ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🤖 Bot
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Real
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.page === 'safe' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {log.page === 'safe' ? '🛡️ Safe' : '💰 Real'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    {log.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                                className={`h-2 rounded-full ${log.confidence > 70 ? 'bg-red-600' : log.confidence > 40 ? 'bg-yellow-600' : 'bg-green-600'
                                    }`}
                                style={{ width: `${log.confidence}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{log.confidence}%</span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {expanded ? '▼' : '▶'} Ver
                </td>
            </tr>

            {expanded && (
                <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-1">User-Agent:</h4>
                                <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                                    {log.userAgent}
                                </p>
                            </div>

                            {log.detection?.scores && (() => {
                                const allReasons: string[] = [];
                                Object.values(log.detection.scores).forEach((score) => {
                                    if (score?.reasons) {
                                        allReasons.push(...score.reasons);
                                    }
                                });
                                return allReasons.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Razões da Detecção:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {allReasons.map((reason, i) => (
                                                <li key={i} className="text-sm text-gray-600">{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}

                            {log.referer && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-1">Referrer:</h4>
                                    <p className="text-sm text-gray-600 font-mono">{log.referer}</p>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
