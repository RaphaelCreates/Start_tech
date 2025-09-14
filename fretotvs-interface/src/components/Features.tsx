'use client';

import { useState } from 'react';

export default function Features() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: '⚡',
      title: 'Performance',
      description: 'Aplicações otimizadas com carregamento ultra-rápido e experiência fluida.',
      details: ['Otimização de bundle', 'Lazy loading', 'Cache inteligente', 'SSR/SSG'],
    },
    {
      icon: '📱',
      title: 'Responsivo',
      description: 'Design adaptável que funciona perfeitamente em todos os dispositivos.',
      details: ['Mobile-first', 'Breakpoints flexíveis', 'Touch gestures', 'PWA ready'],
    },
    {
      icon: '🎨',
      title: 'Design Moderno',
      description: 'Interfaces elegantes seguindo as últimas tendências de UX/UI.',
      details: ['Design system', 'Micro-interações', 'Animações fluidas', 'Acessibilidade'],
    },
    {
      icon: '🔧',
      title: 'Escalável',
      description: 'Arquitetura robusta preparada para crescer com seu negócio.',
      details: ['Código limpo', 'Modular', 'Fácil manutenção', 'Testes automatizados'],
    },
    {
      icon: '🚀',
      title: 'Tecnologia Atual',
      description: 'Utilizamos as ferramentas mais modernas do mercado.',
      details: ['React 18+', 'Next.js 15', 'TypeScript', 'Tailwind CSS'],
    },
    {
      icon: '🔒',
      title: 'Segurança',
      description: 'Proteção de dados e seguração de aplicações como prioridade.',
      details: ['HTTPS', 'Sanitização', 'Validação', 'Best practices'],
    },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-slate-800/50">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Por que escolher{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              nossas soluções?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Combinamos criatividade, tecnologia e estratégia para criar experiências digitais 
            que realmente fazem a diferença.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="text-4xl mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Details */}
                <div 
                  className={`overflow-hidden transition-all duration-500 ${
                    hoveredFeature === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-slate-600/50 pt-4">
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm text-gray-400">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Hover Animation */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl">
            Vamos Conversar Sobre Seu Projeto
          </button>
        </div>
      </div>
    </section>
  );
}
