// Service para integrar com a API backend de status das linhas
// O campo 'active' indica se há um motorista fazendo a rota ou não
'use client';

export interface LineStatusResponse {
  id: number;
  name: string;
  active: boolean; // true = motorista fazendo a rota, false = sem motorista
  created_at?: string;
  updated_at?: string;
}

export interface LineStatusUpdate {
  active: boolean; // true = iniciar rota com motorista, false = finalizar rota
}

class BackendLineStatusService {
  private baseUrl = 'http://localhost:8000';

  // GET /{line_id}/status - Consultar status de uma linha específica
  async getLineStatus(lineId: number): Promise<LineStatusResponse> {
    try {
      console.log(`🔍 [BackendLineStatus] Consultando status da linha ${lineId}...`);

      const response = await fetch(`${this.baseUrl}/lines/${lineId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [BackendLineStatus] Status da linha ${lineId}:`, data);
      
      return data;

    } catch (error) {
      console.error(`❌ [BackendLineStatus] Erro ao consultar status da linha ${lineId}:`, error);
      throw error;
    }
  }

  // PATCH /{line_id}/status - Atualizar status de uma linha (iniciar/finalizar rota)
  async updateLineStatus(lineId: number, active: boolean): Promise<LineStatusResponse> {
    try {
      const acao = active ? 'iniciando' : 'finalizando';
      console.log(`🔄 [BackendLineStatus] ${acao} rota da linha ${lineId}...`);

      const statusUpdate: LineStatusUpdate = { active };

      const response = await fetch(`${this.baseUrl}/lines/${lineId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const status = active ? 'iniciada' : 'finalizada';
      console.log(`✅ [BackendLineStatus] Rota da linha ${lineId} ${status}:`, data);
      
      return data;

    } catch (error) {
      console.error(`❌ [BackendLineStatus] Erro ao atualizar linha ${lineId}:`, error);
      throw error;
    }
  }

  // Método conveniente para iniciar rota (motorista começa)
  async iniciarRota(lineId: number): Promise<LineStatusResponse> {
    return this.updateLineStatus(lineId, true);
  }

  // Método conveniente para finalizar rota (motorista termina)
  async finalizarRota(lineId: number): Promise<LineStatusResponse> {
    return this.updateLineStatus(lineId, false);
  }

  // Método para mapear nome da linha para ID (pode ser personalizado conforme sua base)
  getLineIdByName(lineName: string): number | null {
    const lineMapping: { [key: string]: number } = {
      'santana': 1,
      'l_santana': 1,
      'barrafunda': 2,
      'l_barrafunda': 2,
      'barra_funda': 2
    };

    const normalizedName = lineName.toLowerCase().trim();
    return lineMapping[normalizedName] || null;
  }

  // Método para iniciar rota por nome da linha
  async iniciarRotaPorNome(lineName: string): Promise<LineStatusResponse | null> {
    const lineId = this.getLineIdByName(lineName);
    
    if (lineId === null) {
      console.warn(`⚠️ [BackendLineStatus] Linha não encontrada: ${lineName}`);
      return null;
    }

    return this.iniciarRota(lineId);
  }

  // Método para finalizar rota por nome da linha
  async finalizarRotaPorNome(lineName: string): Promise<LineStatusResponse | null> {
    const lineId = this.getLineIdByName(lineName);
    
    if (lineId === null) {
      console.warn(`⚠️ [BackendLineStatus] Linha não encontrada: ${lineName}`);
      return null;
    }

    return this.finalizarRota(lineId);
  }

  // Método para consultar se há motorista na rota por nome
  async temMotorista(lineName: string): Promise<boolean> {
    const lineId = this.getLineIdByName(lineName);
    
    if (lineId === null) {
      console.warn(`⚠️ [BackendLineStatus] Linha não encontrada: ${lineName}`);
      return false;
    }

    try {
      const status = await this.getLineStatus(lineId);
      return status.active; // true = tem motorista, false = sem motorista
    } catch (error) {
      console.error(`❌ [BackendLineStatus] Erro ao verificar motorista na linha ${lineName}:`, error);
      return false;
    }
  }
}

export const backendLineStatusService = new BackendLineStatusService();
