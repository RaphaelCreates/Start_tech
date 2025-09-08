'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './fretado.module.css';
import { cacheService } from '../../services/cacheService';
import { apiService } from '../../services/apiService';
import { useMqtt } from '../../hooks/useMqtt';

interface Schedule {
  id: number;
  arrival_time: string;
  departure_time: string;
  interest: number;
  day_week: number;
}

interface LineData {
  id: number;
  name: string;
  active_bus: number;
  schedules: Schedule[];
}

interface CityData {
  id: number;
  state: string;
  country: string;
  lines?: LineData[];
}

export default function FretadoPage() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [lines, setLines] = useState<LineData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasAvailableData, setHasAvailableData] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date()); // Para forçar re-render do timer
  const [showCacheDebug, setShowCacheDebug] = useState(false);
  const [dataSource, setDataSource] = useState<{
    cities: 'API' | 'Cache' | 'Backup' | null;
    lines: 'API' | 'Cache' | 'Backup' | null;
  }>({ cities: null, lines: null });
  const [previousActiveScheduleId, setPreviousActiveScheduleId] = useState<number | null>(null);
  
  // MQTT Integration
  const { isConnected: mqttConnected, linhasStatus, connectionError } = useMqtt();
  
  const router = useRouter();

  // Cache keys
  const LINES_CACHE_KEY = 'lines_data';
  const CITIES_CACHE_KEY = 'cities_data';
  const SCHEDULES_CACHE_KEY = 'schedules_data';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

  const fetchAvailableCities = async (): Promise<CityData[]> => {
    console.log('🏙️ Buscando cidades disponíveis...');
    
    // CACHE TEMPORARIAMENTE DESABILITADO PARA TESTES
    // 1. Tentar obter do cache primeiro (mais rápido)
    // let cachedCities = cacheService.get<CityData[]>(CITIES_CACHE_KEY);
    
    // if (cachedCities) {
    //   console.log('💾 Cidades carregadas do cache:', cachedCities);
    //   setDataSource(prev => ({ ...prev, cities: 'Cache' }));
    //   return cachedCities;
    // }

    try {
      console.log('🌐 Sempre buscando da API (cache desabilitado)...');
      const citiesResponse = await apiService.getCities();
      
      if (citiesResponse.error) {
        console.error('❌ Erro ao buscar cidades:', citiesResponse.error);
        throw new Error(citiesResponse.error);
      }
      
      console.log('✅ Cidades disponíveis da API:', citiesResponse.data);
      setDataSource(prev => ({ ...prev, cities: 'API' }));
      
      // Salvar no cache
      cacheService.set(CITIES_CACHE_KEY, citiesResponse.data, CACHE_TTL);
      
      return citiesResponse.data;
    } catch (error) {
      console.error('💥 Erro ao buscar cidades da API:', error);
      
      // CACHE TEMPORARIAMENTE DESABILITADO PARA TESTES
      // 2. Tentar usar dados do cache stale como fallback
      // const staleCities = cacheService.getStale<CityData[]>(CITIES_CACHE_KEY);
      // if (staleCities && staleCities.length > 0) {
      //   console.log('🔄 Usando cidades do cache (expiradas) como fallback:', staleCities);
      //   setDataSource(prev => ({ ...prev, cities: 'Cache' }));
      //   return staleCities;
      // }
      
      // 4. Se nem cache nem JSON funcionaram, retornar erro
      console.error('💥 Erro final: nenhuma fonte de dados disponível');
      throw new Error('Erro ao carregar dados das cidades disponíveis');
    }
  };

  const fetchAllDataFromApi = async (state?: string): Promise<LineData[]> => {
    console.log('🔄 Iniciando busca de dados da API...', state ? `(Estado: ${state})` : '(Todos os estados)');
    
    try {
      // Primeiro verificar se a API está online
      const healthCheck = await apiService.healthCheck();
      console.log('🏥 Health check da API:', healthCheck ? 'OK' : 'FALHOU');
      
      if (!healthCheck) {
        console.log('⚠️ API não está respondendo, tentando mesmo assim...');
      }
      
      // Buscar linhas filtradas por estado se fornecido
      const linesResponse = await apiService.getLines(state);
      
      if (linesResponse.error) {
        console.error('❌ Erro na resposta das linhas:', linesResponse.error);
        throw new Error(linesResponse.error);
      }
      
      console.log('✅ Dados das linhas recebidos:', linesResponse.data);
      
      // Ordenar schedules de todas as linhas por horário de partida
      const sortedLines = linesResponse.data.map(line => ({
        ...line,
        schedules: line.schedules.sort((a, b) => {
          const timeA = timeToMinutes(a.arrival_time);
          const timeB = timeToMinutes(b.arrival_time);
          return timeA - timeB;
        })
      }));
      
      return sortedLines;
    } catch (error) {
      console.error('💥 Erro fatal ao buscar dados:', error);
      throw error;
    }
  };

  const loadAllDataWithCache = useCallback(async (state?: string) => {
    console.log('🚀 Iniciando loadAllDataWithCache...', state ? `(Estado: ${state})` : '(Todos os estados)');
    setLoading(true);
    setError(null);
    
    // Chave do cache baseada no estado (declarar fora do try para estar disponível no catch)
    const cacheKey = state ? `${LINES_CACHE_KEY}_${state}` : '';
    
    try {
      // Se não há estado selecionado, não fazer requisição
      if (!state) {
        setLines([]);
        setHasAvailableData(false);
        setLoading(false);
        return;
      }
      
      // Tentar obter do cache primeiro
      // CACHE TEMPORARIAMENTE DESABILITADO PARA TESTES
      // let cachedLines = cacheService.get<LineData[]>(cacheKey);
      
      // if (cachedLines) {
      //   console.log('💾 Dados carregados do cache:', cachedLines);
      //   setDataSource(prev => ({ ...prev, lines: 'Cache' }));
      //   setLines(cachedLines);
      //   setHasAvailableData(true);
      //   setLastUpdate(new Date());
      //   setLoading(false);
      //   return;
      // }

      // Sempre buscar da API (cache desabilitado)
      console.log('🌐 Sempre buscando da API (cache desabilitado)...');
      const freshLines = await fetchAllDataFromApi(state);
      
      console.log('💽 Salvando no cache:', freshLines);
      setDataSource(prev => ({ ...prev, lines: 'API' }));
      // Salvar no cache
      cacheService.set(cacheKey, freshLines, CACHE_TTL);
      
      setLines(freshLines);
      setHasAvailableData(freshLines.length > 0);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('💥 Erro ao carregar dados:', error);
      
      // CACHE TEMPORARIAMENTE DESABILITADO PARA TESTES
      // 1. Tentar usar dados do cache stale como fallback
      // const staleData = cacheService.getStale<LineData[]>(cacheKey);
      // if (staleData && staleData.length > 0) {
      //   console.log('🔄 Usando dados do cache (expirados) como fallback:', staleData);
      //   setDataSource(prev => ({ ...prev, lines: 'Cache' }));
      //   setLines(staleData);
      //   setHasAvailableData(true);
      //   setLastUpdate(new Date());
      //   setError('API fora do ar - exibindo dados da última atualização (cache)');
      //   return;
      // }
      
      // 3. Se nem cache nem JSON funcionaram, mostrar erro
      console.error('💥 Erro final: nenhuma fonte de dados disponível para', state);
      setError(error instanceof Error ? error.message : 'Erro ao carregar linhas');
      setLines([]);
      setHasAvailableData(false);
    } finally {
      setLoading(false);
    }
  }, [LINES_CACHE_KEY, CACHE_TTL]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Primeiro, buscar cidades disponíveis
        const availableCities = await fetchAvailableCities();
        setCities(availableCities);
        
        // Verificar se há dados no cache para qualquer cidade
        let foundCachedData = false;
        
        for (const city of availableCities) {
          const cacheKey = `${LINES_CACHE_KEY}_${city.state}`;
          const cachedData = cacheService.get<LineData[]>(cacheKey);
          
          if (cachedData && cachedData.length > 0) {
            setSelectedLocation(city.state.toLowerCase());
            setHasAvailableData(true);
            setLines(cachedData);
            setLastUpdate(new Date());
            foundCachedData = true;
            break;
          }
        }
        
        if (!foundCachedData) {
          // Sem dados no cache, mostrar "Selecione uma região"
          setHasAvailableData(false);
        }
        
      } catch (error) {
        console.error('💥 Erro ao inicializar app:', error);
        setError('Erro ao carregar dados das cidades disponíveis');
      } finally {
        setLoading(false);
      }
    };
    
    initializeApp();
  }, [LINES_CACHE_KEY]);

  useEffect(() => {
    if (selectedLocation) {
      const state = selectedLocation.toUpperCase();
      loadAllDataWithCache(state);
    }
  }, [selectedLocation, loadAllDataWithCache]);

  // Timer para atualizar as informações de tempo a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(timer);
  }, []);

  // Effect para detectar mudança de horário ativo e resetar interesse do anterior
  useEffect(() => {
    if (lines.length === 0) return;

    const currentDayOfWeek = getCurrentDayOfWeek();
    
    // Encontrar o próximo horário ativo de todas as linhas
    let currentActiveScheduleId: number | null = null;
    
    for (const line of lines) {
      const filteredSchedules = getFilteredSchedules(line, currentDayOfWeek);
      const nextScheduleId = getNextScheduleId(filteredSchedules, currentDayOfWeek);
      
      if (nextScheduleId) {
        currentActiveScheduleId = nextScheduleId;
        break; // Pegar apenas o primeiro horário ativo encontrado
      }
    }

    // Se mudou o horário ativo e havia um anterior, resetar o interesse do anterior
    if (currentActiveScheduleId !== previousActiveScheduleId) {
      if (previousActiveScheduleId && previousActiveScheduleId !== currentActiveScheduleId) {
        console.log(`🔄 Horário ativo mudou de ${previousActiveScheduleId} para ${currentActiveScheduleId}. Resetando interesse do anterior.`);
        resetScheduleInterest(previousActiveScheduleId);
      }
      
      // Atualizar o horário ativo anterior
      setPreviousActiveScheduleId(currentActiveScheduleId);
    }
  }, [lines, currentTime, previousActiveScheduleId]); // Executar quando linhas, tempo ou horário anterior mudarem

  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: number}>({});
  const [animatingLines, setAnimatingLines] = useState<Set<number>>(new Set());
  const [selectingDropdowns, setSelectingDropdowns] = useState<Set<number>>(new Set());
  const [changedDropdowns, setChangedDropdowns] = useState<Set<number>>(new Set());

  // Função para obter o dia da semana atual (1=Segunda, 2=Terça, etc.)
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Domingo, 1=Segunda, etc.
    
    // Converter para nosso formato: Segunda=1, Terça=2, etc.
    // Se for sábado (6) ou domingo (0), mostrar segunda-feira (1)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1; // Segunda-feira
    }
    return dayOfWeek; // 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta
  };

  // Função para obter o nome do dia atual em formato legível
  const getCurrentDayName = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const dayNames = {
      0: 'Domingo',
      1: 'Segunda-feira',
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado'
    };
    
    return dayNames[dayOfWeek as keyof typeof dayNames];
  };

  // Função para normalizar nome da linha para verificação MQTT
  const normalizarNomeLinha = (nomeLinhaOriginal: string): string => {
    return nomeLinhaOriginal
      .toLowerCase()
      .replace(/\s+/g, '') // Remove espaços
      .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
  };

  // Função para verificar se linha está ativa via MQTT
  const isLinhaAtivaMqtt = (linha: LineData): boolean => {
    const nomeNormalizado = normalizarNomeLinha(linha.name);
    const status = linhasStatus[nomeNormalizado];
    return status?.isActive || false;
  };

  // Função para obter capacidade da linha via MQTT
  const getCapacidadeLinha = (linha: LineData): { ocupados: number; total: number; disponiveis: number } => {
    const nomeNormalizado = normalizarNomeLinha(linha.name);
    const status = linhasStatus[nomeNormalizado];
    
    if (status?.isActive) {
      return {
        ocupados: status.assentosOcupados,
        total: status.capacidadeMaxima,
        disponiveis: status.assentosDisponiveis
      };
    }
    
    return { ocupados: 0, total: 46, disponiveis: 46 }; // Default
  };

  // Função para obter o nome completo da cidade
  const getCityDisplayName = (state: string) => {
    const cityNames: { [key: string]: string } = {
      'SP': 'São Paulo',
      'RJ': 'Rio de Janeiro', 
      'MG': 'Minas Gerais',
      'BA': 'Bahia'
    };
    return cityNames[state] || state;
  };

  // Função para obter o nome da cidade selecionada
  const getSelectedCityName = () => {
    if (!selectedLocation) return 'região';
    const city = cities.find(c => c.state.toLowerCase() === selectedLocation);
    return city ? getCityDisplayName(city.state) : selectedLocation.toUpperCase();
  };

  const toggleAccordion = (lineId: number) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const handleFilterChange = (lineId: number, dayWeek: number) => {
    // Marcar como animando
    setAnimatingLines(prev => new Set(prev).add(lineId));
    
    // Adicionar animação de "changed" para o dropdown
    setChangedDropdowns(prev => new Set(prev).add(lineId));
    
    // Atualizar filtros imediatamente para mostrar skeleton
    setTimeout(() => {
      setSelectedFilters(prev => ({
        ...prev,
        [lineId]: dayWeek
      }));
      
      // Remover animação após delay
      setTimeout(() => {
        setAnimatingLines(prev => {
          const newSet = new Set(prev);
          newSet.delete(lineId);
          return newSet;
        });
        
        // Remover animação do dropdown após um tempo
        setTimeout(() => {
          setChangedDropdowns(prev => {
            const newSet = new Set(prev);
            newSet.delete(lineId);
            return newSet;
          });
        }, 400); // Tempo da animação selectBounce
        
      }, 500); // Aumentei o tempo para ver melhor a animação
    }, 100); // Reduzido para começar mais rápido
  };

  // Handlers para animações do dropdown
  const handleDropdownFocus = (lineId: number) => {
    setSelectingDropdowns(prev => new Set(prev).add(lineId));
  };

  const handleDropdownBlur = (lineId: number) => {
    setTimeout(() => {
      setSelectingDropdowns(prev => {
        const newSet = new Set(prev);
        newSet.delete(lineId);
        return newSet;
      });
    }, 200); // Pequeno delay para manter a animação durante a seleção
  };

  // Converter day_week número para string legível
  const getDayWeekString = (dayWeek: number) => {
    const days = {
      1: 'Segunda-feira',
      2: 'Terça-feira', 
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira'
    };
    return days[dayWeek as keyof typeof days] || 'Dia inválido';
  };

  // Filtrar horários por dia da semana
  const getFilteredSchedules = (line: LineData, selectedDayWeek?: number) => {
    console.log('🔍 getFilteredSchedules chamada:', {
      lineName: line.name,
      selectedDayWeek,
      totalSchedules: line.schedules.length,
      schedulesDays: line.schedules.map(s => ({ id: s.id, day: s.day_week, time: s.arrival_time })),
      currentDayOfWeek: getCurrentDayOfWeek()
    });
    
    let schedules = line.schedules;
    
    if (selectedDayWeek) {
      schedules = line.schedules.filter(schedule => {
        const match = schedule.day_week === selectedDayWeek;
        console.log(`🔄 Comparando: schedule.day_week (${schedule.day_week}) === selectedDayWeek (${selectedDayWeek}) = ${match}`);
        return match;
      });
      console.log('📋 Schedules filtrados:', schedules.length, 'para dia', selectedDayWeek);
    } else {
      console.log('📋 Retornando todos os schedules (sem filtro)');
    }
    
    // Ordenar todos os schedules por horário de partida de forma crescente
    schedules.sort((a, b) => {
      const timeA = timeToMinutes(a.arrival_time);
      const timeB = timeToMinutes(b.arrival_time);
      return timeA - timeB;
    });
    
    return schedules;
  };

  // Converter time string para formato HH:MM
  const formatTime = (timeString: string | any) => {
    let timeStr = String(timeString);
    
    if (timeStr.includes(':')) {
      // Se já está no formato HH:MM:SS, pegar apenas HH:MM
      const parts = timeStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  // Funções de debug do cache
  const downloadCacheData = () => {
    const cacheData = cacheService.exportToJson();
    const blob = new Blob([cacheData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCacheStatus = () => {
    return cacheService.getCacheStatus();
  };

  const clearAllCache = () => {
    cacheService.clear();
    setLines([]);
    setCities([]);
    setHasAvailableData(false);
    setError('Cache limpo - recarregue a página');
  };

  // Função simplificada para debug do cache
  const toggleCacheDebug = async () => {
    setShowCacheDebug(!showCacheDebug);
  };

  // Função para converter horário string em minutos do dia
  const timeToMinutes = (timeString: string | any) => {
    // Verificar se é um object time da API (formato: "HH:MM:SS") ou string simples
    let timeStr = timeString;
    if (typeof timeString === 'object' && timeString !== null) {
      // Se for um objeto time da API, converter para string
      timeStr = String(timeString);
    }
    
    // Garantir que é string
    if (typeof timeStr !== 'string') {
      timeStr = String(timeStr);
    }
    
    // Extrair apenas HH:MM se vier com segundos
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      return hours * 60 + minutes;
    }
    
    return 0; // Fallback se não conseguir converter
  };

  // Função para encontrar o próximo horário disponível baseado na hora atual REAL
  const getNextScheduleId = (schedules: Schedule[], selectedDay: number): number | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde meia-noite
    const currentDayOfWeek = getCurrentDayOfWeek(); // 1=Segunda, 2=Terça, etc.
    const realCurrentDay = now.getDay(); // 0=Domingo, 1=Segunda, etc.

    console.log('🕒 Hora atual:', `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`, `(${currentTime} minutos)`);
    console.log('📅 Dia da semana real:', realCurrentDay, '| getCurrentDayOfWeek():', currentDayOfWeek, '| Dia selecionado:', selectedDay);

    // Filtrar horários para o dia selecionado
    let relevantSchedules = schedules.filter(schedule => {
      return schedule.day_week === selectedDay;
    });

    if (relevantSchedules.length === 0) {
      console.log('⚠️ Nenhum horário encontrado para o dia selecionado');
      return null;
    }

    console.log('📋 Horários do dia:', relevantSchedules.map(s => ({
      id: s.id,
      time: s.arrival_time,
      minutes: timeToMinutes(s.arrival_time)
    })));

    // Ordenar por horário de partida
    relevantSchedules.sort((a, b) => {
      const timeA = timeToMinutes(a.arrival_time);
      const timeB = timeToMinutes(b.arrival_time);
      return timeA - timeB;
    });

    // Se for o dia atual REAL, encontrar o próximo horário que ainda não passou
    if (realCurrentDay === selectedDay) {
      const nextSchedule = relevantSchedules.find(schedule => {
        const scheduleTime = timeToMinutes(schedule.arrival_time);
        return scheduleTime > currentTime;
      });

      if (nextSchedule) {
        const nextTime = timeToMinutes(nextSchedule.arrival_time);
        const nextHour = Math.floor(nextTime / 60);
        const nextMinute = nextTime % 60;
        console.log('✅ Próximo horário encontrado:', `${nextHour}:${nextMinute.toString().padStart(2, '0')}`, '(ID:', nextSchedule.id, ')');
        return nextSchedule.id;
      } else {
        console.log('🚫 Todos os horários de hoje já passaram - não destacar nenhum como PRÓXIMO');
        return null;
      }
    }

    // Se não for o dia atual, não há próximo horário para destacar hoje
    console.log('📅 Não é o dia atual - não destacar nenhum horário como PRÓXIMO');
    return null;
  };

  // Função para calcular tempo restante até próximo horário e status do ônibus
  const getTimeUntilNext = (schedules: Schedule[], selectedDay: number) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDayOfWeek = getCurrentDayOfWeek();
    const realCurrentDay = now.getDay(); // 0=Domingo, 1=Segunda, etc.
    
    console.log(`🗓️ Debug tempo: Hoje real=${realCurrentDay} (${['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][realCurrentDay]}), getCurrentDayOfWeek()=${currentDayOfWeek}, selectedDay=${selectedDay}`);
    
    // Filtrar horários do dia selecionado
    const relevantSchedules = schedules.filter(schedule => schedule.day_week === selectedDay);
    
    if (relevantSchedules.length === 0) {
      return { text: 'Sem horários', type: 'no-schedule' };
    }

    // Se for o dia selecionado E for realmente hoje
    if (realCurrentDay === selectedDay) {
      // Verificar se há algum ônibus no local ou próximo
      for (const schedule of relevantSchedules) {
        const arrivalTime = timeToMinutes(schedule.arrival_time);
        const departureTime = timeToMinutes(schedule.departure_time);
        
        // Ônibus está no local (entre arrival e departure)
        if (currentTime >= arrivalTime && currentTime <= departureTime) {
          return { text: 'Ônibus no local', type: 'at-location' };
        }
        
        // Próximo horário que ainda não partiu
        if (departureTime > currentTime) {
          const minutesUntil = departureTime - currentTime;
          const hours = Math.floor(minutesUntil / 60);
          const mins = minutesUntil % 60;
          
          // Determinar se é urgente (15 minutos ou menos)
          const isUrgent = minutesUntil <= 15;
          
          if (hours > 0) {
            return { text: `${hours}h ${mins}m`, type: isUrgent ? 'countdown-urgent' : 'countdown' };
          } else {
            return { text: `${mins} min`, type: isUrgent ? 'countdown-urgent' : 'countdown' };
          }
        }
      }
      
      // Se chegou aqui, todos os horários do dia já passaram
      return { text: 'Sem horários hoje', type: 'no-schedule-today' };
    }
    
    // Se não é o dia atual ou todos os horários já passaram
    // Calcular para o próximo dia que tem esse dia da semana
    const firstSchedule = relevantSchedules[0];
    if (firstSchedule) {
      const scheduleTime = timeToMinutes(firstSchedule.arrival_time);
      
      // Calcular dias até o próximo dia da semana usando o dia real
      let daysUntil = (selectedDay - realCurrentDay + 7) % 7;
      if (daysUntil === 0 && realCurrentDay === selectedDay) {
        // Se for o mesmo dia mas todos os horários passaram, vai para a próxima semana
        daysUntil = 7;
      }
      
      console.log(`📅 Calculando futuro: selectedDay=${selectedDay}, realCurrentDay=${realCurrentDay}, daysUntil=${daysUntil}`);
      
      const totalMinutes = (daysUntil * 24 * 60) + scheduleTime - currentTime;
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      const minutes = totalMinutes % 60;
      
      if (days > 0) {
        return { text: `${days}d ${hours}h`, type: 'future' };
      } else if (hours > 0) {
        return { text: `${hours}h ${minutes}m`, type: 'countdown' };
      } else {
        // Determinar se é urgente (15 minutos ou menos)
        const isUrgent = totalMinutes <= 15;
        return { text: `${minutes} min`, type: isUrgent ? 'countdown-urgent' : 'countdown' };
      }
    }
    
    return { text: 'Sem horários', type: 'no-schedule' };
  };

  const refreshSchedules = () => {
    // Só recarregar se há uma localização selecionada
    if (!selectedLocation) {
      alert('Por favor, selecione uma região primeiro.');
      return;
    }
    
    // Resetar rastreamento de fonte para forçar nova busca
    setDataSource({ cities: null, lines: null });
    
    // Como cache está desabilitado, apenas recarregar
    const state = selectedLocation.toUpperCase();
    // const cacheKey = `${LINES_CACHE_KEY}_${state}`;
    // cacheService.delete(cacheKey); // Cache desabilitado
    loadAllDataWithCache(state);
  };

  const testApiConnection = async () => {
    console.log('🧪 Testando conexão direta com a API...');
    
    if (!selectedLocation) {
      alert('Por favor, selecione uma região primeiro.');
      return;
    }
    
    try {
      const state = selectedLocation.toUpperCase();
      const url = `http://localhost:8000/lines?state=${state}`;
      const response = await fetch(url);
      console.log('📡 Resposta fetch direta:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Dados recebidos via fetch direto:', data);
        alert(`✅ API conectada! Encontradas ${data.length} linhas para ${getSelectedCityName()}`);
      } else {
        alert(`❌ Erro na API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Erro no teste de conexão:', error);
      alert(`💥 Erro de conexão: ${error}`);
    }
  };

  // Função para resetar o interesse de um schedule específico
  const resetScheduleInterest = async (scheduleId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interest: 0
        })
      });

      if (response.ok) {
        console.log(`✅ Interesse resetado para schedule ID ${scheduleId}`);
        
        // Atualizar o estado local para refletir a mudança
        setLines(prevLines => 
          prevLines.map(line => ({
            ...line,
            schedules: line.schedules.map(schedule =>
              schedule.id === scheduleId 
                ? { ...schedule, interest: 0 }
                : schedule
            )
          }))
        );
      } else {
        console.error(`❌ Erro ao resetar interesse do schedule ${scheduleId}:`, response.status);
      }
    } catch (error) {
      console.error(`💥 Erro ao resetar interesse do schedule ${scheduleId}:`, error);
    }
  };

  // Função para verificar se há próximos horários da semana atual
  const hasUpcomingSchedules = () => {
    const currentDayOfWeek = getCurrentDayOfWeek();
    const realCurrentDay = new Date().getDay(); // 0=Domingo, 1=Segunda, etc.
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    console.log(`🔍 hasUpcomingSchedules - Dia real: ${realCurrentDay}, getCurrentDayOfWeek: ${currentDayOfWeek}`);
    
    for (const line of lines) {
      // Usar o dia real em vez do processado
      const filteredSchedules = line.schedules.filter(schedule => schedule.day_week === realCurrentDay);
      
      for (const schedule of filteredSchedules) {
        const arrivalTime = timeToMinutes(schedule.arrival_time);
        
        // Se há pelo menos um horário futuro
        if (arrivalTime > currentTime) {
          console.log(`✅ Encontrou horário futuro: linha ${line.name}, horário ${schedule.arrival_time}`);
          return true;
        }
      }
    }
    
    console.log(`❌ Nenhum horário futuro encontrado para hoje (dia ${realCurrentDay})`);
    return false;
  };

  // Função para verificar se uma linha específica tem fila habilitada
  const isFilaHabilitada = (line: LineData): boolean => {
    // Primeiro verifica se há ônibus ativo via MQTT
    const mqttAtivo = isLinhaAtivaMqtt(line);
    if (mqttAtivo) {
      console.log(`🚌 Linha ${line.name} tem ônibus ativo via MQTT`);
      return true;
    }

    // Se não há MQTT, verifica se há horários futuros hoje
    const realCurrentDay = new Date().getDay();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const filteredSchedules = line.schedules.filter(schedule => schedule.day_week === realCurrentDay);
    
    for (const schedule of filteredSchedules) {
      const arrivalTime = timeToMinutes(schedule.arrival_time);
      if (arrivalTime > currentTime) {
        console.log(`📅 Linha ${line.name} tem horário futuro: ${schedule.arrival_time}`);
        return true;
      }
    }
    
    console.log(`❌ Linha ${line.name} sem fila habilitada`);
    return false;
  };

  // Função para navegar para a fila do próximo horário da semana atual
  const navigateToActiveQueue = () => {
    const currentDayOfWeek = getCurrentDayOfWeek();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextSchedule: any = null;
    let nextScheduleLine: any = null;
    let minTimeDiff = Infinity;
    
    // Procurar pelo próximo horário da semana atual
    for (const line of lines) {
      const filteredSchedules = line.schedules.filter(schedule => schedule.day_week === currentDayOfWeek);
      
      // Verificar cada horário da linha para encontrar o próximo
      for (const schedule of filteredSchedules) {
        const arrivalTime = timeToMinutes(schedule.arrival_time);
        
        // Verificar se este horário é futuro (ainda não chegou)
        if (arrivalTime > currentTime) {
          const timeDiff = arrivalTime - currentTime;
          
          // Se este é o próximo horário mais próximo
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            nextSchedule = schedule;
            nextScheduleLine = line;
          }
        }
      }
    }
    
    // Se encontrou o próximo horário, navegar para a fila
    if (nextSchedule && nextScheduleLine) {
      const params = new URLSearchParams({
        linha: nextScheduleLine.id.toString(),
        nome: encodeURIComponent(nextScheduleLine.name),
        horario: nextSchedule.arrival_time,
        scheduleId: nextSchedule.id.toString()
      });
      
      router.push(`/fila?${params.toString()}`);
      return;
    }
    
    // Se não encontrou nenhum próximo horário hoje
    alert('Não há próximos horários hoje. A fila está disponível apenas para horários futuros da semana atual.');
  };

  // Função para navegar para a fila de uma linha específica
  const navigateToLineQueue = (line: LineData) => {
    const currentDayOfWeek = getCurrentDayOfWeek();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Filtrar horários da linha específica para o dia atual
    const filteredSchedules = line.schedules.filter(schedule => schedule.day_week === currentDayOfWeek);
    
    // Encontrar o próximo horário desta linha específica
    let nextSchedule: any = null;
    let minTimeDiff = Infinity;
    
    for (const schedule of filteredSchedules) {
      const arrivalTime = timeToMinutes(schedule.arrival_time);
      
      // Verificar se este horário é futuro (ainda não chegou)
      if (arrivalTime > currentTime) {
        const timeDiff = arrivalTime - currentTime;
        
        // Se este é o próximo horário mais próximo desta linha
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          nextSchedule = schedule;
        }
      }
    }
    
    // Se encontrou o próximo horário da linha, navegar para a fila
    if (nextSchedule) {
      const params = new URLSearchParams({
        linha: line.id.toString(),
        nome: encodeURIComponent(line.name),
        horario: nextSchedule.arrival_time,
        scheduleId: nextSchedule.id.toString()
      });
      
      console.log(`🚌 Navegando para fila da linha ${line.name}, schedule ID: ${nextSchedule.id}`);
      router.push(`/fila?${params.toString()}`);
      return;
    }
    
    // Se não encontrou nenhum próximo horário para esta linha hoje
    alert(`Não há próximos horários hoje para a linha ${line.name}. A fila está disponível apenas para horários futuros da semana atual.`);
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
          <p>Erro ao carregar linhas: {error}</p>
          <button onClick={refreshSchedules} className={styles.refreshButton}>
            Tentar novamente
          </button>
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
            <option value="">Selecione uma região</option>
            {cities.map((city) => (
              <option key={city.id} value={city.state.toLowerCase()}>
                {getCityDisplayName(city.state)} ({city.state})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.perfilUsuario}>
          <span className="material-symbols-outlined">account_circle</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.refreshContainer}>
          
          {lastUpdate && (
            <p className={styles.lastUpdate}>
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <div className={styles.debugInfo}>
              <p>Debug: Linhas carregadas: {lines.length}</p>
              <p>Cache ativo: {cacheService.has(LINES_CACHE_KEY) ? 'Sim' : 'Não'}</p>
              <p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Fonte Cidades: 
                  {dataSource.cities === 'API' && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🌐 API</span>}
                  {dataSource.cities === 'Cache' && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>💾 Cache</span>}
                  {dataSource.cities === 'Backup' && <span style={{ color: '#ea580c', fontWeight: 'bold' }}>📁 Backup</span>}
                  {!dataSource.cities && <span style={{ color: '#6b7280' }}>-</span>}
                </span>
              </p>
              <p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Fonte Linhas: 
                  {dataSource.lines === 'API' && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🌐 API</span>}
                  {dataSource.lines === 'Cache' && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>💾 Cache</span>}
                  {dataSource.lines === 'Backup' && <span style={{ color: '#ea580c', fontWeight: 'bold' }}>📁 Backup</span>}
                  {!dataSource.lines && <span style={{ color: '#6b7280' }}>-</span>}
                </span>
              </p>
              <p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  MQTT Status: 
                  {mqttConnected && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🔗 Conectado</span>}
                  {!mqttConnected && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>❌ Desconectado</span>}
                  {connectionError && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>({connectionError})</span>}
                </span>
              </p>
              <p>Linhas MQTT Ativas: {Object.keys(linhasStatus).filter(linha => linhasStatus[linha].isActive).length}</p>
              {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
            </div>
          )}
        </div>

        {!selectedLocation ? (
          <div className={styles.noLinesMessage}>
            <p>Selecione uma região para ver as linhas disponíveis.</p>
          </div>
        ) : lines.length === 0 ? (
          <div className={styles.noLinesMessage}>
            <p>Nenhuma linha disponível no momento para a região selecionada.</p>
            <p>Verifique se o servidor da API está rodando em localhost:8000</p>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={refreshSchedules} className={styles.refreshButton}>
                <span className="material-symbols-outlined">refresh</span>
                Recarregar
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button onClick={testApiConnection} className={styles.refreshButton} style={{ marginLeft: '10px' }}>
                  🧪 Testar API
                </button>
              )}
            </div>
          </div>
        ) : (
          lines.map((line) => {
            const selectedDayWeek = selectedFilters[line.id] || getCurrentDayOfWeek(); // Default para dia atual
            const filteredSchedules = getFilteredSchedules(line, selectedDayWeek);
            const isExpanded = expandedLines.has(line.id);
            const isAnimating = animatingLines.has(line.id);
            const nextScheduleId = getNextScheduleId(filteredSchedules, selectedDayWeek); // Encontrar próximo horário
            const timeInfo = getTimeUntilNext(filteredSchedules, selectedDayWeek); // Obter informações de tempo

            return (
              <div key={line.id} className={`${styles.acordeaoItem} ${isAnimating ? styles.acordeaoItemAnimating : ''}`}>
                <button 
                  className={`${styles.acordeaoGatilho} ${isExpanded ? styles.ativo : ''}`}
                  onClick={() => toggleAccordion(line.id)}
                >
                  <div className={styles.linhaInfo}>
                    <Image src="/icone_onibus.png" alt="Ícone Ônibus" width={24} height={24} className={styles.iconeOnibusPreto} />
                    <span>LINHA - {line.name.toUpperCase()}</span>
                  </div>
                  <span className={`material-symbols-outlined ${styles.chevron}`}>
                    expand_more
                  </span>
                </button>

                <div 
                  className={`${styles.acordeaoConteudo} ${isAnimating ? styles.animating : ''}`}
                  style={{ 
                    maxHeight: isExpanded ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.5s ease-out'
                  }}
                >
                  <div className={styles.cardHorarios}>
                    <div className={styles.colunaEsquerda}>
                      <div className={styles.abas}>
                        <a href="#" className={styles.abaAtiva}>Horários</a>
                        {isFilaHabilitada(line) && (
                          <a href="#" onClick={(e) => { e.preventDefault(); navigateToLineQueue(line); }}>Fila</a>
                        )}
                      </div>

                      <div className={`${styles.listaHorarios} ${isAnimating ? styles.horariosAnimating : ''}`}>
                        {isAnimating ? (
                          <div className={styles.loadingSchedules}>
                            <div className={styles.schedulesSkeleton}>
                              <div className={styles.skeletonItem}></div>
                              <div className={styles.skeletonItem}></div>
                              <div className={styles.skeletonItem}></div>
                            </div>
                          </div>
                        ) : filteredSchedules.length === 0 ? (
                          <div className={styles.noSchedulesMessage}>
                            <p>Nenhum horário disponível para {getDayWeekString(selectedDayWeek)}</p>
                          </div>
                        ) : (
                          filteredSchedules.map((schedule, index) => {
                            const isNextSchedule = schedule.id === nextScheduleId;
                            return (
                              <div key={schedule.id} className={styles.horarioItem}>
                                <div
                                  className={`${styles.scheduleTime} ${isNextSchedule ? styles.nextSchedule : styles.availableSchedule}`}
                                >
                                  {formatTime(schedule.arrival_time)}
                                  {isNextSchedule && schedule.interest > 0 && (
                                    <span className={styles.interestBadge}>
                                      {schedule.interest} interessado{schedule.interest !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {isNextSchedule && (
                                    <span className={styles.nextIndicator}>PRÓXIMO</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className={styles.colunaDireita}>
                      <select 
                        className={styles.filtroDia}
                        value={selectedDayWeek}
                        onChange={(e) => handleFilterChange(line.id, parseInt(e.target.value))}
                        onFocus={() => handleDropdownFocus(line.id)}
                        onBlur={() => handleDropdownBlur(line.id)}
                        disabled={isAnimating}
                        data-selecting={selectingDropdowns.has(line.id) ? "true" : "false"}
                        data-changed={changedDropdowns.has(line.id) ? "true" : "false"}
                      >
                        <option value={1}>Segunda-feira</option>
                        <option value={2}>Terça-feira</option>
                        <option value={3}>Quarta-feira</option>
                        <option value={4}>Quinta-feira</option>
                        <option value={5}>Sexta-feira</option>
                      </select>

                      <div className={`${styles.infoTempo} ${
                        timeInfo.type === 'at-location' ? styles.infoTempoAtLocal : 
                        timeInfo.type === 'countdown' ? styles.infoTempoCountdown :
                        timeInfo.type === 'countdown-urgent' ? styles.infoTempoCountdownUrgent :
                        timeInfo.type === 'no-schedule-today' ? styles.infoTempoNoSchedule : ''
                      }`}>
                        <Image src="/icone_onibus.png" alt="Ônibus" width={50} height={50} />
                        <span>
                          {timeInfo.type === 'at-location' ? 'Ônibus no local' :
                           timeInfo.type === 'countdown' ? `Próximo em ${timeInfo.text}` :
                           timeInfo.type === 'countdown-urgent' ? `Próximo em ${timeInfo.text}` :
                           timeInfo.type === 'no-schedule-today' ? 'Sem horários hoje' :
                           timeInfo.type === 'future' ? `Próximo: ${timeInfo.text}` :
                           '❌ Sem horários'}
                        </span>
                      </div>
                      
                      {/* Status MQTT */}
                      {isLinhaAtivaMqtt(line) && (
                        <div style={{
                          background: '#e8f5e9',
                          border: '1px solid #4caf50',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>🚌 Ônibus Ativo</span>
                            <span style={{ 
                              background: '#4caf50', 
                              color: 'white', 
                              padding: '0.125rem 0.5rem', 
                              borderRadius: '12px', 
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>MQTT</span>
                          </div>
                          {(() => {
                            const capacidade = getCapacidadeLinha(line);
                            return (
                              <div style={{ color: '#2e7d32' }}>
                                <strong>{capacidade.disponiveis}</strong> assentos disponíveis 
                                ({capacidade.ocupados}/{capacidade.total})
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Seção de Debug do Cache */}
      <div hidden style={{ 
        position: 'fixed', 
        bottom: '80px', 
        right: '20px', 
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <button 
          onClick={toggleCacheDebug}
          style={{ 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '4px',
            marginBottom: '5px'
          }}
        >
          {showCacheDebug ? '🔽 File Backup Debug' : '🔼 File Backup Debug'}
        </button>
        
        {showCacheDebug && (
          <div style={{ maxWidth: '350px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Status do Cache:</strong>
              <pre style={{ 
                fontSize: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '5px', 
                borderRadius: '4px',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                {JSON.stringify(getCacheStatus(), null, 2)}
              </pre>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong>Status do Backup Arquivo:</strong>
              <pre style={{ 
                fontSize: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '5px', 
                borderRadius: '4px',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                'N/A'
              </pre>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', marginBottom: '5px' }}>
                <strong>Cache Actions:</strong>
              </div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                <button 
                  onClick={downloadCacheData}
                  style={{ 
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}
                >
                  📥 Cache
                </button>
                
                <button 
                  onClick={clearAllCache}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}
                >
                  🗑️ Cache
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', marginBottom: '5px' }}>
                <strong>JSON Backup Actions:</strong>
              </div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {}}
                  style={{ 
                    background: '#17a2b8', 
                    color: 'white', 
                    border: 'none', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}
                >
                  � JSON
                </button>
                
                <button 
                  onClick={() => {}}
                  style={{ 
                    background: '#ffc107', 
                    color: 'black', 
                    border: 'none', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}
                >
                  📁 Load JSON
                </button>
                
                <button 
                  onClick={() => {}}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '9px'
                  }}
                >
                  🗑️ JSON
                </button>
              </div>
            </div>

            <div>
              <button 
                onClick={() => window.location.reload()}
                style={{ 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '4px',
                  fontSize: '10px',
                  width: '100%'
                }}
              >
                🔄 Recarregar Página
              </button>
            </div>
          </div>
        )}
      </div>

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
