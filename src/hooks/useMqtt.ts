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
  password: 'Admin123',
  connectTimeout: 10000,
  reconnectPeriod: 5000,
  keepalive: 60,
  clean: true,
  resubscribe: false
};

export const useMqtt = (): UseMqttReturn => {
  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [linhasStatus, setLinhasStatus] = useState<Record<string, LinhaStatus>>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [useMockData, setUseMockData] = useState(false);

  // Máximo de tentativas de reconexão
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 5000;

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

  // Função de reconexão robusta com fallback
  const reconnectMqtt = useCallback(() => {
    if (isUnmountedRef.current) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('⚠️ MQTT desabilitado - usando dados mock');
      setUseMockData(true);
      setIsConnected(false);
      setConnectionError(null); // Não mostrar erro pro usuário
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setReconnectAttempts(prev => prev + 1);
        // Chamar a função de inicialização diretamente
        initializeMqtt();
      }
    }, RECONNECT_DELAY);
  }, [reconnectAttempts]); // Removendo initializeMqtt da dependência para evitar warnings

  // Função interna para inicializar MQTT (sem useCallback para evitar dependência circular)
  const initializeMqtt = useCallback(() => {
    if (isUnmountedRef.current || useMockData) {
      return;
    }

    // Fechar conexão anterior se existir
    if (clientRef.current) {
      try {
        clientRef.current.removeAllListeners();
        clientRef.current.end(true);
      } catch (error) {
        // Ignorar erros ao fechar conexão anterior
      }
      clientRef.current = null;
    }

    try {
      const connectUrl = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;
      
      const options = {
        clientId: `frontend_${Date.now()}_${Math.random().toString(16).substr(2, 4)}`,
        keepalive: MQTT_CONFIG.keepalive,
        clean: MQTT_CONFIG.clean,
        connectTimeout: MQTT_CONFIG.connectTimeout,
        reconnectPeriod: 0,
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        resubscribe: false,
        will: {
          topic: 'frontend/disconnect',
          payload: 'Frontend disconnected',
          qos: 1 as 0 | 1 | 2,
          retain: false
        }
      };
      
      const client = mqtt.connect(connectUrl, options);
      clientRef.current = client;
      
      // Timeout para evitar travamento
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && client && client.connected === false) {
          client.end(true);
          reconnectMqtt();
        }
      }, MQTT_CONFIG.connectTimeout + 2000);
      
      client.on('connect', () => {
        if (isUnmountedRef.current) return;
        
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        setUseMockData(false);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        const topics = ['onibus/+/motorista', 'onibus/+/entrada'];
        topics.forEach(topic => {
          client.subscribe(topic, { qos: 1 as 0 | 1 | 2 }, (err) => {
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
      
    } catch (error) {
      // Falha silenciosa na conexão - usar dados mock
      console.warn('⚠️ Falha na conexão MQTT - modo fallback ativado');
      reconnectMqtt();
    }
  }, [reconnectAttempts, processarMensagemMotorista, processarMensagemEntrada]);

  // Configurar conexão MQTT com reconexão automática
  useEffect(() => {
    console.log('🔧 Inicializando sistema MQTT com reconexão automática...');
    isUnmountedRef.current = false;
    
    // Iniciar primeira conexão
    initializeMqtt();
    
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
        console.log('🔌 Fechando conexão MQTT...');
        clientRef.current.removeAllListeners();
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [initializeMqtt]); // Adicionando a dependência

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
