'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import mqtt from 'mqtt'
import { mqttConfig } from '../config/mqtt'

export default function TurnstileSimulator() {
  const [selectedLine, setSelectedLine] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeAnimations, setActiveAnimations] = useState<number[]>([])
  const [isActivated, setIsActivated] = useState(false)
  const [routeStatus, setRouteStatus] = useState<'idle' | 'active' | 'disabled'>('idle')
  const [glassClicks, setGlassClicks] = useState(0)
  const [glassResetTimer, setGlassResetTimer] = useState<NodeJS.Timeout | null>(null)
  const [cancelTimer, setCancelTimer] = useState<NodeJS.Timeout | null>(null)
  const [readerClicks, setReaderClicks] = useState(0)
  const [showEndMessage, setShowEndMessage] = useState(false)
  const [endMessageStep, setEndMessageStep] = useState(0)
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null)
  const [mqttConnected, setMqttConnected] = useState(false)
  const [mqttError, setMqttError] = useState<string | null>(null)
  
  // Dados simulados
  const busData = {
    motorista_id: "00001",
    prefixo: "1234", 
    capacidade: 40,
    colaborador_id: "COL567"
  }
  
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
  
  // Função para envio MQTT (real ou simulado)
  const sendMqttMessage = (topic: string, message: object, description: string) => {
    const messageStr = JSON.stringify(message)
    const mqttLog = `📡 MQTT ${mqttConnected ? 'ENVIADO' : 'SIMULADO'} em: ${topic}\n💬 Mensagem: ${JSON.stringify(message, null, 2)}\n📝 ${description}`
    
    console.log(mqttLog)
    
    // Envia mensagem real se conectado
    if (mqttClient && mqttConnected) {
      try {
        mqttClient.publish(topic, messageStr, { qos: 1 }, (error) => {
          if (error) {
            console.error('❌ Erro ao publicar:', error)
          } else {
            console.log(`✅ Mensagem enviada para ${topic}`)
          }
        })
      } catch (error) {
        console.error('❌ Erro no envio MQTT:', error)
      }
    }
  }
  
  // Função para obter linha selecionada no formato correto
  const getSelectedLineCode = () => {
    if (selectedLine === 'Linha - Santana') return 'l_santana'
    if (selectedLine === 'Linha - Barra Funda') return 'l_barrafunda'
    return '' // retorna vazio se nenhuma linha selecionada
  }
  
  // Função para reverberação verde
  const handleImageClick = () => {
    // Se é o segundo clique ou mais, verifica se uma linha foi selecionada E se o botão enviar foi clicado
    if (readerClicks >= 1 && (!selectedLine || routeStatus === 'idle')) {
      if (!selectedLine) {
        alert('⚠️ Por favor, selecione uma linha no menu antes de passar o cartão novamente!')
      } else if (routeStatus === 'idle') {
        alert('⚠️ Por favor, clique em "Enviar" para confirmar a linha antes de passar o cartão novamente!')
      }
      return
    }
    
    console.log(`🔧 DEBUG: readerClicks = ${readerClicks}, selectedLine = ${selectedLine}, routeStatus = ${routeStatus}`)
    
    const animationId = Date.now()
    setActiveAnimations(prev => [...prev, animationId])
    
    // Incrementa contador de cliques no leitor
    const newReaderClicks = readerClicks + 1
    setReaderClicks(newReaderClicks)
    
    if (newReaderClicks === 1) {
      // 🟢 Clique 1 – Motorista passa o crachá
      if (!isActivated) {
        setIsActivated(true)
      }
      
      // Publica dados do motorista
      sendMqttMessage(
        'onibus/auth/motorista',
        {
          motorista_id: busData.motorista_id,
          prefixo: busData.prefixo,
          capacidade: busData.capacidade
        },
        'Motorista autenticado - Liberando escolha de linha no app'
      )
      
    } else if (newReaderClicks === 2) {
      // 🟢 Clique 2 – Colaborador passa o crachá
      const linhaCode = getSelectedLineCode()
      
      // Simula que o motorista já escolheu a linha e confirmou
      sendMqttMessage(
        'onibus/auth/linha',
        {
          motorista_id: busData.motorista_id,
          linha: linhaCode
        },
        'Motorista selecionou linha no app'
      )
      
      // Raspberry confirma a linha
      setTimeout(() => {
        sendMqttMessage(
          `onibus/${linhaCode}/motorista`,
          {
            motorista_id: busData.motorista_id,
            linha: linhaCode,
            prefixo: busData.prefixo,
            capacidade: busData.capacidade
          },
          'Raspberry confirmou linha e iniciou monitoramento'
        )
      }, 1000)
      
      // Colaborador entra no ônibus
      setTimeout(() => {
        sendMqttMessage(
          `onibus/${linhaCode}/entrada`,
          {
            colaborador_id: busData.colaborador_id,
            prefixo: busData.prefixo,
            capacidade: busData.capacidade,
            contagem: 1
          },
          'Colaborador entrou no ônibus'
        )
      }, 2000)
      
    } else if (newReaderClicks === 3) {
      // 🟢 Clique 3 – Finalização da corrida
      const linhaCode = getSelectedLineCode()
      
      sendMqttMessage(
        `onibus/${linhaCode}/fim`,
        {
          prefixo: busData.prefixo,
          status: "finalized",
          fim: new Date().toISOString()
        },
        'Corrida finalizada'
      )
      
      // Inicia sequência de fim de viagem após enviar MQTT
      setTimeout(() => {
        setShowEndMessage(true)
        setEndMessageStep(1)
        
        // Sequência de mensagens
        setTimeout(() => setEndMessageStep(2), 2000)
        setTimeout(() => setEndMessageStep(3), 4000)
        setTimeout(() => {
          // Volta ao estado inicial
          setShowEndMessage(false)
          setEndMessageStep(0)
          setIsActivated(false)
          setReaderClicks(0)
          setRouteStatus('idle')
          setSelectedLine('')
          setGlassClicks(0)
          if (glassResetTimer) clearTimeout(glassResetTimer)
          if (cancelTimer) clearTimeout(cancelTimer)
        }, 6000)
      }, 1000)
    }
    
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(id => id !== animationId))
    }, 1500) // Duração da animação
  }

  const handleSendRoute = () => {
    if (routeStatus === 'idle') {
      // Só permite enviar se uma linha estiver selecionada
      if (!selectedLine) {
        // Pode adicionar algum feedback visual aqui (opcional)
        return
      }
      
      // Ativa a rota
      setRouteStatus('active')
      setGlassClicks(0) // Reset clicks ao ativar
      if (glassResetTimer) clearTimeout(glassResetTimer)
      
      // Inicia timer de 7 segundos para mudar para cinza
      const timer = setTimeout(() => {
        setRouteStatus('disabled')
        setGlassClicks(0)
        setCancelTimer(null)
      }, 7000)
      setCancelTimer(timer)
      
    } else if (routeStatus === 'active') {
      // Cancela a rota manualmente e vai direto para o estado cinza
      if (cancelTimer) {
        clearTimeout(cancelTimer)
        setCancelTimer(null)
      }
      setRouteStatus('disabled')
      setGlassClicks(0) // Reset clicks ao cancelar
      if (glassResetTimer) clearTimeout(glassResetTimer)
    } else if (routeStatus === 'disabled') {
      // Quebrar o vidro - incrementa cliques
      const newClicks = glassClicks + 1
      setGlassClicks(newClicks)
      
      // Clear timer anterior e cria novo
      if (glassResetTimer) clearTimeout(glassResetTimer)
      
      // Se chegou a 5 cliques, quebra o vidro completamente
      if (newClicks >= 5) {
        setRouteStatus('active')
        setGlassClicks(0)
        setGlassResetTimer(null)
        
        // Após 7 segundos, desabilita novamente
        setTimeout(() => {
          setRouteStatus('disabled')
          setGlassClicks(0)
        }, 7000)
      } else {
        // Se não completou 5 cliques, reseta após 3 segundos de inatividade
        const timer = setTimeout(() => {
          setGlassClicks(0)
          setGlassResetTimer(null)
        }, 3000)
        setGlassResetTimer(timer)
      }
    }
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (glassResetTimer) {
        clearTimeout(glassResetTimer)
      }
      if (cancelTimer) {
        clearTimeout(cancelTimer)
      }
    }
  }, [glassResetTimer, cancelTimer])

  // Conexão MQTT
  useEffect(() => {
    try {
      console.log('🔄 Tentando conectar ao HiveMQ Cloud...')
      console.log('Host:', mqttConfig.host)
      console.log('Porta:', mqttConfig.port)
      
      const brokerUrl = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port}/mqtt`
      
      const client = mqtt.connect(brokerUrl, {
        username: mqttConfig.username,
        password: mqttConfig.password,
        clean: mqttConfig.clean,
        reconnectPeriod: mqttConfig.reconnectPeriod,
        connectTimeout: mqttConfig.connectTimeout,
        ...mqttConfig.wsOptions
      })

      client.on('connect', () => {
        console.log('🟢 Conectado ao HiveMQ Cloud!')
        setMqttConnected(true)
        setMqttClient(client)
        setMqttError(null)
      })

      client.on('error', (error) => {
        console.log('🔴 Erro na conexão MQTT:', error)
        setMqttConnected(false)
        setMqttError(error.message || 'Erro de conexão')
      })

      client.on('offline', () => {
        console.log('🟡 MQTT offline')
        setMqttConnected(false)
      })

      client.on('close', () => {
        console.log('🔴 Conexão MQTT fechada')
        setMqttConnected(false)
      })

      return () => {
        if (client) {
          client.end()
        }
      }
    } catch (error) {
      console.log('❌ Erro ao conectar MQTT:', error)
      setMqttError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }, [])
  
  return (
    <div className={`h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-teal-800 p-8 relative flex items-center justify-center overflow-hidden ${showEndMessage ? 'cursor-none' : ''}`}>
      
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
        {/* Título - só aparece quando não está em fim de viagem */}
        {!showEndMessage && (
          <h1 className="text-4xl font-bold text-center text-white mb-4 animate-fade-in-down">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Fretotvs
            </span>
            {" - "}
            <span className="text-white">
              Simulador de Catraca
            </span>
          </h1>
        )}
        
        {/* Tela de Fim de Viagem */}
        {showEndMessage ? (
          <div className="text-center min-h-screen flex items-center justify-center">
            {endMessageStep === 1 && (
              <div className="animate-fade-in-up">
                <h2 className="text-6xl font-bold text-white mb-8">Fim de viagem!</h2>
              </div>
            )}
            {endMessageStep === 2 && (
              <div className="animate-fade-in-up">
                <h2 className="text-5xl font-bold text-white mb-8">Sua participação faz a diferença.</h2>
              </div>
            )}
            {endMessageStep === 3 && (
              <div className="animate-fade-in-up">
                <h2 className="text-6xl font-bold text-white mb-8">Obrigado!</h2>
              </div>
            )}
          </div>
        ) : (
        
        /* Informativo de Região e resto da interface quando não está em fim de viagem */
        <>
        {isActivated && (
          <>
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
                className={`w-full p-4 border border-gray-300 rounded-lg text-gray-700 focus:outline-none shadow-lg transition-all duration-300 ${
                  routeStatus === 'active' || routeStatus === 'disabled' 
                    ? 'bg-gray-300 cursor-not-allowed opacity-60' 
                    : 'bg-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:shadow-xl hover:scale-105 focus:scale-105'
                }`}
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                disabled={routeStatus === 'active' || routeStatus === 'disabled'}
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
                <div className="relative w-full">
                  <button 
                    onClick={handleSendRoute}
                    disabled={routeStatus === 'disabled' && glassClicks >= 5}
                    className={`w-full p-4 rounded-lg font-semibold transition-all duration-300 transform active:scale-95 shadow-lg relative overflow-hidden ${
                      routeStatus === 'idle' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border border-blue-500 text-white hover:shadow-xl hover:scale-105' 
                        : routeStatus === 'active'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-500 text-white hover:shadow-xl hover:scale-105'
                        : 'bg-gray-500 border border-gray-500 text-gray-300 cursor-pointer hover:scale-105'
                    }`}
                  >
                    {/* Efeito de vidro quebrado */}
                    {routeStatus === 'disabled' && (
                      <>
                        {/* Camada de vidro */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-lg transition-all duration-200 ${
                          glassClicks >= 1 ? 'animate-glass-crack-1' : ''
                        }`}></div>
                        
                        {/* Rachaduras progressivas */}
                        {glassClicks >= 1 && (
                          <div className="absolute inset-0 opacity-80">
                            {/* Rachaduras principais + cantos */}
                            <svg className="absolute inset-0 w-full h-full animate-crack-1" viewBox="0 0 100 100">
                              <path d="M15,20 L25,25 L35,30 L45,28 L55,35 L70,40 L85,45" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
                              <path d="M10,60 L20,55 L30,58 L40,52 L50,55" stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
                              <path d="M80,15 L75,25 L78,35 L85,40" stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
                              <path d="M5,85 L15,80 L25,85 L35,80" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              
                              {/* Rachaduras nos cantos - Canto superior esquerdo */}
                              <path d="M2,2 L8,5 L12,8 L15,12" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M5,2 L8,8 L12,5" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              
                              {/* Canto superior direito */}
                              <path d="M98,2 L92,5 L88,8 L85,12" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M95,2 L92,8 L88,5" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              
                              {/* Canto inferior esquerdo */}
                              <path d="M2,98 L8,95 L12,92 L15,88" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M5,98 L8,92 L12,95" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              
                              {/* Canto inferior direito */}
                              <path d="M98,98 L92,95 L88,92 L85,88" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M95,98 L92,92 L88,95" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        {glassClicks >= 2 && (
                          <div className="absolute inset-0 opacity-75">
                            {/* Rachaduras secundárias por toda área + mais cantos */}
                            <svg className="absolute inset-0 w-full h-full animate-crack-2" viewBox="0 0 100 100">
                              <path d="M75,15 L68,25 L65,35 L62,42 L58,50" stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
                              <path d="M20,75 L28,68 L35,65 L42,70 L48,75 L55,78" stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
                              <path d="M90,30 L85,40 L88,50 L82,60" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M5,40 L12,35 L18,42 L25,38 L32,45" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M60,85 L68,80 L75,88 L82,82 L90,85" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M15,5 L22,10 L28,5 L35,12 L42,8" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              
                              {/* Extensões dos cantos */}
                              <path d="M15,12 L22,18 L28,15 L32,20" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M85,12 L78,18 L72,15 L68,20" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M15,88 L22,82 L28,85 L32,80" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M85,88 L78,82 L72,85 L68,80" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              
                              {/* Rachaduras nas bordas dos cantos */}
                              <path d="M2,15 L8,18 L5,22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M98,15 L92,18 L95,22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M2,85 L8,82 L5,78" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M98,85 L92,82 L95,78" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        {glassClicks >= 3 && (
                          <div className="absolute inset-0 opacity-70">
                            {/* Rede densa de rachaduras + cantos preenchidos */}
                            <svg className="absolute inset-0 w-full h-full animate-crack-3" viewBox="0 0 100 100">
                              <path d="M10,50 L18,48 L28,52 L38,48 L45,52 L55,48 L65,52 L75,48 L85,52" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M50,5 L48,15 L52,25 L48,35 L52,45 L48,55 L52,65 L48,75 L52,85 L48,95" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
                              <path d="M35,28 L40,35 L38,42 L42,48 L38,55 L42,62" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M65,25 L62,32 L68,38 L65,45 L68,52 L65,58" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M25,20 L30,15 L35,22 L40,18 L45,25" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M55,75 L60,80 L65,75 L70,82 L75,78" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M15,35 L22,30 L28,38 L35,32 L42,40" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M60,60 L65,55 L70,62 L75,58 L80,65" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              
                              {/* Rede complexa nos cantos */}
                              <path d="M8,8 L15,15 L12,20 L18,18 L22,22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M92,8 L85,15 L88,20 L82,18 L78,22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M8,92 L15,85 L12,80 L18,82 L22,78" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M92,92 L85,85 L88,80 L82,82 L78,78" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              
                              {/* Conexões diagonais dos cantos */}
                              <path d="M22,22 L28,28 L32,32" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M78,22 L72,28 L68,32" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M22,78 L28,72 L32,68" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M78,78 L72,72 L68,68" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        {glassClicks >= 4 && (
                          <div className="absolute inset-0 opacity-65">
                            {/* Rede complexa cobrindo todo o botão + cantos saturados */}
                            <svg className="absolute inset-0 w-full h-full animate-crack-4" viewBox="0 0 100 100">
                              <path d="M85,80 L78,75 L72,78 L65,72 L58,75 L50,70 L42,75 L35,72 L28,78 L20,75 L12,80 L5,75" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M25,15 L30,22 L28,30 L32,38 L28,45 L32,52 L28,60 L32,68" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M75,15 L70,22 L72,30 L68,38 L72,45 L68,52 L72,60 L68,68" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                              <path d="M15,65 L22,62 L28,68 L35,65 L42,70 L48,65 L55,70 L62,65" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              <path d="M85,35 L78,30 L72,38 L65,32 L58,40 L50,35 L42,42 L35,38" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none" strokeLinecap="round"/>
                              
                              {/* Cantos completamente rachados */}
                              <path d="M2,2 L12,12 L8,18 L15,15 L20,20 L25,15 L18,8 L22,5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M98,2 L88,12 L92,18 L85,15 L80,20 L75,15 L82,8 L78,5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M2,98 L12,88 L8,82 L15,85 L20,80 L25,85 L18,92 L22,95" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M98,98 L88,88 L92,82 L85,85 L80,80 L75,85 L82,92 L78,95" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              
                              {/* Rachaduras densas saturando os cantos completamente */}
                              <path d="M0,5 L5,0 L10,5 L5,10 L15,5 L10,15 L20,10 L15,20" stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" fill="none" strokeLinecap="round"/>
                              <path d="M100,5 L95,0 L90,5 L95,10 L85,5 L90,15 L80,10 L85,20" stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" fill="none" strokeLinecap="round"/>
                              <path d="M0,95 L5,100 L10,95 L5,90 L15,95 L10,85 L20,90 L15,80" stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" fill="none" strokeLinecap="round"/>
                              <path d="M100,95 L95,100 L90,95 L95,90 L85,95 L90,85 L80,90 L85,80" stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" fill="none" strokeLinecap="round"/>
                              
                              {/* Rachaduras intensas nas bordas dos cantos */}
                              <path d="M3,3 L7,7 L11,3 L7,11 L14,7 L11,14 L18,11 L14,18" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M97,3 L93,7 L89,3 L93,11 L86,7 L89,14 L82,11 L86,18" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M3,97 L7,93 L11,97 L7,89 L14,93 L11,86 L18,89 L14,82" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M97,97 L93,93 L89,97 L93,89 L86,93 L89,86 L82,89 L86,82" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              
                              {/* Micro-rachaduras saturando completamente os cantos */}
                              <path d="M1,1 L4,4 L6,1 L4,6 L8,4 L6,8 L10,6 L8,10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M99,1 L96,4 L94,1 L96,6 L92,4 L94,8 L90,6 L92,10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M1,99 L4,96 L6,99 L4,94 L8,96 L6,92 L10,94 L8,90" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M99,99 L96,96 L94,99 L96,94 L92,96 L94,92 L90,94 L92,90" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              
                              {/* Fragmentos adicionais espalhados pelos cantos */}
                              <path d="M0,10 L3,7 L6,10 L3,13" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M100,10 L97,7 L94,10 L97,13" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M0,90 L3,93 L6,90 L3,87" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M100,90 L97,93 L94,90 L97,87" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M10,0 L7,3 L10,6 L13,3" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M10,100 L7,97 L10,94 L13,97" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M90,0 L93,3 L90,6 L87,3" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              <path d="M90,100 L93,97 L90,94 L87,97" stroke="rgba(255,255,255,0.25)" strokeWidth="0.1" fill="none" strokeLinecap="round"/>
                              
                              {/* Micro rachaduras intensas nos cantos */}
                              <path d="M5,5 L10,8 L8,12 L12,10 L15,15" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M95,5 L90,8 L92,12 L88,10 L85,15" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M5,95 L10,92 L8,88 L12,90 L15,85" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              <path d="M95,95 L90,92 L92,88 L88,90 L85,85" stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" fill="none" strokeLinecap="round"/>
                              
                              {/* Micro rachaduras por todo canto */}
                              <path d="M45,20 L48,22 L50,25 L52,22 L55,25" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M45,75 L48,78 L50,75 L52,78 L55,75" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M20,50 L22,48 L25,52 L28,48 L30,52" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M70,50 L72,48 L75,52 L78,48 L80,52" stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              
                              {/* Conexões entre rachaduras */}
                              <path d="M25,30 L30,35" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M70,30 L75,35" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M25,70 L30,65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                              <path d="M70,70 L75,65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" fill="none" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        
                        {/* Efeito de destruição final */}
                        {glassClicks >= 5 && (
                          <div className="absolute inset-0 animate-glass-shatter bg-white/20 rounded-lg"></div>
                        )}
                      </>
                    )}
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {routeStatus === 'idle' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Enviar
                        </>
                      ) : routeStatus === 'active' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar Rota
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Rota Finalizada
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>          {/* Menu Oculto */}
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
        </>
        )}
        </>
        )}
      </div>
      
      {/* Imagem do leitor - Canto inferior esquerdo - só aparece quando não está em fim de viagem */}
      {!showEndMessage && (
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
            disabled={readerClicks >= 1 && (!selectedLine || routeStatus === 'idle')}
            className={`w-56 h-72 bg-transparent rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 outline-none focus:outline-none focus:bg-transparent active:bg-transparent relative z-10 ${
              readerClicks >= 1 && (!selectedLine || routeStatus === 'idle')
                ? 'cursor-not-allowed opacity-50' 
                : 'hover:scale-105 cursor-none'
            }`}
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
      )}
      
    </div>
  )
}
