'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './fila.module.css';
import { apiService } from '../../services/apiService';

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
  const [usuarioEstaNaFila, setUsuarioEstaNaFila] = useState(false);
  const [usuarioRegistrouInteresse, setUsuarioRegistrouInteresse] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('sp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalAssentos = 46;

  useEffect(() => {
    if (searchParams) {
      const linha = searchParams.get('linha');
      const nome = searchParams.get('nome');
      const horario = searchParams.get('horario');
      const scheduleIdParam = searchParams.get('scheduleId');
      
      setLineId(linha);
      setScheduleId(scheduleIdParam);
      setNomeLinhaAtual(nome ? decodeURIComponent(nome) : '');
      setHorarioAtual(horario || 'N/A');
      
      // Carregar dados reais se temos scheduleId
      if (scheduleIdParam) {
        loadScheduleData(scheduleIdParam);
      } else {
        setLoading(false);
      }
    }
  }, [searchParams]);

  const loadScheduleData = async (scheduleIdParam: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar informações do horário específico no banco de dados
      const response = await fetch(`http://localhost:8000/schedules/`);
      const schedules = await response.json();
      
      // Encontrar o schedule específico pelo ID
      const currentSchedule = schedules.find((s: any) => s.id === parseInt(scheduleIdParam));
      
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
    const assentos = [];
    for (let i = 0; i < totalAssentos; i++) {
      // Determina se é um corredor (coluna do meio)
      const isCorrect = (i % 5) === 2;
      
      if (isCorrect) {
        assentos.push(
          <div key={`corredor-${i}`} className={styles.corredor}></div>
        );
      } else {
        const isOcupado = i < filaCount;
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

  const handleEntrarNaFila = async () => {
    if (!usuarioEstaNaFila) {
      setUsuarioEstaNaFila(true);
      setFilaCount(prev => prev + 1);
      
      // Se temos scheduleId, atualizar interesse na API
      if (scheduleId) {
        try {
          await apiService.updateScheduleInterest(parseInt(scheduleId));
          // Atualizar o count de interesse local
          setInteresseCount(prev => prev + 1);
        } catch (error) {
          console.error('Erro ao atualizar interesse:', error);
        }
      }
    } else {
      setUsuarioEstaNaFila(false);
      setFilaCount(prev => Math.max(0, prev - 1));
      // Em uma implementação completa, aqui removeríamos o interesse
    }
  };

  const handleRegistrarInteresse = async () => {
    if (!usuarioRegistrouInteresse && scheduleId) {
      try {
        setUsuarioRegistrouInteresse(true);
        setInteresseCount(prev => prev + 1);
        
        // Registrar interesse na API usando o scheduleId
        await apiService.updateScheduleInterest(parseInt(scheduleId));
        console.log(`Interesse registrado para o horário ${scheduleId}`);
      } catch (error) {
        console.error('Erro ao registrar interesse:', error);
        // Reverter em caso de erro
        setUsuarioRegistrouInteresse(false);
        setInteresseCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingMessage}>
          <p>Carregando informações da fila...</p>
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
            <h1>
              {nomeLinhaAtual && horarioChegada && horarioSaida 
                ? `LINHA ${nomeLinhaAtual.toUpperCase()} - ${horarioChegada.substring(0, 5)} - ${horarioSaida.substring(0, 5)}`
                : nomeLinhaAtual 
                  ? `LINHA ${nomeLinhaAtual.toUpperCase()} - ${horarioAtual}`
                  : 'Carregando...'
              }
            </h1>
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
                  <span className={styles.statNumero}>{totalAssentos - filaCount}</span>
                  <p>Assentos Disponíveis</p>
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

          <div className={styles.filaAcao}>
            <button 
              onClick={handleEntrarNaFila}
              className={`${styles.btnFila} ${usuarioEstaNaFila ? styles.btnSair : ''}`}
            >
              {usuarioEstaNaFila ? 'Sair da Fila' : 'Entrar na Fila'}
            </button>
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
