'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Trash2,
    Shield,
    Globe,
    Link2,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

export default function EditCampaignPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [campaign, setCampaign] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        safePageUrl: '',
        realPageUrl: '',
        botThreshold: 50,
    });

    useEffect(() => {
        loadCampaign();
    }, [campaignId]);

    const loadCampaign = async () => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`);
            const data = await res.json();

            if (data.success && data.data) {
                setCampaign(data.data);
                setFormData({
                    name: data.data.name || '',
                    description: data.data.description || '',
                    status: data.data.status || 'active',
                    safePageUrl: data.data.safePageUrl || '',
                    realPageUrl: data.data.realPageUrl || '',
                    botThreshold: (data.data.config?.botThreshold || 0.5) * 100,
                });
            } else {
                setError('Campanha não encontrada');
            }
        } catch (err) {
            setError('Erro ao carregar campanha');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    status: formData.status,
                    safePageUrl: formData.safePageUrl,
                    realPageUrl: formData.realPageUrl,
                    config: {
                        ...campaign.config,
                        botThreshold: formData.botThreshold / 100,
                    },
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.error || 'Erro ao salvar');
            }
        } catch (err) {
            setError('Erro ao salvar campanha');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação é irreversível.')) {
            return;
        }

        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/admin/campaigns');
            } else {
                setError('Erro ao excluir campanha');
            }
        } catch (err) {
            setError('Erro ao excluir campanha');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !campaign) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
                    <p className="text-gray-400">{error}</p>
                    <button
                        onClick={() => router.push('/admin/campaigns')}
                        className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                        Voltar para Campanhas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/campaigns')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Editar Campanha</h1>
                        <p className="text-gray-400 text-sm">/{campaign?.slug}</p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-sm font-medium ${formData.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {formData.status === 'active' ? '● Ativo' : '● Pausado'}
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">Campanha salva com sucesso!</span>
                </div>
            )}

            {error && campaign && (
                <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                </div>
            )}

            {/* Basic Info */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Informações Básicas
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nome da Campanha
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">Ativo</option>
                            <option value="paused">Pausado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* URLs */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-purple-400" />
                    URLs de Redirecionamento
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            🛡️ Safe Page (para bots)
                        </label>
                        <input
                            type="url"
                            value={formData.safePageUrl}
                            onChange={(e) => setFormData({ ...formData, safePageUrl: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="https://seublog.com/artigo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            🎯 Offer Page (para humanos)
                        </label>
                        <input
                            type="url"
                            value={formData.realPageUrl}
                            onChange={(e) => setFormData({ ...formData, realPageUrl: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="https://suaoferta.com"
                        />
                    </div>
                </div>
            </div>

            {/* Detection Settings */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Configurações de Detecção
                </h2>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">
                                Sensibilidade de Detecção
                            </label>
                            <span className="text-lg font-bold text-white">{formData.botThreshold}%</span>
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="90"
                            value={formData.botThreshold}
                            onChange={(e) => setFormData({ ...formData, botThreshold: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Mais permissivo (20%)</span>
                            <span>Recomendado (50%)</span>
                            <span>Mais rigoroso (90%)</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            ⚠️ Valores muito altos (acima de 70%) podem permitir que bots passem.
                            Recomendamos 40-60% para Meta Ads.
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
