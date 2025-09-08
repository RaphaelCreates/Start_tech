'use client';

// Serviço para interagir com a API de rotas
export interface IniciarRotaPayload {
  motorista_id: string;
  linha: string;
  prefixo: string;
  capacidade: number;
}

export interface IniciarRotaResponse {
  success: boolean;
  message: string;
  data: {
    motorista_id: string;
    linha: string;
    prefixo: string;
    capacidade: number;
    timestamp: string;
    status: string;
    wasAlreadyActive?: boolean;
    assentosOcupados?: number;
    assentosDisponiveis?: number;
  };
}

export interface StatusLinhaResponse {
  success: boolean;
  data: {
    linha: string;
    isActive: boolean;
    motorista_id?: string;
    prefixo?: string;
    capacidade?: number;
    assentosOcupados?: number;
    assentosDisponiveis?: number;
    timestamp?: string;
    message?: string;
  };
}

export interface StatusTodasLinhasResponse {
  success: boolean;
  data: {
    totalLinhasAtivas: number;
    linhas: Array<{
      linha: string;
      isActive: boolean;
      motorista_id: string;
      prefixo: string;
      capacidade: number;
      assentosOcupados: number;
      assentosDisponiveis: number;
      timestamp: string;
    }>;
  };
}

class RotaService {
  private baseUrl = '/api/rota';

  async iniciarRota(payload: IniciarRotaPayload): Promise<IniciarRotaResponse> {
    try {
      console.log('🚀 Enviando requisição para iniciar rota:', payload);

      const response = await fetch(`${this.baseUrl}/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Rota iniciada com sucesso:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao iniciar rota:', error);
      throw error;
    }
  }

  // Método para consultar status de uma linha específica
  async consultarStatusLinha(linha: string): Promise<StatusLinhaResponse> {
    try {
      console.log('🔍 Consultando status da linha:', linha);

      const response = await fetch(`${this.baseUrl}/iniciar?linha=${encodeURIComponent(linha)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Status da linha consultado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao consultar status da linha:', error);
      throw error;
    }
  }

  // Método para consultar status de todas as linhas
  async consultarTodasLinhas(): Promise<StatusTodasLinhasResponse> {
    try {
      console.log('🔍 Consultando status de todas as linhas');

      const response = await fetch(`${this.baseUrl}/iniciar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Status de todas as linhas consultado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao consultar status de todas as linhas:', error);
      throw error;
    }
  }

  // Método para validar se uma linha é suportada
  isLinhaSuportada(linha: string): boolean {
    const linhasSuportadas = ['l_santana', 'l_barrafunda', 'santana', 'barrafunda'];
    return linhasSuportadas.some(l => 
      linha.toLowerCase().includes(l.toLowerCase()) || 
      l.toLowerCase().includes(linha.toLowerCase())
    );
  }

  // Método para normalizar nome da linha
  normalizarLinha(linha: string): string {
    const mapeamento: { [key: string]: string } = {
      'santana': 'l_santana',
      'l_santana': 'l_santana',
      'barrafunda': 'l_barrafunda',
      'barra_funda': 'l_barrafunda',
      'l_barrafunda': 'l_barrafunda'
    };

    const linhaNormalizada = linha.toLowerCase().replace(/[^a-z_]/g, '');
    return mapeamento[linhaNormalizada] || linha;
  }
}

export const rotaService = new RotaService();
