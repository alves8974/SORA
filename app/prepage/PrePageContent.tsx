'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Secure Pre-Page with Token Validation
 * 
 * This component:
 * 1. Receives an encrypted token from the URL
 * 2. Validates the token via API (server-side validation)
 * 3. Only redirects to the offer if the token is valid
 * 4. Shows safe page if token is invalid/expired
 * 
 * The offer URL is NEVER exposed in the HTML source code.
 */

export default function PrePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('t');

    const [status, setStatus] = useState<'validating' | 'countdown' | 'error'>('validating');
    const [countdown, setCountdown] = useState(3);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Link inválido ou expirado');
            return;
        }

        // Validate token via API
        validateToken(token);
    }, [token]);

    // Countdown effect
    useEffect(() => {
        if (status !== 'countdown' || !redirectUrl) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Perform the redirect
            window.location.href = redirectUrl;
        }
    }, [countdown, status, redirectUrl]);

    async function validateToken(t: string) {
        try {
            const response = await fetch('/api/validate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: t })
            });

            const data = await response.json();

            if (data.valid && data.r) {
                setRedirectUrl(data.r);
                setStatus('countdown');
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Token inválido');
                // Redirect to safe page after 2 seconds
                setTimeout(() => {
                    router.push('/safe');
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Erro de conexão');
            setTimeout(() => {
                router.push('/safe');
            }, 2000);
        }
    }

    const handleManualRedirect = () => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    };

    // Validating state
    if (status === 'validating') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                        </div>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">
                        🔐 Verificando acesso...
                    </h1>
                    <p className="text-gray-600">Por favor, aguarde</p>
                </div>
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Link Inválido
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {errorMessage}
                    </p>
                    <p className="text-sm text-gray-400">
                        Redirecionando...
                    </p>
                </div>
            </div>
        );
    }

    // Countdown state (valid token)
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

                {/* Safe Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400 text-center">
                        🔒 Conexão segura • Verificação concluída
                    </p>
                </div>
            </div>
        </div>
    );
}
