'use client';

import { useState } from 'react';

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  const filters = ['all', 'web', 'mobile', 'ecommerce', 'dashboard'];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Moderno',
      category: 'ecommerce',
      description: 'Plataforma completa de vendas online com painel administrativo.',
      technologies: ['React', 'Next.js', 'Stripe', 'MongoDB'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: true,
    },
    {
      id: 2,
      title: 'Dashboard Analytics',
      category: 'dashboard',
      description: 'Interface de análise de dados com gráficos interativos.',
      technologies: ['React', 'TypeScript', 'Chart.js', 'Firebase'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: false,
    },
    {
      id: 3,
      title: 'App Mobile Fitness',
      category: 'mobile',
      description: 'Aplicativo de treinos com acompanhamento personalizado.',
      technologies: ['React Native', 'Redux', 'SQLite', 'Push'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: true,
    },
    {
      id: 4,
      title: 'Portal Corporativo',
      category: 'web',
      description: 'Website institucional com área de membros.',
      technologies: ['Next.js', 'Tailwind', 'Prisma', 'PostgreSQL'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: false,
    },
    {
      id: 5,
      title: 'SaaS Platform',
      category: 'web',
      description: 'Plataforma como serviço para gestão de projetos.',
      technologies: ['React', 'Node.js', 'WebSocket', 'Redis'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: true,
    },
    {
      id: 6,
      title: 'Marketplace B2B',
      category: 'ecommerce',
      description: 'Marketplace para conectar fornecedores e compradores.',
      technologies: ['Vue.js', 'Nuxt', 'Elasticsearch', 'Docker'],
      image: '/api/placeholder/600/400',
      link: '#',
      featured: false,
    },
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  return (
    <section id="projects" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Nossos{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Projetos
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Uma seleção dos nossos trabalhos mais recentes, mostrando nossa capacidade 
            de criar soluções inovadoras e impactantes.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 capitalize ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Todos' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105"
              onMouseEnter={() => setHoveredProject(index)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {/* Featured Badge */}
              {project.featured && (
                <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Destaque
                </div>
              )}

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-6xl opacity-50">🚀</div>
                </div>
                
                {/* Overlay */}
                <div 
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredProject === index ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <button className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors duration-300">
                    Ver Projeto
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                  {project.title}
                </h3>
                
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-slate-800 text-purple-300 text-xs font-medium rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    {project.category}
                  </span>
                  <button className="text-purple-400 hover:text-purple-300 transition-colors duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-300 mb-6">
            Gostou do que viu? Vamos criar algo incrível juntos!
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl">
            Solicitar Orçamento
          </button>
        </div>
      </div>
    </section>
  );
}
