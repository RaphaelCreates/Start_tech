'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './fila.module.css';
import { apiService } from '../../services/apiService';
import { useMqtt } from '../../hooks/useMqtt';
import { rotaIntegrationService } from '../../services/rotaIntegrationService'; // NOVO

export default function FilaPage() {
  const searchParams = useSearchParams();
  const [lineId, setLineId] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [nomeLinhaAtual, setNomeLinhaAtual] = useState<string>('');
  const [horarioAtual, setHorarioAtual] = useState<string>('');
  const [horarioChegada, setHorarioChegada] = useState<string>('');
  const [horarioSaida, setHorarioSaida] = useState<string>('');
  const [interesseCount, setInteresseCount] = useState(0);
  const [filaCount, setFilaCount] = useState(0);
  const [usuarioRegistrouInteresse, setUsuarioRegistrouInteresse] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('sp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para informações do ônibus
  const [busCapacity, setBusCapacity] = useState<number | null>(null);
  const [busOccupied, setBusOccupied] = useState<number | null>(null);
  const [busPrefix, setBusPrefix] = useState<string | null>(null);
  const [lineBuses, setLineBuses] = useState<any[]>([]);
  const [lastBusUpdate, setLastBusUpdate] = useState<Date | null>(null);
  const [isUpdatingBuses, setIsUpdatingBuses] = useState(false);

  // MQTT Integration
  const { isConnected: mqttConnected, linhasStatus, simularInicioRota } = useMqtt();

  const totalAssentos = 46;

  // Função para normalizar nome da linha para verificação MQTT
  const normalizarNomeLinha = (nomeLinhaOriginal: string): string => {
    return nomeLinhaOriginal
      .toLowerCase()
      .replace(/\s+/g, '') // Remove espaços
      .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
  };

  // Função para obter capacidade via MQTT ou dados do ônibus da API
  const getCapacidadeMqtt = (): { ocupados: number; total: number; disponiveis: number; isMqttActive: boolean; fonte: string } => {
    // Priorizar dados do endpoint se disponíveis
    if (busCapacity !== null && busOccupied !== null) {
      const disponiveis = busCapacity - busOccupied;
      console.log('🚌 Usando dados da API:', { capacity: busCapacity, occupied: busOccupied, disponiveis });
      return {
        ocupados: busOccupied,
        total: busCapacity,
        disponiveis: disponiveis,
        isMqttActive: true, // Consideramos como dados "ativos" pois vem da API
        fonte: 'API'
      };
    }
    
    // Verificar MQTT como segunda opção
    const nomeNormalizado = normalizarNomeLinha(nomeLinhaAtual);
    const status = linhasStatus[nomeNormalizado];
    
    if (status?.isActive) {
      console.log('🚌 Usando dados do MQTT:', status);
      return {
        ocupados: status.assentosOcupados,
        total: status.capacidadeMaxima,
        disponiveis: status.assentosDisponiveis,
        isMqttActive: true,
        fonte: 'MQTT'
      };
    }

    // Fallback para dados locais/mock
    console.log('🚌 Usando dados locais/mock - busCapacity:', busCapacity, 'busOccupied:', busOccupied);
    return { 
      ocupados: filaCount, 
      total: totalAssentos, 
      disponiveis: totalAssentos - filaCount,
      isMqttActive: false,
      fonte: 'Local'
    };
  };

  // Função para buscar ônibus da linha
  const fetchLineBuses = async (lineIdParam: string) => {
    if (!lineIdParam) return;
    
    setIsUpdatingBuses(true);
    try {
      console.log(`🚌 Buscando ônibus da linha ${lineIdParam}...`);
      const response = await apiService.getLineBuses(parseInt(lineIdParam));
      
      if (!response.error && response.data) {
        console.log(`✅ Ônibus da linha encontrados:`, response.data);
        setLineBuses(response.data);
        setLastBusUpdate(new Date());
        
        // Se há ônibus, usar o primeiro como padrão (ou o ativo se especificado)
        if (response.data.length > 0) {
          const activeBus = response.data[0]; // Pode ser melhorado para encontrar o ônibus ativo
          setBusCapacity(activeBus.capacity);
          setBusOccupied(activeBus.occupied);
          setBusPrefix(activeBus.prefix.toString());
          console.log(`🚌 Dados do ônibus ativo atualizados:`, {
            capacity: activeBus.capacity,
            occupied: activeBus.occupied,
            prefix: activeBus.prefix
          });
        }
      } else {
        console.warn(`⚠️ Erro ao buscar ônibus da linha ${lineIdParam}:`, response.error);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar ônibus da linha:', error);
    } finally {
      setIsUpdatingBuses(false);
    }
  };

  useEffect(() => {
    if (searchParams) {
      const linha = searchParams.get('linha');
      const nome = searchParams.get('nome');
      const horario = searchParams.get('horario');
      const scheduleIdParam = searchParams.get('scheduleId');
      const busCapacityParam = searchParams.get('capacity');
      const busOccupiedParam = searchParams.get('occupied');
      const busPrefixParam = searchParams.get('busPrefix');
      
      setLineId(linha);
      setScheduleId(scheduleIdParam);
      setNomeLinhaAtual(nome ? decodeURIComponent(nome) : '');
      setHorarioAtual(horario || 'N/A');
      
      // Definir informações do ônibus se disponíveis
      if (busCapacityParam) {
        const capacity = parseInt(busCapacityParam);
        setBusCapacity(capacity);
        console.log('🚌 Capacity definida:', capacity);
      }
      if (busOccupiedParam) {
        const occupied = parseInt(busOccupiedParam);
        setBusOccupied(occupied);
        console.log('🚌 Occupied definido:', occupied);
      }
      if (busPrefixParam) {
        setBusPrefix(busPrefixParam);
        console.log('🚌 Bus prefix definido:', busPrefixParam);
      }
      
      // Carregar dados reais se temos scheduleId
      if (scheduleIdParam) {
        loadScheduleData(scheduleIdParam);
      } else {
        setLoading(false);
      }

      // Buscar ônibus da linha inicialmente
      if (linha) {
        fetchLineBuses(linha);
      }
    }
  }, [searchParams]);

  // Configurar atualização periódica dos ônibus da linha
  useEffect(() => {
    if (!lineId) return;

    // Buscar inicialmente
    fetchLineBuses(lineId);

    // Configurar intervalo para atualizar a cada 5 segundos
    const interval = setInterval(() => {
      console.log('🔄 Atualizando dados dos ônibus...');
      fetchLineBuses(lineId);
    }, 5000); // 5 segundos

    // Cleanup
    return () => {
      console.log('🧹 Limpando intervalo de atualização dos ônibus');
      clearInterval(interval);
    };
  }, [lineId]);

  // Configurar integração entre API e MQTT
  useEffect(() => {
    console.log('🔧 [FilaPage] Configurando callbacks de integração...');
    
    rotaIntegrationService.setCallbacks({
      onRotaIniciada: (linha: string, capacidade: number) => {
        console.log(`🚌 [FilaPage] Callback: Rota ${linha} iniciada com capacidade ${capacidade}`);
        
        // Integrar com o hook MQTT local
        console.log('🔗 [FilaPage] Chamando simularInicioRota...');
        simularInicioRota('API_001', linha, 'API_BUS', capacidade);
      },
      onError: (error: string) => {
        console.error('❌ [FilaPage] Erro na integração da rota:', error);
        setError(`Erro ao iniciar rota: ${error}`);
      }
    });
    
    console.log('✅ [FilaPage] Callbacks configurados com sucesso!');
  }, [simularInicioRota]);

  const loadScheduleData = async (scheduleIdParam: string) => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 Carregando dados para scheduleId:', scheduleIdParam);
    
    try {
      // Buscar informações do horário específico no banco de dados
      const response = await fetch(`http://localhost:8000/schedules/`);
      const schedules = await response.json();
      
      console.log('📋 Total de schedules encontrados:', schedules.length);
      
      // Encontrar o schedule específico pelo ID
      const currentSchedule = schedules.find((s: any) => s.id === parseInt(scheduleIdParam));
      
      console.log('🎯 Schedule específico encontrado:', currentSchedule);
      
      if (currentSchedule) {
        // Atualizar horários de chegada e saída
        setHorarioChegada(currentSchedule.arrival_time || '');
        setHorarioSaida(currentSchedule.departure_time || '');
        
        // Buscar nome da linha se disponível
        if (currentSchedule.line_id) {
          try {
            const lineResponse = await fetch(`http://localhost:8000/lines/`);
            const lines = await lineResponse.json();
            const currentLine = lines.find((l: any) => l.id === currentSchedule.line_id);
            if (currentLine) {
              setNomeLinhaAtual(currentLine.name || 'Linha');
            }
          } catch (lineError) {
            console.log('Erro ao buscar nome da linha:', lineError);
          }
        }
      }
      
      // Fila sempre inicia vazia - todos os 46 assentos disponíveis
      // Usar o interesse real do banco de dados
      setInteresseCount(currentSchedule.interest || 0);
      setFilaCount(0); // Fila sempre começa vazia
    } catch (error) {
      console.error('Erro ao carregar dados do horário:', error);
      setError('Erro ao carregar informações do horário');
      // Usar valores padrão em caso de erro
      setInteresseCount(0);
      setFilaCount(0);
      setHorarioChegada('');
      setHorarioSaida('');
    } finally {
      setLoading(false);
    }
  };

  const renderizarAssentos = () => {
    const capacidadeMqtt = getCapacidadeMqtt();
    const totalAssentosAtual = capacidadeMqtt.total;
    const ocupadosAtual = capacidadeMqtt.ocupados;
    
    const assentos = [];
    for (let i = 0; i < totalAssentosAtual; i++) {
      // Determina se é um corredor (coluna do meio)
      const isCorrect = (i % 5) === 2;
      
      if (isCorrect) {
        assentos.push(
          <div key={`corredor-${i}`} className={styles.corredor}></div>
        );
      } else {
        const isOcupado = i < ocupadosAtual;
        assentos.push(
          <div 
            key={i} 
            className={`${styles.assento} ${isOcupado ? styles.ocupado : styles.vago}`}
          >
            <div className={styles.encosto}></div>
          </div>
        );
      }
    }
    return assentos;
  };

  const handleRegistrarInteresse = async () => {
    if (!usuarioRegistrouInteresse && scheduleId) {
      try {
        console.log('🎯 Registrando interesse para scheduleId:', scheduleId);
        setUsuarioRegistrouInteresse(true);
        setInteresseCount(prev => prev + 1);
        
        // Registrar interesse na API usando o scheduleId
        await apiService.updateScheduleInterest(parseInt(scheduleId));
        console.log(`✅ Interesse registrado com sucesso para o horário ${scheduleId}`);
      } catch (error) {
        console.error('❌ Erro ao registrar interesse:', error);
        // Reverter em caso de erro
        setUsuarioRegistrouInteresse(false);
        setInteresseCount(prev => Math.max(0, prev - 1));
      }
    } else {
      console.log('⚠️ Condições para registrar interesse não atendidas:', {
        usuarioRegistrouInteresse,
        scheduleId
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingContainer}>
          <span className={styles.loader}></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingMessage}>
          <p>Erro: {error}</p>
          <Link href="/fretado" className={styles.btnVoltar}>
            Voltar para horários
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo_meu_rh.png" alt="Logo Meu RH" width={200} height={50} />
        </div>

        <div className={styles.filtroLocalizacao}>
          <span className="material-symbols-outlined">location_on</span>
          <select 
            name="local" 
            id="local" 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="sp">São Paulo (SP)</option>
            <option value="rj">Rio de Janeiro (RJ)</option>
          </select>
        </div>

        <div className={styles.perfilUsuario}>
          <span className="material-symbols-outlined">account_circle</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.filaContainer}>
          <div className={styles.filaHeader}>
            <Link href="/fretado" className={styles.btnVoltar}>
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            
            {/* Indicador de Status MQTT */}
            <div 
              className={styles.mqttStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: mqttConnected ? '#e8f5e8' : '#ffe8e8',
                border: `1px solid ${mqttConnected ? '#4caf50' : '#f44336'}`,
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: mqttConnected ? '#4caf50' : '#f44336'
                }}
              />
              <span style={{ color: mqttConnected ? '#2e7d32' : '#c62828' }}>
                {mqttConnected ? 'MQTT Conectado' : 'MQTT Desconectado'}
              </span>
            </div>
            
            <h1>
              {nomeLinhaAtual && horarioChegada && horarioSaida 
                ? `LINHA ${nomeLinhaAtual.toUpperCase()} - ${horarioChegada.substring(0, 5)} - ${horarioSaida.substring(0, 5)}`
                : nomeLinhaAtual 
                  ? `LINHA ${nomeLinhaAtual.toUpperCase()} - ${horarioAtual}`
                  : 'Carregando...'
              }
            </h1>
            {getCapacidadeMqtt().isMqttActive && (
              <div style={{ 
                background: '#e8f5e9', 
                color: '#2e7d32', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem' }}>🚌</span>
                Ônibus Ativo
                <span style={{ 
                  background: '#4caf50', 
                  color: 'white', 
                  padding: '0.125rem 0.5rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem' 
                }}>
                  MQTT
                </span>
              </div>
            )}
          </div>

          <div className={styles.filaLayout}>
            <div className={styles.filaStats}>
              <div className={styles.statCard}>
                <span className="material-symbols-outlined">groups</span>
                <div>
                  <span className={styles.statNumero}>{interesseCount}</span>
                  <p>Pessoas com interesse</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className="material-symbols-outlined">event_seat</span>
                <div>
                  <span className={styles.statNumero}>{getCapacidadeMqtt().disponiveis}</span>
                  <p>Assentos Disponíveis</p>
                  {getCapacidadeMqtt().isMqttActive && (
                    <small style={{ color: '#4caf50', fontWeight: 'bold' }}>
                      📡 Dados em tempo real
                    </small>
                  )}
                </div>
              </div>
              
              {/* Botão Registrar Interesse */}
              <div className={styles.interesseContainer}>
                <button 
                  onClick={handleRegistrarInteresse}
                  disabled={usuarioRegistrouInteresse}
                  className={`${styles.btnInteresse} ${usuarioRegistrouInteresse ? styles.btnInteresseRegistrado : ''}`}
                >
                  {usuarioRegistrouInteresse ? (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      Interesse Registrado
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">favorite</span>
                      Registrar Interesse
                    </>
                  )}
                </button>
                {scheduleId && (
                  <p className={styles.interesseInfo}>
                    Horário ID: {scheduleId}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.onibusAssentosContainer}>
              <div className={styles.onibusChassi}>
                <div className={styles.onibusAssentos}>
                  {renderizarAssentos()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <nav>
          <Link href="/home">
            <span className="material-symbols-outlined">home</span>
            <span className={styles.navegacao}>Início</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">payments</span>
            <span className={styles.navegacao}>Pagamento</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">schedule</span>
            <span className={styles.navegacao}>Ponto</span>
          </Link>
          <Link href="/fretado" className={styles.active}>
            <span className="material-symbols-outlined">directions_bus</span>
            <span className={styles.navegacao}>Fretado</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">box</span>
            <span className={styles.navegacao}>Requisições</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">menu</span>
            <span className={styles.navegacao}>Menu</span>
          </Link>
        </nav>
      </footer>
    </div>
  );
}
