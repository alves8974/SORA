export default function SafePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navbar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                                FazGame
                            </h1>
                        </div>
                        <div className="hidden md:flex space-x-6">
                            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium">A FazGame</a>
                            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium">Soluções</a>
                            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium">Jogos</a>
                            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium">Guias</a>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                                Login
                            </button>
                            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors">
                                Comece a usar
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-5xl font-extrabold mb-6">
                        Tutoriais FazGame
                    </h2>
                    <p className="text-xl max-w-3xl mx-auto text-orange-50">
                        Quer aprender a criar um jogo? Veja os vídeos de passo a passo e os arquivos correspondentes
                        para saber como se usa o editor de jogos da FazGame!
                    </p>
                </div>
            </section>

            {/* Tutorial Path */}
            <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        {/* Linha conectora */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-orange-300 via-orange-400 to-orange-500 -z-10"></div>

                        <div className="space-y-12">
                            <TutorialStep
                                number={0}
                                title="Como começar um novo game"
                                description="Aprenda os primeiros passos para criar seu próprio jogo do zero"
                                side="left"
                            />

                            <TutorialStep
                                number={1}
                                title="Como se monta uma cena"
                                description="Entenda como organizar e estruturar as cenas do seu jogo"
                                side="right"
                            />

                            <TutorialStep
                                number={2}
                                title="Como usar um cenário"
                                description="Adicione e customize cenários incríveis para seu jogo"
                                side="left"
                            />

                            <TutorialStep
                                number={3}
                                title="Como usar as personagens"
                                description="Insira e anime personagens nas suas cenas"
                                side="right"
                            />

                            <TutorialStep
                                number={4}
                                title="Como criar uma mensagem"
                                description="Adicione diálogos e mensagens interativas"
                                side="left"
                            />

                            <TutorialStep
                                number={5}
                                title="Como criar um diálogo"
                                description="Crie conversas dinâmicas entre personagens"
                                side="right"
                            />

                            <TutorialStep
                                number={6}
                                title="Como criar uma pergunta"
                                description="Implemente mecânicas de escolha e decisão"
                                side="left"
                            />

                            <TutorialStep
                                number={7}
                                title="Como usar um objeto"
                                description="Adicione objetos interativos ao seu jogo"
                                side="right"
                            />

                            <TutorialStep
                                number={8}
                                title="Como usar uma pontuação"
                                description="Implemente sistemas de pontos e recompensas"
                                side="left"
                            />

                            <TutorialStep
                                number={9}
                                title="Como criar uma troca de cena"
                                description="Navegue entre diferentes cenas do seu jogo"
                                side="right"
                            />

                            <TutorialStep
                                number={10}
                                title="Como criar um fluxograma"
                                description="Organize a lógica do seu jogo visualmente"
                                side="left"
                            />

                            <TutorialStep
                                number={11}
                                title="Como usar as interações clicáveis"
                                description="Torne seu jogo interativo com cliques e toques"
                                side="right"
                            />

                            <TutorialStep
                                number={12}
                                title="Como finalizar e publicar um jogo"
                                description="Finalize e compartilhe seu jogo com o mundo"
                                side="left"
                                isLast={true}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-orange-500 to-orange-600 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-3xl font-bold text-white mb-6">
                        Precisa de ajuda para criar um jogo?
                    </h3>
                    <button className="bg-white text-orange-600 font-bold px-8 py-4 rounded-lg text-lg hover:bg-gray-100 transition-colors shadow-lg">
                        Clique aqui e veja o passo a passo!
                    </button>
                </div>
            </section>

            {/* Social Section */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6">Siga-nos</h4>
                    <div className="flex justify-center space-x-6">
                        <SocialIcon icon="📘" name="Facebook" />
                        <SocialIcon icon="📷" name="Instagram" />
                        <SocialIcon icon="🐦" name="Twitter" />
                        <SocialIcon icon="▶️" name="YouTube" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                        <div>
                            <h4 className="text-lg font-bold mb-4">Sobre a FazGame</h4>
                            <p className="text-gray-400">
                                Plataforma educacional para criação de jogos de forma simples e divertida.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-4">Recursos</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Tutoriais</a></li>
                                <li><a href="#" className="hover:text-white">Documentação</a></li>
                                <li><a href="#" className="hover:text-white">Comunidade</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-4">Suporte</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">FAQ</a></li>
                                <li><a href="#" className="hover:text-white">Contato</a></li>
                                <li><a href="#" className="hover:text-white">Ajuda</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                        <p>&copy; 2026 FazGame. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Componente de Step do Tutorial
function TutorialStep({ number, title, description, side, isLast = false }: {
    number: number;
    title: string;
    description: string;
    side: 'left' | 'right';
    isLast?: boolean;
}) {
    return (
        <div className={`flex items-center ${side === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-1/2 ${side === 'left' ? 'pr-12 text-right' : 'pl-12'}`}>
                <div className={`bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ${isLast ? 'border-4 border-orange-500' : ''}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {number}. {title}
                    </h3>
                    <p className="text-gray-600">{description}</p>
                    <button className="mt-4 text-orange-600 font-semibold hover:text-orange-700">
                        Ver tutorial →
                    </button>
                </div>
            </div>

            {/* Círculo central */}
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 ${isLast ? 'ring-4 ring-orange-300' : ''}`}>
                {number}
            </div>

            <div className="w-1/2"></div>
        </div>
    );
}

// Componente de Ícone Social
function SocialIcon({ icon, name }: { icon: string; name: string }) {
    return (
        <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {icon}
            </div>
            <span className="mt-2 text-sm text-gray-600 group-hover:text-orange-600">{name}</span>
        </div>
    );
}
