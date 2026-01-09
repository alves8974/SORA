'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultConfig } from '@/lib/scoring';
import type { CampaignConfig } from '@/lib/types';
import {
    Rocket,
    Globe,
    Search,
    Music,
    Layers,
    ExternalLink,
    Copy as CopyIcon,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Shield,
    Eye,
    MousePointer,
    Wifi,
    Sparkles,
    Link2,
    FileText,
    Zap
} from 'lucide-react';

// Traffic Source Options
const TRAFFIC_SOURCES = [
    {
        id: 'meta',
        name: 'Meta Ads',
        description: 'Facebook, Instagram, Messenger',
        Icon: Globe,
        gradient: 'from-blue-500 to-blue-600',
    },
    {
        id: 'google',
        name: 'Google Ads',
        description: 'Search, Display, YouTube',
        Icon: Search,
        gradient: 'from-emerald-500 to-emerald-600',
    },
    {
        id: 'tiktok',
        name: 'TikTok Ads',
        description: 'TikTok, Pangle',
        Icon: Music,
        gradient: 'from-pink-500 to-purple-600',
    },
    {
        id: 'general',
        name: 'Other/General',
        description: 'Other traffic sources',
        Icon: Layers,
        gradient: 'from-gray-500 to-gray-600',
    },
] as const;

// Integration Method Options
const INTEGRATION_METHODS = [
    {
        id: 'redirect',
        name: 'TWR Redirect',
        description: 'Redireciona para a página real. Método mais usado e recomendado.',
        Icon: ExternalLink,
        recommended: true,
    },
    {
        id: 'mirror',
        name: 'TWR Mirror',
        description: 'Espelha o conteúdo na sua URL. Bom para SEO.',
        Icon: CopyIcon,
        recommended: false,
    },
    {
        id: 'prepage',
        name: 'Pre-Page',
        description: 'Mostra página intermediária antes do redirect.',
        Icon: FileText,
        recommended: false,
    },
] as const;

// Meta Ads UTM Template
const META_ADS_UTM_TEMPLATE = 'src={geo}&referrer={referrer}&cpc={click_price}&sku={price_range}&c={click_id}';

