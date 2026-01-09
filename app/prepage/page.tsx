'use client';

import { Suspense } from 'react';
import PrePageContent from './PrePageContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PrePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        }>
            <PrePageContent />
        </Suspense>
    );
}
