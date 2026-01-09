'use client';

import { useState } from 'react';
import {
    Settings,
    Key,
    Database,
    Trash2,
    AlertTriangle,
    Globe,
    Clock,
    Shield,
    Check,
    Copy
} from 'lucide-react';

export default function SettingsPage() {
    const [logRetention, setLogRetention] = useState(30);
    const [apiKeyCopied, setApiKeyCopied] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const handleCopyApiKey = () => {
        navigator.clipboard.writeText('sk_live_xxxxxxxxxxxxxxxxxx');
        setApiKeyCopied(true);
        setTimeout(() => setApiKeyCopied(false), 2000);
    };

    const handleClearLogs = async () => {
        if (!confirm('Tem certeza que deseja limpar todos os logs? Esta ação é irreversível.')) {
            return;
        }
        setIsClearing(true);
        // TODO: Implement API call to clear logs
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsClearing(false);
        alert('Logs limpos com sucesso!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Configurações</h1>
                    <p className="text-gray-400">Gerencie as configurações gerais do sistema</p>
                </div>
            </div>

            {/* Account / API Section */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Key className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">API & Integrações</h2>
                </div>

                <div className="space-y-4">
                    {/* API Key */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Chave da API (para integrações futuras)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value="sk_live_••••••••••••••••••••"
                                readOnly
                                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 font-mono text-sm"
                            />
                            <button
                                onClick={handleCopyApiKey}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {apiKeyCopied ? (
                                    <><Check className="w-4 h-4 text-green-400" /> Copiado!</>
                                ) : (
                                    <><Copy className="w-4 h-4 text-gray-300" /> Copiar</>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Use esta chave para integrar o cloaker com outras ferramentas.
                        </p>
                    </div>

                    {/* External APIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                IPQualityScore API Key
                            </label>
                            <input
                                type="password"
                                placeholder="Sua API key do IPQualityScore"
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Opcional - melhora a detecção de bots
                            </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                ProxyCheck API Key
                            </label>
                            <input
                                type="password"
                                placeholder="Sua API key do ProxyCheck"
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Opcional - detecta proxies e VPNs
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Retention Section */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Armazenamento de Dados</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-300">
                                <Clock className="w-4 h-4 inline-block mr-2 text-gray-400" />
                                Tempo de Retenção de Logs
                            </label>
                            <span className="text-lg font-bold text-white">{logRetention} dias</span>
                        </div>
                        <input
                            type="range"
                            min="7"
                            max="90"
                            value={logRetention}
                            onChange={(e) => setLogRetention(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>7 dias</span>
                            <span>30 dias</span>
                            <span>60 dias</span>
                            <span>90 dias</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Logs mais antigos que {logRetention} dias serão automaticamente excluídos.
                        </p>
                    </div>

                    {/* Storage Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-white">173</p>
                            <p className="text-xs text-gray-400">Total de Logs</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-white">1</p>
                            <p className="text-xs text-gray-400">Campanhas</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-white">1</p>
                            <p className="text-xs text-gray-400">Domínios</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-400">~2 MB</p>
                            <p className="text-xs text-gray-400">Espaço Usado</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Segurança</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-white">Domínio Padrão</h3>
                                <p className="text-sm text-gray-400">Usado para gerar URLs de campanhas</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span className="text-green-400 font-mono">bibliadoschas.pro</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-white">Status do Sistema</h3>
                                <p className="text-sm text-gray-400">Conexões com bancos de dados</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-gray-400">Postgres</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-gray-400">Redis</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-red-400">Zona de Perigo</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-red-900/20 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Limpar Todos os Logs</h3>
                            <p className="text-sm text-gray-400">Remove permanentemente todos os registros de visitas</p>
                        </div>
                        <button
                            onClick={handleClearLogs}
                            disabled={isClearing}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isClearing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Limpando...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Limpar Logs
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-red-900/20 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Excluir Todas as Campanhas</h3>
                            <p className="text-sm text-gray-400">Remove todas as campanhas e seus dados</p>
                        </div>
                        <button className="px-4 py-2 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir Tudo
                        </button>
                    </div>
                </div>

                <p className="text-xs text-red-300/60 mt-4">
                    ⚠️ Estas ações são irreversíveis. Certifique-se de ter backups antes de prosseguir.
                </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
}