export default function NewCampaignPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [createdCampaign, setCreatedCampaign] = useState<any>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trafficSource: 'meta' as 'meta' | 'google' | 'tiktok' | 'general',
        method: 'redirect' as 'mirror' | 'redirect' | 'prepage',
        trackClicks: true,
        safePageUrl: '',
        safePageHtml: '',
        realPageUrl: '',
        realPageHtml: '',
        config: getDefaultConfig(),
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'active',
                }),
            });

            const data = await response.json();
            if (data.success) {
                setCreatedCampaign(data.data);
                setStep(5);
            } else {
                alert('Erro ao criar campanha: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Falha ao criar campanha');
        } finally {
            setLoading(false);
        }
    };

    if (step === 5 && createdCampaign) {
        return (
            <SuccessPage
                campaign={createdCampaign}
                onGoToCampaigns={() => router.push('/admin/campaigns')}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Criar Nova Campanha</h1>
                    <p className="text-gray-400">Configure sua campanha de cloaking passo a passo</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    {['Configuração', 'Safe Page', 'Offer Page', 'Detecção'].map((label, i) => {
                        const s = i + 1;
                        return (
                            <div key={s} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s < step
                                                ? 'bg-green-500 text-white'
                                                : s === step
                                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                                    </div>
                                    <span className={`text-xs mt-2 ${s <= step ? 'text-white font-medium' : 'text-gray-500'
                                        }`}>
                                        {label}
                                    </span>
                                </div>
                                {s < 4 && (
                                    <div className={`flex-1 h-0.5 mx-3 ${s < step ? 'bg-green-500' : 'bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                {step === 1 && (
                    <Step1Configuration formData={formData} setFormData={setFormData} />
                )}
                {step === 2 && (
                    <Step2SafePage formData={formData} setFormData={setFormData} />
                )}
                {step === 3 && (
                    <Step3OfferPage formData={formData} setFormData={setFormData} />
                )}
                {step === 4 && (
                    <Step4Detection formData={formData} setFormData={setFormData} />
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                {step > 1 ? (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Anterior
                    </button>
                ) : (
                    <div />
                )}

                {step < 4 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={!isStepValid(step, formData)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        Próximo
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-lg shadow-green-500/20"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Criar Campanha
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================== SUCCESS PAGE ====================
function SuccessPage({ campaign, onGoToCampaigns }: { campaign: any; onGoToCampaigns: () => void }) {
    const [copied, setCopied] = useState<string | null>(null);

    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://sora-eta-kohl.vercel.app';

    const campaignUrl = `${baseUrl}/${campaign.slug}`;
    const utmParams = META_ADS_UTM_TEMPLATE;
    const fullUrl = `${campaignUrl}?${utmParams}&xid=${campaign.slug}`;

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Success Header */}
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Campanha Criada com Sucesso!</h1>
                <p className="text-gray-400 mt-2">
                    Sua campanha "<strong className="text-white">{campaign.name}</strong>" está pronta para uso
                </p>
            </div>

            {/* Campaign URL Section */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">URL da Campanha</h2>
                </div>

                {/* Simple URL */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">
                        URL Base (para testes)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={campaignUrl}
                            className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white font-mono text-sm"
                        />
                        <button
                            onClick={() => copyToClipboard(campaignUrl, 'base')}
                            className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${copied === 'base'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                        >
                            {copied === 'base' ? <CheckCircle className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {copied === 'base' ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* UTM Parameters */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">
                        📊 URL PARAMS (para Meta Ads)
                    </label>
                    <div className="p-4 bg-purple-900/30 border border-purple-700/50 rounded-lg">
                        <code className="text-purple-300 text-sm break-all">
                            {utmParams}&xid={campaign.slug}
                        </code>
                    </div>
                    <button
                        onClick={() => copyToClipboard(`${utmParams}&xid=${campaign.slug}`, 'params')}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${copied === 'params'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                    >
                        {copied === 'params' ? '✓ Copiado!' : 'Copiar Parâmetros'}
                    </button>
                </div>

                {/* Full URL */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">
                        🚀 URL Completa (para usar no anúncio)
                    </label>
                    <div className="p-4 bg-gray-900/50 border border-gray-600 rounded-lg overflow-x-auto">
                        <code className="text-green-400 text-sm break-all">
                            {fullUrl}
                        </code>
                    </div>
                    <button
                        onClick={() => copyToClipboard(fullUrl, 'full')}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${copied === 'full'
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                            }`}
                    >
                        {copied === 'full' ? <CheckCircle className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                        {copied === 'full' ? 'Copiado!' : 'Copiar URL Completa'}
                    </button>
                </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    Detalhes da Campanha
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Slug:</span>
                        <span className="ml-2 font-mono font-bold text-blue-400">/{campaign.slug}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Método:</span>
                        <span className="ml-2 font-medium text-white">
                            {campaign.method === 'redirect' ? 'TWR Redirect' : campaign.method === 'mirror' ? 'TWR Mirror' : 'Pre-Page'}
                        </span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Fonte:</span>
                        <span className="ml-2 font-medium text-white">
                            {TRAFFIC_SOURCES.find(s => s.id === campaign.trafficSource)?.name}
                        </span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Status:</span>
                        <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            Ativo
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onGoToCampaigns}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                    Ver Todas as Campanhas
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <Zap className="w-4 h-4" />
                    Criar Outra Campanha
                </button>
            </div>
        </div>
    );
}

// ==================== STEP 1: Configuration ====================
function Step1Configuration({ formData, setFormData }: any) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Configuração da Campanha</h2>
                <p className="text-gray-400">Defina as informações básicas e configurações de integração</p>
            </div>

            {/* Campaign Name & Description */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Campanha *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Black Friday Meta Ads"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descrição (opcional)
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Para que serve esta campanha?"
                    />
                </div>
            </div>

            {/* Traffic Source Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Fonte de Tráfego *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRAFFIC_SOURCES.map((source) => {
                        const Icon = source.Icon;
                        return (
                            <button
                                key={source.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, trafficSource: source.id })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.trafficSource === source.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${source.gradient} flex items-center justify-center mb-3`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="font-semibold text-white">{source.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{source.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Integration Method Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Método de Integração *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {INTEGRATION_METHODS.map((method) => {
                        const Icon = method.Icon;
                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, method: method.id })}
                                className={`p-4 rounded-xl border-2 text-left transition-all relative ${formData.method === method.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                                    }`}
                            >
                                {method.recommended && (
                                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                                        Recomendado
                                    </span>
                                )}
                                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mb-3">
                                    <Icon className="w-5 h-5 text-gray-300" />
                                </div>
                                <div className="font-semibold text-white">{method.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{method.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Track Clicks Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                    <div className="font-medium text-white flex items-center gap-2">
                        <MousePointer className="w-4 h-4 text-gray-400" />
                        Rastrear Cliques
                    </div>
                    <div className="text-sm text-gray-400">
                        Registra cliques em CTAs para análise de conversão (CTR)
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, trackClicks: !formData.trackClicks })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${formData.trackClicks ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                >
                    <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.trackClicks ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}

// ==================== STEP 2: Safe Page ====================
function Step2SafePage({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Safe Page (Para Bots)</h2>
                <p className="text-gray-400">
                    Esta é a página que os bots e revisores das plataformas de ads verão.
                </p>
            </div>

            {/* Method Info */}
            <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="font-medium text-purple-300">
                            Método: {formData.method === 'redirect' ? 'TWR Redirect' : formData.method === 'mirror' ? 'TWR Mirror' : 'Pre-Page'}
                        </div>
                        <div className="text-sm text-purple-400">
                            {formData.method === 'redirect' && 'Os bots serão redirecionados para a Safe Page.'}
                            {formData.method === 'mirror' && 'O conteúdo da Safe Page será espelhado na sua URL.'}
                            {formData.method === 'prepage' && 'Uma página intermediária será exibida antes do redirect.'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Eye className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <div className="font-medium text-yellow-300">Importante</div>
                        <div className="text-sm text-yellow-400">
                            A Safe Page deve ser compatível com as políticas da plataforma de ads.
                            Use um blog, artigo educacional ou conteúdo neutro.
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL da Safe Page
                </label>
                <input
                    type="url"
                    value={formData.safePageUrl}
                    onChange={(e) => setFormData({ ...formData, safePageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://seublog.com/artigo-educacional"
                />
                <p className="text-sm text-gray-500 mt-2">
                    Se deixar em branco, será usada a página padrão <code className="bg-gray-700 px-1 rounded text-gray-300">/safe</code>
                </p>
            </div>
        </div>
    );
}

// ==================== STEP 3: Offer Page ====================
function Step3OfferPage({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Offer Page (Página Real)</h2>
                <p className="text-gray-400">
                    Esta é sua landing page real que os visitantes humanos verão.
                </p>
            </div>

            {/* Method Info */}
            <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <div className="font-medium text-green-300">
                            Método: {formData.method === 'redirect' ? 'TWR Redirect' : formData.method === 'mirror' ? 'TWR Mirror' : 'Pre-Page'}
                        </div>
                        <div className="text-sm text-green-400">
                            {formData.method === 'redirect' && 'Visitantes reais serão redirecionados para sua oferta.'}
                            {formData.method === 'mirror' && 'O conteúdo da oferta será espelhado na sua URL.'}
                            {formData.method === 'prepage' && 'Pre-page exibida antes do redirect para a oferta.'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Wifi className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="font-medium text-blue-300">UTMs Preservadas</div>
                        <div className="text-sm text-blue-400">
                            Todos os parâmetros UTM serão automaticamente passados para a offer page.
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL da Offer Page
                </label>
                <input
                    type="url"
                    value={formData.realPageUrl}
                    onChange={(e) => setFormData({ ...formData, realPageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://suaoferta.com/landing-page"
                />
                <p className="text-sm text-gray-500 mt-2">
                    Se deixar em branco, será usada a página padrão <code className="bg-gray-700 px-1 rounded text-gray-300">/</code>
                </p>
            </div>
        </div>
    );
}

// ==================== STEP 4: Detection ====================
function Step4Detection({ formData, setFormData }: any) {
    const config = formData.config;

    const updateConfig = (updates: Partial<CampaignConfig>) => {
        setFormData({
            ...formData,
            config: { ...config, ...updates },
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Configurações de Detecção</h2>
                <p className="text-gray-400">
                    Configure a sensibilidade da detecção de bots e revisores.
                </p>
            </div>

            {/* Detection Methods */}
            <div className="space-y-3">
                <h3 className="font-semibold text-white">Métodos de Detecção</h3>

                <label className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-900/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Search className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="font-medium text-white">Fingerprinting</div>
                            <div className="text-xs text-gray-400">Análise de canvas, WebGL, fontes</div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.fingerprintingEnabled}
                        onChange={(e) => updateConfig({ fingerprintingEnabled: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-900/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <MousePointer className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="font-medium text-white">Análise Comportamental</div>
                            <div className="text-xs text-gray-400">Movimento do mouse, scroll, cliques</div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.behavioralEnabled}
                        onChange={(e) => updateConfig({ behavioralEnabled: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-900/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Wifi className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <div className="font-medium text-white">APIs Externas</div>
                            <div className="text-xs text-gray-400">IPQualityScore, ProxyCheck</div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.externalApisEnabled}
                        onChange={(e) => updateConfig({ externalApisEnabled: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                </label>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Resumo
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Nome:</span>
                        <span className="ml-2 text-white">{formData.name || '(não definido)'}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Fonte:</span>
                        <span className="ml-2 text-white">{TRAFFIC_SOURCES.find(s => s.id === formData.trafficSource)?.name}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Método:</span>
                        <span className="ml-2 text-white">{INTEGRATION_METHODS.find(m => m.id === formData.method)?.name}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <span className="text-gray-400">Track Clicks:</span>
                        <span className="ml-2 text-white">{formData.trackClicks ? 'Sim' : 'Não'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== VALIDATION ====================
function isStepValid(step: number, formData: any): boolean {
    switch (step) {
        case 1:
            return formData.name.length > 0;
        default:
            return true;
    }
}
