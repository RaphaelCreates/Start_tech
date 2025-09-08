// Service para integrar chamadas da API de rota com o sistema MQTT
import { rotaService } from './rotaService';

interface IniciarRotaParams {
  motorista_id: string;
  linha: string;
  prefixo: string;
  capacidade: number;
}

interface RotaIntegrationCallbacks {
  onRotaIniciada?: (linha: string, capacidade: number) => void;
  onError?: (error: string) => void;
}

class RotaIntegrationService {
  private callbacks: RotaIntegrationCallbacks = {};

  // Configura callbacks para integração com MQTT
  setCallbacks(callbacks: RotaIntegrationCallbacks) {
    this.callbacks = callbacks;
  }

  // Consulta se uma linha está ativa
  async consultarStatusLinha(linha: string): Promise<boolean> {
    try {
      const resultado = await rotaService.consultarStatusLinha(linha);
      return resultado.data.isActive;
    } catch (error) {
      console.error('❌ [RotaIntegrationService] Erro ao consultar status da linha:', error);
      return false;
    }
  }

  // Consulta todas as linhas ativas
  async consultarLinhasAtivas(): Promise<string[]> {
    try {
      const resultado = await rotaService.consultarTodasLinhas();
      return resultado.data.linhas
        .filter(linha => linha.isActive)
        .map(linha => linha.linha);
    } catch (error) {
      console.error('❌ [RotaIntegrationService] Erro ao consultar linhas ativas:', error);
      return [];
    }
  }

  // Inicia uma rota via API e integra com o sistema local
  async iniciarRota(params: IniciarRotaParams): Promise<boolean> {
    try {
      console.log('🚌 [RotaIntegrationService] Iniciando rota via API:', params);

      // Chama a API
      const resultado = await rotaService.iniciarRota(params);
      console.log('📡 [RotaIntegrationService] Resposta da API:', resultado);

      if (resultado.success) {
        console.log('✅ [RotaIntegrationService] Rota iniciada na API, integrando localmente...');
        
        // Notifica o sistema local (hook MQTT)
        if (this.callbacks.onRotaIniciada) {
          console.log('🔗 [RotaIntegrationService] Chamando callback onRotaIniciada...');
          this.callbacks.onRotaIniciada(params.linha, params.capacidade);
        } else {
          console.warn('⚠️ [RotaIntegrationService] Callback onRotaIniciada não configurado!');
        }

        return true;
      } else {
        throw new Error('Falha na resposta da API');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [RotaIntegrationService] Erro ao iniciar rota:', errorMessage);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(errorMessage);
      }

      return false;
    }
  }

  // Método de conveniência para ativar Santana via API
  async ativarSantanaViaAPI(capacidade: number = 50): Promise<boolean> {
    return this.iniciarRota({
      motorista_id: 'API_001',
      linha: 'santana',
      prefixo: 'API_BUS',
      capacidade
    });
  }
}

// Singleton instance
export const rotaIntegrationService = new RotaIntegrationService();
