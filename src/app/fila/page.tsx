'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './fila.module.css';
import { apiService } from '../../services/apiService';
import { useMqtt } from '../../hooks/useMqtt';
import { rotaIntegrationService } from '../../services/rotaIntegrationService';

function FilaPageContent() {
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
  
  const [busCapacity, setBusCapacity] = useState<number | null>(null);
  const [busOccupied, setBusOccupied] = useState<number | null>(null);
  const [busPrefix, setBusPrefix] = useState<string | null>(null);
  const [lineBuses, setLineBuses] = useState<any[]>([]);
  const [lastBusUpdate, setLastBusUpdate] = useState<Date | null>(null);
  const [isUpdatingBuses, setIsUpdatingBuses] = useState(false);

  const { isConnected: mqttConnected, linhasStatus, simularInicioRota } = useMqtt();

  const totalAssentos = 46;

  const normalizarNomeLinha = (nomeLinhaOriginal: string): string => {
    return nomeLinhaOriginal
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const getCapacidadeMqtt = (): { ocupados: number | null; total: number | null; disponiveis: number | null; isMqttActive: boolean; fonte: string; hasOnibus: boolean } => {
    const temOnibusAPI = busCapacity !== null && busOccupied !== null;
    
    if (temOnibusAPI) {
      const disponiveis = busCapacity - busOccupied;
      return {
        ocupados: busOccupied,
        total: busCapacity,
        disponiveis: disponiveis,
        isMqttActive: true,
        fonte: 'API',
        hasOnibus: true
      };
    }
    
    const nomeNormalizado = normalizarNomeLinha(nomeLinhaAtual);
    const status = linhasStatus[nomeNormalizado];
    
    if (status?.isActive) {
      return {
        ocupados: status.assentosOcupados,
        total: status.capacidadeMaxima,
        disponiveis: status.assentosDisponiveis,
        isMqttActive: true,
        fonte: 'MQTT',
        hasOnibus: true
      };
    }

    const linhaCarregada = lineId !== null && lastBusUpdate !== null;
    const semOnibus = lineBuses.length === 0 && linhaCarregada;
    
    if (semOnibus) {
      return {
        ocupados: null,
        total: null,
        disponiveis: null,
        isMqttActive: false,
        fonte: 'Sem ônibus',
        hasOnibus: false
      };
    }

    return { 
      ocupados: filaCount, 
      total: totalAssentos, 
      disponiveis: totalAssentos - filaCount,
      isMqttActive: false,
      fonte: 'Local',
      hasOnibus: true
    };
  };

  const fetchLineBuses = async (lineIdParam: string) => {
    if (!lineIdParam) return;
    
    setIsUpdatingBuses(true);
    try {
      const response = await apiService.getLineBuses(parseInt(lineIdParam));
      
      if (!response.error && response.data) {
        setLineBuses(response.data);
        setLastBusUpdate(new Date());
        
        if (response.data.length > 0) {
          const activeBus = response.data[0];
          setBusCapacity(activeBus.capacity);
          setBusOccupied(activeBus.occupied);
          setBusPrefix(activeBus.prefix.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ônibus da linha:', error);
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
      
      if (busCapacityParam) {
        const capacity = parseInt(busCapacityParam);
        setBusCapacity(capacity);
      }
      if (busOccupiedParam) {
        const occupied = parseInt(busOccupiedParam);
        setBusOccupied(occupied);
      }
      if (busPrefixParam) {
        setBusPrefix(busPrefixParam);
      }
      
      if (scheduleIdParam) {
        loadScheduleData(scheduleIdParam);
      } else {
        setLoading(false);
      }

      if (linha) {
        fetchLineBuses(linha);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!lineId) return;

    fetchLineBuses(lineId);

    const interval = setInterval(() => {
      fetchLineBuses(lineId);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [lineId]);

  useEffect(() => {
    rotaIntegrationService.setCallbacks({
      onRotaIniciada: (linha: string, capacidade: number) => {
        simularInicioRota('API_001', linha, 'API_BUS', capacidade);
      },
      onError: (error: string) => {
        setError(`Erro ao iniciar rota: ${error}`);
      }
    });
  }, [simularInicioRota]);

  const loadScheduleData = async (scheduleIdParam: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/`);
      const schedules = await response.json();
      
      const currentSchedule = schedules.find((s: any) => s.id === parseInt(scheduleIdParam));
      
      if (currentSchedule) {
        setHorarioChegada(currentSchedule.arrival_time || '');
        setHorarioSaida(currentSchedule.departure_time || '');
        
        if (currentSchedule.line_id) {
          try {
            const lineResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lines/`);
            const lines = await lineResponse.json();
            const currentLine = lines.find((l: any) => l.id === currentSchedule.line_id);
            if (currentLine) {
              setNomeLinhaAtual(currentLine.name || 'Linha');
            }
          } catch (lineError) {
            console.error('Erro ao buscar nome da linha:', lineError);
          }
        }
      }
      
      setInteresseCount(currentSchedule.interest || 0);
      setFilaCount(0);
    } catch (error) {
      console.error('Erro ao carregar dados do horário:', error);
      setError('Erro ao carregar informações do horário');
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
    
    if (!capacidadeMqtt.hasOnibus || totalAssentosAtual === null) {
      return (
        <div className={styles.onibusAssentos} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            fontSize: '1.2rem', 
            color: '#666', 
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <img 
              src="/icone_onibus.png" 
              alt="Ônibus" 
              style={{ 
                width: '48px', 
                height: '48px',
                filter: 'grayscale(100%)'
              }} 
            />
            <p><strong>Nenhum ônibus vinculado a esta linha</strong></p>
          </div>
        </div>
      );
    }
    
    const assentos = [];
    
    // Layout dinâmico baseado na capacidade total
    let assentosPorFileira = 4; // Padrão: 2 + 2 (ônibus comum)
    let temCorredor = true;
    
    // Ajustar layout baseado na capacidade para otimizar visualização
    if (totalAssentosAtual <= 20) {
      assentosPorFileira = 2; // Microônibus: 1 + 1
      temCorredor = false;
    } else if (totalAssentosAtual <= 30) {
      assentosPorFileira = 3; // Ônibus pequeno: 1 + 2
      temCorredor = true;
    } else if (totalAssentosAtual > 60) {
      assentosPorFileira = 5; // Ônibus grande: 2 + 3
      temCorredor = true;
    }
    
    const ladoEsquerdo = Math.floor(assentosPorFileira / 2);
    const ladoDireito = assentosPorFileira - ladoEsquerdo;
    const fileiras = Math.ceil(totalAssentosAtual / assentosPorFileira);
    
    const colunasGrid = ladoEsquerdo + (temCorredor ? 1 : 0) + ladoDireito;
    
    let assentoIndex = 0;
    const ocupadosCount = ocupadosAtual || 0;
    
    for (let fileira = 0; fileira < fileiras && assentoIndex < totalAssentosAtual; fileira++) {
      // Lado esquerdo
      for (let lado = 0; lado < ladoEsquerdo && assentoIndex < totalAssentosAtual; lado++) {
        const isOcupado = assentoIndex < ocupadosCount;
        assentos.push(
          <div 
            key={`assento-${assentoIndex}`} 
            className={`${styles.assento} ${isOcupado ? styles.ocupado : styles.vago}`}
            title={`Assento ${assentoIndex + 1} - ${isOcupado ? 'Ocupado' : 'Disponível'}`}
          >
            <div className={styles.encosto}></div>
          </div>
        );
        assentoIndex++;
      }
      
      // Corredor (apenas se configurado)
      if (temCorredor && assentoIndex < totalAssentosAtual) {
        assentos.push(
          <div key={`corredor-${fileira}`} className={styles.corredor}></div>
        );
      }
      
      // Lado direito
      for (let lado = 0; lado < ladoDireito && assentoIndex < totalAssentosAtual; lado++) {
        const isOcupado = assentoIndex < ocupadosCount;
        assentos.push(
          <div 
            key={`assento-${assentoIndex}`} 
            className={`${styles.assento} ${isOcupado ? styles.ocupado : styles.vago}`}
            title={`Assento ${assentoIndex + 1} - ${isOcupado ? 'Ocupado' : 'Disponível'}`}
          >
            <div className={styles.encosto}></div>
          </div>
        );
        assentoIndex++;
      }
    }
    
    return (
      <div 
        className={styles.onibusAssentos}
        style={{
          gridTemplateColumns: `repeat(${colunasGrid}, minmax(28px, 1fr))`,
          maxWidth: `${colunasGrid * 50}px`
        }}
      >
        {assentos}
      </div>
    );
  };

  const handleRegistrarInteresse = async () => {
    if (!usuarioRegistrouInteresse && scheduleId) {
      try {
        setUsuarioRegistrouInteresse(true);
        setInteresseCount(prev => prev + 1);
        
        await apiService.updateScheduleInterest(parseInt(scheduleId));
      } catch (error) {
        console.error('Erro ao registrar interesse:', error);
        setUsuarioRegistrouInteresse(false);
        setInteresseCount(prev => Math.max(0, prev - 1));
      }
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
                <img 
                  src="/icone_onibus.png" 
                  alt="Ônibus" 
                  style={{ 
                    width: '16px', 
                    height: '16px'
                  }} 
                />
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
                  <span className={styles.statNumero}>
                    {getCapacidadeMqtt().hasOnibus ? getCapacidadeMqtt().disponiveis : 'N/A'}
                  </span>
                  <p>Assentos Disponíveis</p>
                  {getCapacidadeMqtt().isMqttActive && (
                    <small style={{ color: '#4caf50', fontWeight: 'bold' }}>
                      � Em tempo real
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
                {renderizarAssentos()}
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

export default function FilaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FilaPageContent />
    </Suspense>
  );
}
