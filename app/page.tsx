export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center">
                {/* Logo/Title */}
                <div className="mb-8">
                    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
                        SORA Cloaker
                    </h1>
                    <p className="text-xl text-gray-300">
                        Professional SaaS Cloaking Platform
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <FeatureCard
                        icon="🔒"
                        title="Random Slugs"
                        description="Secure URLs with 3.5T combinations"
                    />
                    <FeatureCard
                        icon="📊"
                        title="Click Tracking"
                        description="Advanced CTR analytics"
                    />
                    <FeatureCard
                        icon="🌐"
                        title="Multi-Domain"
                        description="Custom CNAME support"
                    />
                    <FeatureCard
                        icon="⚡"
                        title="3 Integration Methods"
                        description="Mirror, Redirect, Pre-Page"
                    />
                    <FeatureCard
                        icon="🎯"
                        title="Traffic Source Detection"
                        description="Meta, Google, TikTok optimized"
                    />
                    <FeatureCard
                        icon="📈"
                        title="Real-time Analytics"
                        description="Bot detection & cloaking rate"
                    />
                </div>

                {/* CTA Button */}
                <div className="space-y-4">
                    <a
                        href="/admin"
                        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-12 rounded-full text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                    >
                        Access Dashboard →
                    </a>
                    <p className="text-sm text-gray-400">
                        Powered by Vercel Edge Runtime
                    </p>
                </div>

                {/* Status */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <div className="flex items-center justify-center space-x-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">All Systems Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    );
}
