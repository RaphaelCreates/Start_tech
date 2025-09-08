'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// Tipos para os payloads MQTT
export interface MotoristaPayload {
  linha: string;
  capacidade: number;
  prefixo: string;
  motorista_id: string;
}

export interface EntradaPayload {
  contagem: number;
  capacidade: number;
}

export interface LinhaStatus {
  isActive: boolean;
  capacidadeMaxima: number;
  assentosOcupados: number;
  assentosDisponiveis: number;
  prefixo?: string;
  motorista_id?: string;
}

export interface UseMqttReturn {
  isConnected: boolean;
  linhasStatus: Record<string, LinhaStatus>;
  connectionError: string | null;
  simularInicioRota: (motorista_id: string, linha: string, prefixo: string, capacidade: number) => void; // NOVO
}

// Configuração MQTT - HiveMQ Cloud
const MQTT_CONFIG = {
  host: '24ab66b6e7dc40adb8a552fbe0050391.s1.eu.hivemq.cloud',
  port: 8884,
  protocol: 'wss' as const,
  username: 'admin',
  password: 'Admin123'
};

export const useMqtt = (): UseMqttReturn => {
  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [linhasStatus, setLinhasStatus] = useState<Record<string, LinhaStatus>>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Máximo de tentativas de reconexão
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 3000; // 3 segundos

  // Função para normalizar nome da linha
  const normalizarNomeLinha = useCallback((nomeLinhaOriginal: string): string => {
    return nomeLinhaOriginal
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }, []);

  // Função para processar mensagem do motorista
  const processarMensagemMotorista = useCallback((topic: string, payload: MotoristaPayload) => {
    console.log('🚌 Motorista conectado:', payload);
    
    const nomeLinha = payload.linha.replace('l_', '');
    
    setLinhasStatus(prev => ({
      ...prev,
      [nomeLinha]: {
        isActive: true,
        capacidadeMaxima: payload.capacidade,
        assentosOcupados: 0,
        assentosDisponiveis: payload.capacidade,
        prefixo: payload.prefixo,
        motorista_id: payload.motorista_id
      }
    }));
  }, []);

  // Função para processar mensagem de entrada
  const processarMensagemEntrada = useCallback((topic: string, payload: EntradaPayload) => {
    console.log('🚪 Entrada registrada:', payload);
    
    const topicParts = topic.split('/');
    const linhaTopic = topicParts[1];
    const nomeLinha = linhaTopic.replace('l_', '');
    
    setLinhasStatus(prev => {
      const linhaAtual = prev[nomeLinha];
      if (!linhaAtual) {
        console.warn(`⚠️ Linha ${nomeLinha} não encontrada`);
        return prev;
      }

      const novosAssentosOcupados = Math.min(
        linhaAtual.assentosOcupados + payload.contagem,
        linhaAtual.capacidadeMaxima
      );
      
      const novosAssentosDisponiveis = linhaAtual.capacidadeMaxima - novosAssentosOcupados;

      return {
        ...prev,
        [nomeLinha]: {
          ...linhaAtual,
          assentosOcupados: novosAssentosOcupados,
          assentosDisponiveis: novosAssentosDisponiveis,
          capacidadeMaxima: payload.capacidade
        }
      };
    });
  }, []);

  // Função de reconexão robusta
  const reconnectMqtt = useCallback(() => {
    if (isUnmountedRef.current) {
      console.log('🛑 Hook desmontado, cancelando reconexão');
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      setConnectionError('Falha na conexão MQTT - máximo de tentativas atingido');
      return;
    }

    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}...`);
    
    // Limpar timeout anterior se existir
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setReconnectAttempts(prev => prev + 1);
        initializeMqttConnection();
      }
    }, RECONNECT_DELAY);
  }, [reconnectAttempts]);

  // Função para inicializar conexão MQTT
  const initializeMqttConnection = useCallback(() => {
    if (isUnmountedRef.current) {
      console.log('🛑 Hook desmontado, cancelando inicialização');
      return;
    }

    // Fechar conexão anterior se existir
    if (clientRef.current) {
      console.log('🔌 Fechando conexão anterior...');
      clientRef.current.removeAllListeners();
      clientRef.current.end(true);
      clientRef.current = null;
    }

    console.log('🔌 Iniciando nova conexão MQTT com HiveMQ Cloud...');
    console.log('📋 Configuração:', {
      host: MQTT_CONFIG.host,
      port: MQTT_CONFIG.port,
      protocol: MQTT_CONFIG.protocol,
      username: MQTT_CONFIG.username,
      tentativa: reconnectAttempts + 1
    });

    // URL do HiveMQ Cloud WebSocket
    const connectUrl = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;
    console.log('🌐 Conectando em:', connectUrl);
    
    const options: any = {
      clientId: `frontend_${Date.now()}_${Math.random().toString(16).substr(2, 4)}`,
      keepalive: 30, // Reduzido para detectar desconexões mais rápido
      clean: true,
      connectTimeout: 15000, // Reduzido
      reconnectPeriod: 0, // Desabilitado - vamos gerenciar manualmente
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      will: {
        topic: 'frontend/disconnect',
        payload: 'Frontend disconnected',
        qos: 1,
        retain: false
      }
    };
    
    console.log('⚙️ Opções de conexão:', { ...options, password: '***' });
    
    const client = mqtt.connect(connectUrl, options);
    clientRef.current = client;
    
    client.on('connect', () => {
      if (isUnmountedRef.current) return;
      
      console.log('✅ MQTT HiveMQ Cloud conectado!');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0); // Reset contador
      
      // Limpar timeout de reconexão se conectou
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Subscrever aos tópicos com QoS 1
      const topics = [
        'onibus/+/motorista',
        'onibus/+/entrada',
        '#' // Escutar todos os tópicos
      ];
      
      topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, (err) => {
          if (!err) {
            console.log(`📡 Subscrito: ${topic} (QoS 1)`);
          } else {
            console.error(`❌ Erro ao subscrever ${topic}:`, err);
          }
        });
      });
    });
    
    client.on('error', (error) => {
      if (isUnmountedRef.current) return;
      
      console.error('❌ Erro MQTT HiveMQ:', error);
      setConnectionError(`HiveMQ Error: ${error.message}`);
      setIsConnected(false);
      
      // Tentar reconectar após erro
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          reconnectMqtt();
        }
      }, 1000);
    });
    
    client.on('close', () => {
      if (isUnmountedRef.current) return;
      
      console.log('🔌 HiveMQ conexão fechada - tentando reconectar...');
      setIsConnected(false);
      
      // Reconectar automaticamente quando conexão é fechada
      reconnectMqtt();
    });
    
    client.on('offline', () => {
      if (isUnmountedRef.current) return;
      
      console.log('📴 HiveMQ offline - aguardando reconexão...');
      setIsConnected(false);
    });
    
    client.on('reconnect', () => {
      if (isUnmountedRef.current) return;
      
      console.log('🔄 Reconectando ao HiveMQ Cloud...');
    });

    // Processar mensagens
    client.on('message', (topic, message) => {
      if (isUnmountedRef.current) return;
      
      try {
        const messageStr = message.toString();
        console.log(`📨 Mensagem recebida - Tópico: ${topic}, Conteúdo: ${messageStr}`);
        
        const payload = JSON.parse(messageStr);
        
        if (topic.includes('/motorista')) {
          processarMensagemMotorista(topic, payload);
        } else if (topic.includes('/entrada')) {
          processarMensagemEntrada(topic, payload);
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });
  }, [reconnectAttempts, processarMensagemMotorista, processarMensagemEntrada, reconnectMqtt]);

  // Configurar conexão MQTT com reconexão automática
  useEffect(() => {
    console.log('� Inicializando sistema MQTT com reconexão automática...');
    isUnmountedRef.current = false;
    
    // Iniciar primeira conexão
    initializeMqttConnection();
    
    return () => {
      console.log('🧹 Desmontando hook MQTT...');
      isUnmountedRef.current = true;
      
      // Limpar timeout de reconexão
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Fechar conexão MQTT
      if (clientRef.current) {
        console.log('� Fechando conexão MQTT...');
        clientRef.current.removeAllListeners();
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []); // Apenas uma vez, sem dependências para evitar reconexões desnecessárias

  // Nova função para simular início de rota via REST API
  const simularInicioRota = useCallback((motorista_id: string, linha: string, prefixo: string, capacidade: number) => {
    console.log('🚌 [useMqtt] Simulando início de rota:', { motorista_id, linha, prefixo, capacidade });
    
    // Ativa a linha diretamente (simulando efeito do RFID)
    setLinhasStatus(prev => {
      const novoStatus = {
        ...prev,
        [linha]: {
          isActive: true,
          capacidadeMaxima: capacidade,
          assentosOcupados: 1, // Inicia com +1 como no RFID
          assentosDisponiveis: capacidade - 1,
          prefixo: prefixo,
          motorista_id: motorista_id
        }
      };
      
      console.log('🎯 [useMqtt] Status atualizado:', novoStatus);
      return novoStatus;
    });
    
    console.log(`✅ [useMqtt] Linha ${linha} ativada via REST API com capacidade ${capacidade}`);
  }, []);

  return {
    isConnected,
    linhasStatus,
    connectionError,
    simularInicioRota // Adiciona a nova função ao retorno
  };
};
