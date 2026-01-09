'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: DashboardIcon },
        { name: 'Campanhas', href: '/admin/campaigns', icon: CampaignIcon },
        { name: 'Domínios', href: '/admin/domains', icon: DomainIcon },
        { name: 'Logs', href: '/admin/logs', icon: LogsIcon },
        { name: 'Config', href: '/admin/settings', icon: SettingsIcon },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'var(--sorafy-bg-dark)' }}>
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
                    borderRight: '1px solid rgba(68, 68, 68, 0.2)'
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 h-20 border-b" style={{ borderColor: 'rgba(68, 68, 68, 0.2)' }}>
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'var(--sorafy-gradient)',
                                boxShadow: 'var(--sorafy-shadow-glow)'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h1
                                className="text-xl font-bold"
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                    background: 'var(--sorafy-gradient)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Sorafy Cloaker
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--sorafy-text-muted)' }}>
                                Proteção Premium
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                                        }`}
                                    style={{
                                        background: isActive
                                            ? 'var(--sorafy-gradient)'
                                            : 'transparent',
                                        boxShadow: isActive
                                            ? 'var(--sorafy-shadow-lg)'
                                            : 'none',
                                    }}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive ? '' : 'group-hover:scale-110'
                                            }`}
                                        style={{
                                            background: isActive
                                                ? 'rgba(255,255,255,0.2)'
                                                : 'rgba(47, 128, 237, 0.1)',
                                        }}
                                    >
                                        <item.icon
                                            className="w-5 h-5"
                                            style={{
                                                color: isActive ? 'white' : 'var(--sorafy-primary)'
                                            }}
                                        />
                                    </div>
                                    <span
                                        className="font-medium"
                                        style={{
                                            color: isActive ? 'white' : 'var(--sorafy-text-secondary)',
                                            fontFamily: 'var(--font-body)'
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Status Card */}
                    <div className="px-4 pb-4">
                        <div
                            className="p-4 rounded-2xl"
                            style={{
                                background: 'var(--sorafy-gradient-dark)',
                                border: '1px solid rgba(68, 68, 68, 0.3)'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-3 h-3 rounded-full animate-pulse"
                                    style={{
                                        background: '#22c55e',
                                        boxShadow: '0 0 10px #22c55e'
                                    }}
                                />
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: '#22c55e' }}
                                >
                                    Sistema Ativo
                                </span>
                            </div>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--sorafy-text-muted)' }}
                            >
                                Proteção contra bots funcionando normalmente
                            </p>
                        </div>
                    </div>

                    {/* User */}
                    <div
                        className="px-4 py-4 border-t"
                        style={{ borderColor: 'rgba(68, 68, 68, 0.2)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                style={{
                                    background: 'var(--sorafy-gradient)',
                                    boxShadow: 'var(--sorafy-shadow-glow)'
                                }}
                            >
                                S
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Sorafy Admin</p>
                                <p className="text-xs" style={{ color: 'var(--sorafy-text-muted)' }}>
                                    Administrador
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
                {/* Top bar */}
                <header
                    className="sticky top-0 z-40 backdrop-blur-xl"
                    style={{
                        background: 'rgba(20, 20, 20, 0.8)',
                        borderBottom: '1px solid rgba(68, 68, 68, 0.2)'
                    }}
                >
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{
                                background: 'var(--sorafy-bg-card)',
                                border: '1px solid var(--sorafy-border)'
                            }}
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--sorafy-text-secondary)' }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Status Badge */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ background: '#22c55e' }}
                                />
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: '#22c55e' }}
                                >
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

// Icon Components
function DashboardIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function CampaignIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

function DomainIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

function LogsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
        </svg>
    );
}

function SettingsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}
