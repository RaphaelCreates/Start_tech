'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function TurnstileSimulator() {
  const [selectedLine, setSelectedLine] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeAnimations, setActiveAnimations] = useState<number[]>([])
  
  const lines = [
    'Linha - Santana',
    'Linha - Barra Funda'
  ]
  
  const images = [
    {
      src: '/img/leitorrfid.png',
      alt: 'Leitor RFID'
    },
    {
      src: '/img/leitorjogodavida.png',
      alt: 'Leitor Jogo da Vida'
    }
  ]
  
  const nextImage = () => {
    setCurrentImageIndex((prev: number) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setCurrentImageIndex((prev: number) => (prev - 1 + images.length) % images.length)
  }
  
  // Função para reverberação verde
  const handleImageClick = () => {
    const animationId = Date.now()
    setActiveAnimations(prev => [...prev, animationId])
    
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(id => id !== animationId))
    }, 1500) // Duração da animação
  }
  
  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false)
    }
    
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-teal-800 p-8 relative flex items-center justify-center overflow-hidden">
      
      {/* Animação de onda sonora verde */}
      {activeAnimations.map((animationId) => (
        <div key={animationId}>
          {/* Ondas sonoras concêntricas que se expandem por toda a tela */}
          <div className="fixed inset-0 pointer-events-none z-30">
            <div className="absolute bottom-8 left-8 w-56 h-72 flex items-center justify-center">
              {/* Múltiplas ondas sonoras com diferentes delays */}
              <div className="absolute inset-0 animate-sound-wave-1">
                <div className="w-full h-full rounded-full bg-gradient-radial from-green-400/35 via-green-300/20 to-transparent blur-sm"></div>
              </div>
              <div className="absolute inset-0 animate-sound-wave-2">
                <div className="w-full h-full rounded-full bg-gradient-radial from-green-400/30 via-green-300/18 to-transparent blur-md"></div>
              </div>
              <div className="absolute inset-0 animate-sound-wave-3">
                <div className="w-full h-full rounded-full bg-gradient-radial from-green-400/25 via-green-300/15 to-transparent blur-lg"></div>
              </div>
              <div className="absolute inset-0 animate-sound-wave-4">
                <div className="w-full h-full rounded-full bg-gradient-radial from-green-400/22 via-green-300/12 to-transparent blur-xl"></div>
              </div>
              <div className="absolute inset-0 animate-sound-wave-5">
                <div className="w-full h-full rounded-full bg-gradient-radial from-green-400/18 via-green-300/10 to-transparent blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="max-w-2xl w-full relative z-40">
        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-white mb-4 animate-fade-in-down">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Fretotvs
          </span>
          {" - "}
          <span className="text-white">
            Simulador de Catraca
          </span>
        </h1>
        
        {/* Informativo de Região */}
        <div className="text-center mb-12 animate-fade-in-down">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-medium shadow-lg">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Região: SP
          </span>
        </div>
        
        {/* Controles principais - centralizados */}
        <div className="space-y-8 animate-fade-in-up flex flex-col items-center">
          {/* Seleção de Linhas */}
          <div className="transform transition-all duration-300 hover:scale-105 w-full max-w-md">
            <label className="block text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Linhas
            </label>
            
            <div className="space-y-6 flex justify-center">
              <select 
                className="w-full p-4 border border-gray-300 rounded-lg bg-white/90 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:scale-105"
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <option value="">Selecione uma linha</option>
                {lines.map((line, index) => (
                  <option key={index} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Botão Enviar */}
          <div className="w-full max-w-md flex justify-center">
            <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border border-blue-500 rounded-lg text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar
              </span>
            </button>
          </div>
          
          {/* Menu Oculto */}
          <div className="relative flex justify-center">
            {/* Ícone do Menu */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
              className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <svg 
                className={`w-6 h-6 text-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            {/* Menu Dropdown */}
            {isMenuOpen && (
              <div 
                className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-transparent rounded-lg shadow-xl p-4 min-w-48 z-10 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 rounded-lg text-white font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Zerar o Tempo
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Imagem do leitor - Canto inferior esquerdo */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="relative">
          {/* Controles de navegação - em cima da imagem */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
            <button
              onClick={prevImage}
              className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-0 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextImage}
              className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-0 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Container da imagem - Botão clicável */}
          <button 
            onClick={handleImageClick}
            className="w-56 h-72 bg-transparent rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer outline-none focus:outline-none focus:bg-transparent active:bg-transparent relative z-10"
            style={{ backgroundColor: 'transparent', outline: 'none', border: 'none' }}
          >
            <div className="w-full h-full flex items-center justify-center p-2">
              <Image
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                width={240}
                height={320}
                className="object-contain max-w-full max-h-full transition-all duration-500"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
