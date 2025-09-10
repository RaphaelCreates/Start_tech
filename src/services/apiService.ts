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
  lines: LineData[];
}

interface BusData {
  capacity: number;
  occupied: number;
  prefix: number;
  active_line_id: number;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiService {
  private baseUrl = 'http://localhost:8000';

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`Fazendo requisição para: ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      console.log(`Resposta recebida: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Dados recebidos:`, data);
      return { data };
    } catch (error) {
      console.error(`Erro ao fazer requisição para ${fullUrl}:`, error);
      return { 
        data: [] as unknown as T, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async getLines(state?: string): Promise<ApiResponse<LineData[]>> {
    const url = state ? `/lines/?state=${state}` : '/lines/';
    return this.makeRequest<LineData[]>(url);
  }

  async getCities(): Promise<ApiResponse<CityData[]>> {
    return this.makeRequest<CityData[]>('/city/');
  }

  async getLineSchedules(lineId: number): Promise<ApiResponse<Schedule[]>> {
    return this.makeRequest<Schedule[]>(`/lines/${lineId}/schedules/`);
  }

  async getAllSchedules(): Promise<ApiResponse<Schedule[]>> {
    return this.makeRequest<Schedule[]>('/schedules/');
  }

  async updateScheduleInterest(scheduleId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/schedules/interest/${scheduleId}/`, {
      method: 'PATCH',
    });
  }

  async getBusByPrefix(busPrefix: number): Promise<ApiResponse<BusData>> {
    return this.makeRequest<BusData>(`/bus/${busPrefix}`);
  }

  async getLineBuses(lineId: number): Promise<ApiResponse<BusData[]>> {
    return this.makeRequest<BusData[]>(`/lines/${lineId}/buses`);
  }

  // Método para verificar se a API está online
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/docs`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Método para buscar dados completos (cidades com linhas e horários)
  async getCompleteData(): Promise<ApiResponse<CityData[]>> {
    try {
      const citiesResponse = await this.getCities();
      if (citiesResponse.error) {
        return citiesResponse;
      }

      // Se as cidades já vêm com linhas e horários completos, retornar diretamente
      return citiesResponse;
    } catch (error) {
      console.error('Erro ao buscar dados completos:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}

export const apiService = new ApiService();

// Exportar interfaces para uso em outros arquivos
export type { BusData, LineData, CityData, Schedule, ApiResponse };
