'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PrePageContent() {
    const searchParams = useSearchParams();
    const targetUrl = searchParams.get('target');
    const [countdown, setCountdown] = useState(3);
    const [autoRedirect, setAutoRedirect] = useState(true);

    useEffect(() => {
        if (!autoRedirect || !targetUrl) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Redirect after countdown
            window.location.href = decodeURIComponent(targetUrl);
        }
    }, [countdown, autoRedirect, targetUrl]);

    const handleManualRedirect = () => {
        if (targetUrl) {
            window.location.href = decodeURIComponent(targetUrl);
        }
    };

    if (!targetUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        ❌ Link Inválido
                    </h1>
                    <p className="text-gray-600">
                        O link que você acessou não é válido.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Loading Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    🎯 Preparando sua oferta...
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6">
                    Você será redirecionado em {countdown} segundo{countdown !== 1 ? 's' : ''}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                    ></div>
                </div>

                {/* Manual Button */}
                <button
                    onClick={handleManualRedirect}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                    ⚡ Continuar Agora
                </button>

                {/* Cancel Auto-Redirect */}
                <button
                    onClick={() => setAutoRedirect(false)}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Cancelar redirecionamento automático
                </button>

                {/* Safe Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400 text-center">
                        🔒 Conexão segura • Você está sendo redirecionado para a oferta
                    </p>
                </div>
            </div>
        </div>
    );
}
